'use strict'

var reqStream = require('./req_stream')
var qs = require('querystring')
var iconv = require('iconv-lite')
var debug = require('debug')('reqfast.request')

var util = require('./util')
var regUTF8 = /^utf-*8$/i
var regMeta = /<meta(?!\s*(?:name|value)\s*=)[^>]*?charset\s*=[\s"']*([^\s"'/>]*)/i
var regIEComments = /<!--\[if [lg]te? IE \d+\]>.+<!\[endif\]-->/gi

module.exports = req

/**
 * request server.
 *  @example see README.md
 * @param {Object} options settings
 * @param {Function} fn callback
 * @return {RequestStream}
 */
function req (options, fn) {
  var rs = reqStream(options)
  if (!fn) {
    return rs
  }

  // Callback one time.
  var callback = (function () {
    var executed = false
    return function () {
      if (!executed) {
        executed = true
        fn.apply(null, arguments)
      }
    }
  })()
  var resp
  var chunks = []
  var offset = 0

  rs.on('error', function (error, response) {
    debug.enabled && debug('<- got error: %s', error.toString())
    callback(error, response)
  })
  rs.on('meta', function (meta) {
    debug('<- got meta data:')
    debug.enabled && debug(JSON.stringify(meta, null, 2))
    resp = meta
  })
  rs.on('data', function (chunk) {
    chunks.push({ buffer: chunk, offset: offset })
    offset += chunk.length
    debug('<- got data: +%d bytes', offset)
  })
  rs.on('end', function (req) {
    debug('<- end')
    debug('analyzing body buffers...')
    var bodyBuffer = new Buffer(offset)
    chunks.forEach(function (chunk) {
      chunk.buffer.copy(bodyBuffer, chunk.offset)
    })
    if (this.options.encoding) {
      bodyBuffer = bodyBuffer.toString(this.options.encoding)
    }

    resp.body = bodyBuffer

    debug('analyzing cookies...')
    var lastCookies = util.cookieJar(resp.headers['set-cookie'])
    // merge cookies.
    if (resp.cookies) {
      for (var k in lastCookies) {
        resp.cookies[k] = lastCookies[k]
      }
    } else {
      resp.cookies = lastCookies
    }

    debug('analyzing content...')
    var contentType = _getContentType(resp)
    var charset = options.charset || contentType.charset || 'utf-8'
    if (!regUTF8.test(charset)) {
      try {
        resp.body = _decodeBody(resp.body, charset)
      } catch (err) {
        debug.enabled && debug('-> failed to decode body: %s, fallback to utf-8', err.toString())
        charset = 'utf-8'
        try {
          resp.body = _decodeBody(resp.body, charset)
        } catch (err) {
          debug.enabled && debug('-> failed to decode body with utf-8: %s', err.toString())
          return callback(err, resp)
        }
      }
    }
    if (typeof resp.body !== 'string') {
      resp.body = resp.body.toString()
    }
    if (contentType.mime === 'application/json') {
      try {
        debug('-> JSON parsing...')
        resp.body = JSON.parse(resp.body)
      } catch (err) {
        debug.enabled && debug('-> faile to parse body to the JSON format: %s', err.message)
        // Ignore parse error.
      }
    }
    debug('completed')
    callback(null, resp)
  })
  return rs
}

function _decodeBody (body, to) {
  debug.enabled && debug('-> decode content with %s encoding', to)
  var buf = Buffer.isBuffer(body) ? body : Buffer(body)
  return iconv.decode(buf, to)
}

function _getContentType (resp) {
  var ct = resp.headers['content-type']
  var mime = ct
  var charset
  if (ct) {
    debug.enabled && debug('-> content type: %s', ct)
    var ctIndex = ct.indexOf(';')
    if (ctIndex > 0) {
      mime = ct.substr(0, ctIndex)
      debug.enabled && debug('-> MIME: %s', mime)
      var charsets = qs.parse(ct.substr(ctIndex + 1))
      for (var key in charsets) {
        if (key.toLowerCase().trim() === 'charset') {
          charset = charsets[key].trim()
          debug.enabled && debug('-> charset: %s', charset)
          break
        }
      }
    }
  }

  if (!charset && mime === 'text/html') {
    var html = resp.body.toString('ascii').replace(regIEComments, '')
    var meta
    if ((meta = html.match(regMeta)) && meta.length > 1) {
      charset = meta[1]
      debug.enabled && debug('-> got charset from HTML: %s', charset)
    }
  }
  return {
    mime: mime,
    charset: charset
  }
}
