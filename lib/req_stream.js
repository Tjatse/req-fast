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
  URI = require('URIjs'),
  util = require('util'),
  http = require('http'),
  myUtil = require('./util'),
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

  var finalOptions = myUtil.genOptions(options);
  for(var k in finalOptions){
    this[k] = finalOptions[k];
  }
  finalOptions = null;

  myUtil.next(this.request, this);
};

// begin http request.
RequestStream.prototype.request = function () {
  // memorize redirects
  if(typeof this.redirects == 'undefined'){
    this.redirects = [];
  }

  // memorize cookies
  if(typeof this.cookies == 'undefined' && this.options.trackCookie){
    this.cookies = {};
  }

  try {
    var req = this.client.request(this.options, function(res){
      var status = res.statusCode;
      if (!!~[301, 302, 303].indexOf(status)) {
        if (!this.options.disableRedirect && this.redirects.length < this.options.maxRedirects) {
          var nextTarget = URI(res.headers.location).absoluteTo(this.options.uri);
          this.redirects.push(nextTarget.valueOf());

          // reset client, host
          this.client = myUtil.analyzeUri(nextTarget, this.options);

          if (this.options.trackCookie) {
            var cookies = myUtil.cookieJar(res.headers['set-cookie']);
            for (var k in cookies) {
              this.cookies[k] = cookies[k];
            }
          }
          // CAUTION: abort previous request at first.
          try {
            req && req.abort();
            req = null;
          } catch (err) {
          }
          return myUtil.next(this.request, this);
        } else {
          // just fake it, no more redirects.
          status = 200;
        }
      }
      // not okay
      if (status < 200 || status > 207) {
        return this.emit('error', new Error(status + ' ' + (http.STATUS_CODES[status] || 'status code.')), {statusCode: status});
      }
      // on data was received
      function onData(o, chunk){
        if (req._aborted) {
          o.removeAllListeners();
          return onError.call(this, new Error('ETIMEOUT'));
        }
        if (chunk && chunk.length > 0) {
          this.emit('data', this.options.encoding ? chunk.toString(this.options.encoding) : chunk);
        }
      }

      // on error was caught
      function onError(error){
        this.emit('error', error);
      }

      // on the end
      function onEnd(o){
        if (req._aborted) {
          o.removeAllListeners();
          return onError.call(this, new Error('ETIMEOUT'));
        }
        this.emit('end');
      }

      this.emit('extra', {
        headers   : res.headers,
        redirects : this.redirects,
        cookies   : this.cookies,
        statusCode: res.statusCode
      });
      delete this.redirects;
      delete this.cookies;

      // gzip,deflate encoding
      var encoding;
      if (!this.options.disableGzip && (encoding = res.headers['content-encoding'])) {
        encoding = encoding.toLowerCase();
        var method = {'gzip': ['Gunzip'], 'deflate': ['Inflate', 'InflateRaw']}[encoding];

        if (method) {
          this._unzipErrors = {};
          this._unzipFactories = {};
          return method.forEach(function (m) {
            this._unzipErrors[m] = false;
            var gz = zlib['create' + m]();
            gz.on('data', onData.bind(this, gz));
            gz.on('end', onEnd.bind(this, gz));
            gz.once('error', function (error) {
              this._unzipErrors[m] = true;
              this._unzipFactories[m].removeAllListeners();
              delete this._unzipFactories[m];

              var allFailed = true;
              for (var k in this._unzipErrors) {
                allFailed = allFailed && this._unzipErrors[k];
              }
              if (allFailed) {
                delete this._unzipErrors;
                delete this._unzipFactories;
                onError.call(this, error);
              }
            }.bind(this));
            res.pipe(gz);
            this._unzipFactories[m] = gz;
          }, this);
        }
      }

      // normalize
      res.on('data', onData.bind(this, res));
      res.on('end', onEnd.bind(this, res));
      res.once('error', onError.bind(this));
    }.bind(this));

    // timeout.
    if (typeof this.options.timeout == 'number') {
      req.setTimeout(this.options.timeout, function(){
        try {
          req.abort();
        } catch (err) {
        }
        req._aborted = true;
      }.bind(this));
    }
    // on error.
    req.once('error', function(error){
      this.emit('error', error);
    }.bind(this));

    // send data if necessary.
    if (!!~['POST', 'PUT', 'PATCH'].indexOf(this.options.method) && this.options._data) {
      req.write(this.options._data);
    }
    delete this.options._data;

    // sent.
    req.end();
  }catch(err){
    this.emit('error', new Error('Request failed due to ' + err.message), {statusCode: 503});
  }
};