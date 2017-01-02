'use strict'

var URI = require('urijs')
var zlib = require('zlib')
var util = require('util')
var http = require('http')
var Stream = require('stream').Stream
var debug = require('debug')('reqfast.stream')

var myUtil = require('./util')

var unzipFactories = {
  gzip: ['Gunzip'],
  deflate: ['Inflate', 'InflateRaw']
}

module.exports = RequestStream

/**
 * RequestStream that streams http response.
 * @param {Object} options settings.
 * @return {Stream} RequestStream
 * @api private
 */
function RequestStream (options) {
  if (!(this instanceof RequestStream)) {
    return new RequestStream(options)
  }

  Stream.call(this)
  debug('verifying options...')
  // check options.
  var optionsType = typeof options
  if (optionsType === 'string') {
    options = { uri: options }
  } else if (optionsType !== 'object' || (!options.uri && !options.url)) {
    return this.emit('error', new Error('wrong type of options.'))
  }

  // use uri instead of url.
  if (options.url) {
    debug('use uri instead of url')
    options.uri = options.url
    delete options.url
  }

  var finalOptions = myUtil.genOptions(options)
  for (var k in finalOptions) {
    this[k] = finalOptions[k]
  }
  finalOptions = null

  this._data = {}

  myUtil.next(this.request, this)
}

util.inherits(RequestStream, Stream)

// begin http request.
RequestStream.prototype.request = function () {
  debug('requesting...')
  // memorize redirects
  if (!Array.isArray(this._data.redirects)) {
    debug('-> initial redirects')
    this._data.redirects = []
  }

  // memorize cookies
  if (typeof this._data.cookies !== 'object' && this.options.trackCookie) {
    debug('-> initial cookies')
    this._data.cookies = {}
  }

  try {
    var req = this.client.request(this.options, function (res) {
      var status = res.statusCode
      debug.enabled && debug('-> status code: %d', status)
      if (status >= 300 && status < 400) {
        if (!this.options.disableRedirect && this._data.redirects.length < this.options.maxRedirects) {
          // handle `URI malformed` error.
          try {
            var nextTarget = URI(res.headers.location).absoluteTo(this.options.uri)
            var nextTargetUrl = nextTarget.valueOf()
            this._data.redirects.push(nextTargetUrl)
            debug.enabled && debug('-> redirecting to %s', nextTargetUrl)
            // reset client, host
            this.client = myUtil.analyzeUri(nextTarget, this.options)
          } catch (err) {
            return this.emit('error', err, res)
          }

          if (this.options.trackCookie) {
            debug('-> tracking cookies...')
            var cookies = myUtil.cookieJar(res.headers['set-cookie'])
            for (var k in cookies) {
              this._data.cookies[k] = cookies[k]
            }
          }
          // CAUTION: abort previous request at first.
          _safeAbort(req)
          return myUtil.next(this.request, this)
        }
        debug('-> non-redirect')
        // just fake it, no more redirects.
        status = 200
      }
      if (status < 200 || status > 207) {
        return this.emit('error', new Error(status + ' ' + (http.STATUS_CODES[status] || 'status code.')), res)
      }

      this.handleResponse(req, res)
    }.bind(this))

    // timeout.
    var timeout = this.options.timeout
    if (typeof timeout !== 'number') {
      timeout = 60000
    }
    debug.enabled && debug('-> set timeout: %dms', timeout)
    req.setTimeout(timeout, function () {
      _safeAbort(req)
    })
    // on error.
    req.once('error', this.emit.bind(this, 'error'))
    // on abort, and abort call
    req.once('abort', this.emit.bind(this, 'abort'))
    this.abort = req.abort.bind(req)
    // send data if necessary.
    if (!!~myUtil.postMethods.indexOf(this.options.method) && this.options._data) {
      debug('-> posting data...')
      req.write(this.options._data)
    }
    delete this.options._data
    // sent.
    req.end()
    debug('-> sent')
  } catch (err) {
    this.emit('error', err)
  }
}

RequestStream.prototype.handleResponse = function (request, response) {
  var decompressed

  debug('-> emit meta data')
  this.emit('meta', {
    headers: response.headers,
    statusCode: response.statusCode,
    redirects: this._data.redirects,
    cookies: this._data.cookies
  })
  delete this._data.redirects
  delete this._data.cookies

  // gzip,deflate encoding
  var encoding
  if (!this.options.disableGzip && (encoding = response.headers['content-encoding'])) {
    encoding = encoding.toLowerCase()
    debug.enabled && debug('-> encoding (%s)', encoding)

    var method = unzipFactories[encoding]
    if (method) {
      debug('-> decode with:')
      this._unzip = {errors: {}, factories: {}}
      return method.forEach(function (m) {
        if (decompressed) {
          debug.enabled && debug('-->> %s (x)', m)
          return
        }
        debug.enabled && debug('-->> %s (√)', m)
        this._unzip && (this._unzip.errors[m] = false)

        var gz = zlib['create' + m]()
        gz.on('data', onData.bind(this, gz))
        gz.on('end', onEnd.bind(this, gz))
        gz.once('error', onError.bind(this, gz))

        response.pipe(this._unzip.factories[m] = gz)
      }, this)
    }
  }

  // normalize
  response.on('data', onData.bind(this, response))
  response.on('end', onEnd.bind(this, response))
  response.once('error', onError.bind(this, response))

  // continue request or not.
  function shouldContinue (res) {
    var abortedForce = request._aborted
    var name = res.constructor.name
    if (abortedForce || (decompressed && decompressed !== name)) {
      res.removeAllListeners()
      if (this._unzip) {
        delete this._unzip.factories[name]
        delete this._unzip.errors[name]
      }
      abortedForce && onError.call(this, res, new Error('ABORTED'))
      return
    }
    return name
  }

  // on data was received
  function onData (res, chunk) {
    var name
    if (!(name = shouldContinue.call(this, res))) {
      return
    }

    decompressed = name
    if (chunk && chunk.length > 0) {
      this.emit('data', this.options.encoding ? chunk.toString(this.options.encoding) : chunk)
    }
  }

  // on error was caught
  function onError (res, error) {
    var failed = true
    var name = res.constructor.name
    res.removeAllListeners()

    if (this._unzip) {
      this._unzip.errors[name] = true
      delete this._unzip.factories[name]

      for (var k in this._unzip.errors) {
        failed = (failed && this._unzip.errors[k])
      }
    }

    if (failed || (decompressed && decompressed === name)) {
      this._unzip && (delete this._unzip)
      this.emit('error', error, res)
    }
  }

  // on the end
  function onEnd (res) {
    if (!shouldContinue.call(this, res)) {
      return
    }
    this._unzip && (delete this._unzip)
    this.emit('end')
  }
}

function _safeAbort (request) {
  debug('FORCE ABORT!!!')
  try {
    request.abort()
  } catch (err) {}
  request._aborted = true
}
