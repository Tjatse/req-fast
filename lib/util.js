var qs = require('querystring'),
  URI = require('urijs'),
  http = require('http'),
  https = require('https'),
  tunnel = require('tunnel'),
  ua = require('random-ua');

var util = module.exports;

/**
 * Get cookies from response headers.
 * @param {Object} reqCookies
 * @return {*}
 */
util.cookieJar = function(reqCookies){
  if (!reqCookies) {
    return {};
  }
  // get cookies
  var resCookies = {};

  reqCookies.forEach(function (cookies) {
    if (!cookies) {
      return;
    }
    cookies.split(';').forEach(function (cookie) {
      var kv = cookie.split('=');
      if (kv.length == 2 && kv[0].trim() && kv[0].search(/(path|domain|expires)/i) == -1) {
        resCookies[kv[0].trim()] = kv[1].trim();
      }
    });
  });
  return resCookies;
};

/**
 * next i/o event
 * @param {Function} fn
 * @param {Object} ctx
 */
util.next = function(fn, ctx){
  var io;
  if (typeof setImmediate != 'undefined') {
    io = setImmediate;
  } else {
    io = process.nextTick;
  }
  io(fn.bind(ctx));
}

/**
 * Generate options.
 * @param {Object} options
 */
util.genOptions = function (options) {
  var retVal = {};
  // reset max redirects to three.
  if (!options.disableRedirect && typeof options.maxRedirects != 'number') {
    options.maxRedirects = 3;
  }

  // cookies
  var cookies = options.cookies && Object.keys(options.cookies).map(function(key){
    return key + '=' + options.cookies[key];
  }).join(';');

  // headers' keys with lowercase.
  var headers = {
    'connection':'keep-alive',
    'accept':'text/html,text/javascript,application/json,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'cookie':cookies || ''
  };
  if (options.headers && typeof options.headers == 'object') {
    for (var k in options.headers) {
      headers[k.toLowerCase()] = options.headers[k];
    }
  }
  delete options.cookies;

  // gzip
  if (!options.disableGzip) {
    headers['accept-encoding'] = 'gzip,deflate,sdch';
  } else {
    delete headers['accept-encoding'];
  }

  // http 1.0+ no-cache
  headers.pragma = headers.pragma || 'no-cache';
  // http 1.1 no-cache
  headers['cache-control'] = headers['cache-control'] || 'no-cache';

  // make sure data exists;
  if(typeof options.data != 'object' || Object.keys(options.data).length <= 0){
    delete options.data;
  }
  if (!options.method && options.data) {
    options.method = 'POST';
  }
  options.method && (options.method = options.method.toUpperCase());

  // http 1.1
  if(!~['OPTIONS', 'GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'TRACE', 'CONNECT'].indexOf(options.method)){
    options.method = 'GET';
  }
  // generate trackCookie.
  if(typeof options.trackCookie != 'boolean'){
    options.trackCookie = false;
  }

  // generate user-agent.
  if(typeof options.agent != 'boolean'){
    options.agent = true;
  }
  if (options.agent) {
    headers['user-agent'] = ua.generate();
  }
  delete options.agent;

  // data type.
  if(options.dataType){
    options.dataType = options.dataType.toUpperCase();
  }
  if(!options.dataType || !~['JSON', 'FORM'].indexOf(options.dataType)){
    options.dataType = 'JSON';
  }
  var dataUtil = {
    'JSON': { wrapper: JSON, contentType: 'application/json' },
    'FORM':{ wrapper: qs, contentType: 'application/x-www-form-urlencoded' }
  };

  // raw uri.
  var uriEntity = URI(options.uri);
  headers.host = uriEntity.host();

  if (options.data) {
    if(!!~['POST', 'PUT', 'PATCH'].indexOf(options.method)){
      options._data = dataUtil[options.dataType].wrapper.stringify(options.data);
      // TODO: file, multipart/form-data
      var ctKey = 'content-type', ctExist = (ctKey in headers);
      headers[ctKey] = (ctExist ? (headers[ctKey] + ';') : '') + dataUtil[options.dataType].contentType;
      headers['content-length'] = Buffer.byteLength(options._data, 'utf-8');
    }else{
      var query;
      uriEntity.search( qs.stringify(options.data) + ((query = uriEntity.query()) ? ('&' + query) : ''));
    }
  }

  retVal.client = util.analyzeUri(uriEntity, options);

  // proxy.
  if (typeof options.proxy != 'object' || !options.proxy.host) {
    // CAUTION: proxy must be an JSON object, and including "host" field at least.
    //    https://www.npmjs.org/package/tunnel
    delete options.proxy;
  }

  if (options.proxy) {
    options.agent = tunnel[options.__protocol + 'OverHttp']({
      proxy:options.proxy
    });
    delete options.proxy;
  }
  options.headers = headers;

  retVal.options = options;
  return retVal
};

/**
 * Analyze the uri and generate request client, host, port, protocol...
 * @param {uri} uriEntity
 * @param {Object} options
 */
util.analyzeUri = function(uriEntity, options){
  options.path = uriEntity.path() + uriEntity.search();
  options.host = uriEntity.hostname();
  options.port = uriEntity.port();

  // reset host in headers.
  if (options.headers) {
    options.headers.host = options.host;
  }
  // http && https
  if (uriEntity.protocol() == 'https') {
    !options.port && (options.port = 443);
    // can not use protocol here, complicated with [http.request]'s options.
    options.__protocol = 'https';

    return https;
  } else {
    !options.port && (options.port = 80);
    options.__protocol = 'http';

    return http;
  }
};