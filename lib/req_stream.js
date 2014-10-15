// Copyright 2014 Tjatse
// https://github.com/Tjatse/req-fast
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

var Stream = require('stream').Stream,
  http = require('http'),
  https = require('https'),
  tunnel = require('tunnel'),
  URI = require('URIjs'),
  util = require('util'),
  ua = require('random-ua'),
  qs = require('querystring'),
  zlib = require('zlib');

util.inherits(RequestStream, Stream);

module.exports = RequestStream;

/**
 * RequestStream that streams http response.
 * @param {Object} options settings.
 * @return {Stream} RequestStream
 * @api private
 */
function RequestStream(options) {
  if(!(this instanceof RequestStream)){
    return new RequestStream(options);
  }

  Stream.call(this);

  // check options.
  if (typeof options == 'string') {
    options = { uri:options };
  } else if (typeof options != 'object' || (!options.uri && !options.url)) {
    return this.emit('error', new Error('wrong type of options.'))
  }

  // use uri instead of url.
  if (options.url) {
    options.uri = options.url;
    delete options.url;
  }
  this.genOptions(options);

  this.next(this.request);
};

// begin http request.
RequestStream.prototype.request = function () {
  if(typeof this.redirects == 'undefined'){
    this.redirects = [];
  }
  var req = this.client.request(this.options, function (res) {
    var status = res.statusCode;
    if(!!~[301,302,303].indexOf(status)){
      if(!this.options.disableRedirect && this.redirects.length < this.options.maxRedirects){
        var nextTarget = URI(res.headers.location).absoluteTo(this.options.uri);
        this.redirects.push(nextTarget.valueOf());

        // reset host
        this.options.headers.host = nextTarget.host();
        this.options.path = nextTarget.path() + nextTarget.search();
        this.options.host = nextTarget.hostname();
        this.options.port = nextTarget.port();

        // CAUTION: abort previous request at first.
        try{ req && req.abort(); req = null; }catch(err){ }
        return this.next(this.request);
      }else{
        // just fake it, no more redirects.
        status = 200;
      }
    }
    // not okay
    if(status < 200 || status > 207){
      return this.emit('error', new Error(status + ' ' + (http.STATUS_CODES[status] || 'status code.')), {statusCode: status});
    }

    // on data was received
    function onData(chunk){
      if (chunk && chunk.length > 0) {
        this.emit('data', this.options.encoding ? chunk.toString(this.options.encoding) : chunk);
      }
    }
    // on error was caught
    function onError(error){
      this.emit('error', error);
    }
    // on the end
    function onEnd() {
      this.emit('end');
    }

    this.emit('extra', {
      headers: res.headers,
      redirects: this.redirects,
      statusCode: res.statusCode
    });

    // gzip,deflate encoding
    var encoding;
    if(!this.options.disableGzip && (encoding = res.headers['content-encoding'])){
      encoding = encoding.toLowerCase();
      var method = {'gzip': 'Gunzip', 'deflate': 'Inflate'}[encoding];
      if(method){
        var gz = zlib['create' + method]();
        gz.on('data', onData.bind(this));
        gz.on('end', onEnd.bind(this));
        gz.once('error', onError.bind(this));
        return res.pipe(gz);
      }
    }

    // normalize
    res.on('data', onData.bind(this));
    res.on('end', onEnd.bind(this));
    res.once('error', onError.bind(this));
  }.bind(this));

  // timeout.
  if(typeof this.options.timeout == 'number'){
    req.setTimeout(this.options.timeout, req.abort);
  }

  // on error.
  req.once('error', function (error) {
    this.emit('error', error);
  }.bind(this));

  // send data if necessary.
  if(!!~['POST', 'PUT', 'PATCH'].indexOf(this.options.method) && this.options._data){
    req.write(this.options._data);
  }
  delete this.options._data;

  // sent.
  req.end();
};

// next i/o event
RequestStream.prototype.next = function(fn){
  var io;
  if (typeof setImmediate != 'undefined') {
    io = setImmediate;
  } else {
    io = process.nextTick;
  }
  io(fn.bind(this));
}

// generate options.
RequestStream.prototype.genOptions = function (options) {
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


  options.path = uriEntity.path() + uriEntity.search();
  options.host = uriEntity.hostname();
  options.port = uriEntity.port();

  // http && https
  if (uriEntity.protocol() == 'https') {
    this.client = https;
    !options.port && (options.port = 443);
    // can not use protocol here, complicated with [http.request]'s options.
    options.__protocol = 'https';
  } else {
    this.client = http;
    !options.port && (options.port = 80);
    options.__protocol = 'http';
  }

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

  this.options = options;
};