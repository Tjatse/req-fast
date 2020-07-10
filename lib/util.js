'use strict'

var qs = require('querystring')
var URI = require('urijs')
var tunnel = require('tunnel2')
var UserAgent = require('user-agents')
var http = require('http')
var https = require('https')
var debug = require('debug')('reqfast.util')

var util = module.exports
var regCookieParams = /(path|domain|expires)/i
var postMethods = ['POST', 'PUT', 'PATCH']
var allowedMethods = ['OPTIONS', 'GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'TRACE', 'CONNECT']
var allowedDataType = ['JSON', 'FORM']
var userAgent = new UserAgent()

util.postMethods = postMethods

/**
 * Get cookies from response headers.
 * @param {Object} reqCookies
 * @return {*}
 */
util.cookieJar = function (reqCookies) {
  debug('-> making cookie Jar...')
  if (!Array.isArray(reqCookies)) {
    debug.enabled && debug('-->> %s', !reqCookies ? 'N/A' : String(reqCookies))
    debug('-->> Not an array, returns nothing')
    return {}
  }
  if (reqCookies.length === 0) {
    debug('-->> An empty array, returns nothing')
    return {}
  }
  // get cookies
  var resCookies = {}
  reqCookies.forEach(function (cookies) {
    if (!cookies) {
      return
    }
    cookies.split(';').forEach(function (cookie) {
      if (!cookie) {
        return
      }
      var pair = cookie.split('=')
      var key
      if (pair.length === 2 && (key = pair[0].trim()) && !regCookieParams.test(key)) {
        var val = pair[1].trim()
        if (val) {
          debug.enabled && debug('-->> "%s"="%s"', key, val)
          resCookies[key] = val
        }
      }
    })
  })
  return resCookies
}

/**
 * next i/o event
 * @param {Function} fn
 * @param {Object} ctx
 */
util.next = function (fn, ctx) {
  var io
  if (typeof setImmediate !== 'undefined') {
    io = setImmediate
    debug('-> next by setImmediate')
  } else {
    io = process.nextTick
    debug('-> next by nextTick')
  }
  io(fn.bind(ctx))
}

/**
 * Generate options.
 * @param {Object} options
 */
util.genOptions = function (options) {
  var retVal = {}
  // reset max redirects to three.
  if (!options.disableRedirect) {
    options.maxRedirects = typeof options.maxRedirects === 'number' ? options.maxRedirects : 3
    debug.enabled && debug('-> max redirects: %d', options.maxRedirects)
  } else {
    debug('-> disabled redirect')
  }

  // cookies
  debug('-> append cookies')
  var cookies = options.cookies && Object.keys(options.cookies).map(function (key) {
    var val = options.cookies[key]
    debug.enabled && debug('-->> "%s"="%s"', key, val)
    return encodeURIComponent(key) + '=' + encodeURIComponent(val)
  }).join(';')
  delete options.cookies

  // headers' keys with lowercase.
  var headers = {
    'connection': 'keep-alive',
    'accept': 'text/html,text/javascript,application/json,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'cookie': cookies || ''
  }
  debug('-> append headers')
  if (options.headers && typeof options.headers === 'object') {
    for (var k in options.headers) {
      var key = k.trim().toLowerCase()
      var val = options.headers[k].trim()
      debug('-->> "%s"="%s"', key, val)
      headers[key] = val
    }
  }

  // gzip
  if (!options.disableGzip) {
    debug('-> gzip: YES')
    headers['accept-encoding'] = 'gzip,deflate,sdch'
  } else {
    debug('-> gzip: NO')
    delete headers['accept-encoding']
  }

  // http 1.0+ no-cache
  headers.pragma = headers.pragma || 'no-cache'
  // http 1.1 no-cache
  headers['cache-control'] = headers['cache-control'] || 'no-cache'

  // make sure data exists
  if (typeof options.data !== 'object' || Object.keys(options.data).length === 0) {
    debug('-> no datum')
    delete options.data
  }

  if (!options.method && options.data) {
    options.method = 'POST'
  }
  options.method && (options.method = options.method.toUpperCase())
  // http 1.1
  if (!~allowedMethods.indexOf(options.method)) {
    options.method = 'GET'
  }
  debug.enabled && debug('-> method: %s', options.method)

  // generate trackCookie.
  if (typeof options.trackCookie !== 'boolean') {
    options.trackCookie = false
  }
  debug.enabled && debug('-> track cookie: %s', options.trackCookie ? 'YES' : 'NO')

  // generate user-agent.
  if (typeof options.agent !== 'boolean') {
    options.agent = true
  }
  if (options.agent) {
    var ua = headers['user-agent'] || userAgent.random().toString()
    debug.enabled && debug('-> generating user agent: %s', ua)
    headers['user-agent'] = ua
  }
  delete options.agent

  // data type.
  if (options.dataType) {
    options.dataType = options.dataType.toUpperCase()
  }
  if (!options.dataType || !~allowedDataType.indexOf(options.dataType)) {
    options.dataType = 'JSON'
  }
  debug.enabled && debug('-> data type: %s', options.dataType)
  var dataUtil = {
    'JSON': { wrapper: JSON, contentType: 'application/json' },
    'FORM': { wrapper: qs, contentType: 'application/x-www-form-urlencoded' }
  }

  // raw uri.
  var uriEntity = URI(options.uri)

  // If the host was defined manually, we leave it there
  if (!headers.host) {
    headers.host = uriEntity.host()
  } else {
    debug.enabled && debug('-> defined host: %s', headers.host)
  }

  if (options.data) {
    if (!!~postMethods.indexOf(options.method)) { // eslint-disable-line no-extra-boolean-cast
      options._data = dataUtil[options.dataType].wrapper.stringify(options.data)
      // TODO: file, multipart/form-data
      var ctKey = 'content-type'
      var ctExist = typeof headers[ctKey] !== 'undefined'
      headers[ctKey] = (ctExist ? (headers[ctKey] + ';') : '') + dataUtil[options.dataType].contentType
      var dataLength = Buffer.byteLength(options._data, 'utf-8')
      headers['content-length'] = dataLength
      debug.enabled && debug('-> %s: %s, %d bytes', ctKey, headers[ctKey], dataLength)
    } else {
      var query
      uriEntity.search(qs.stringify(options.data) + ((query = uriEntity.query()) ? ('&' + query) : ''))
    }
  }

  retVal.client = util.analyzeUri(uriEntity, options)

  // proxy.
  if (typeof options.proxy !== 'object' || !options.proxy.host) {
    // CAUTION: proxy must be an JSON object, and including "host" field at least.
    //    https://www.npmjs.org/package/tunnel
    delete options.proxy
  }
  if (options.proxy) {
    var agentOptions = options.proxyOptions
    if (typeof agentOptions !== 'object') {
      agentOptions = {}
    }
    agentOptions.proxy = options.proxy
    options.agent = tunnel[options.__protocol + 'OverHttp'](agentOptions)
    debug('-> proxy')
    debug.enabled && debug(JSON.stringify(agentOptions, null, 2))
    delete options.proxy
    delete options.proxyOptions
  }
  debug(`-> request headers: ${JSON.stringify(headers, null, 2)}`)
  options.headers = headers

  retVal.options = options
  return retVal
}

/**
 * Analyze the uri and generate request client, host, port, protocol...
 * @param {uri} uriEntity
 * @param {Object} options
 */
util.analyzeUri = function (uriEntity, options) {
  options.path = uriEntity.path() + uriEntity.search()
  options.host = uriEntity.hostname()
  options.port = uriEntity.port()

  // reset host in headers.
  if (options.headers) {
    debug.enabled && debug('-> host: %s', options.host)
    options.headers.host = options.host
  }
  // http && https
  if (uriEntity.protocol() === 'https') {
    !options.port && (options.port = 443)
    // can not use protocol here, complicated with [http.request]'s options.
    options.__protocol = 'https'
    debug('-> https on %d', options.port)
    return https
  }
  !options.port && (options.port = 80)
  options.__protocol = 'http'
  debug('-> http on %d', options.port)
  return http
}
