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

var req_stream = require('./req_stream'),
  qs = require('querystring'),
  iconv = require('iconv-lite');

module.exports = req;

/**
 * request server.
 *  @example see README.md
 * @param {Object} options settings
 * @return {RequestStream}
 */
function req(options, callback){
  var rs = req_stream(options);

  var called = false;
  if(callback){
    rs.on('error', function(error, response){
      if(!called){
        callback(error, response);
        called = true;
      }
    });
    var resp;
    rs.on('extra', function(extra){
      resp = extra;
    });
    var chunks = [], offset = 0;
    rs.on('data', function(chunk){
      chunks.push({ buffer: chunk, offset: offset });
      offset += chunk.length;
    });
    rs.on('end', function(req){
      var bodyBuffer = new Buffer(offset);

      chunks.forEach(function(chunk){
        chunk.buffer.copy(bodyBuffer, chunk.offset);
      });

      if(this.options.encoding){
        bodyBuffer = bodyBuffer.toString(this.options.encoding);
      }

      // get cookies
      var resCookies = {},
        reqCookies = resp.headers["set-cookie"];

      if (reqCookies) {
        reqCookies.forEach(function (cookies) {
          if (!cookies) {
            return;
          }
          cookies.split(';').forEach(function (cookie) {
            var kv = cookie.split('=');
            if (kv.length == 2 && kv[1]) {
              resCookies[kv[0].trim()] = kv[1].trim();
            }
          });
        });
      }

      resp.body = bodyBuffer;
      resp.cookies = resCookies;

      var contentType = getContentType(resp),
        charset = options.charset || contentType.charset || 'utf-8';
      if(!charset.match(/^utf-*8$/i)){
        resp.body = decodeBody(resp.body, charset);
      }else if(typeof resp.body != 'string'){
        resp.body = resp.body.toString();
      }
      if(contentType.mime == 'application/json'){
        try{
          resp.body = JSON.parse(resp.body);
        }catch(err){
          // TOFIX: ignore parse error.
        }
      }
      callback(null, resp);
    });
  }
  return rs;
}

function decodeBody(body, to){
  var buf = Buffer.isBuffer(body) ? body : Buffer(body);
  return iconv.decode(buf, to);
}

function getContentType(resp){
  var ct = resp.headers['content-type'], mime = ct, charset;
  if(ct){
    var hasExt = (ct.indexOf(';') > 0);
    if(hasExt){
      mime = ct.substr(0, ct.indexOf(';'));
      var charsets = qs.parse(ct.substr(ct.substr(';') + 1));
      for(var key in charsets){
        if(key.toLowerCase().trim() == 'charset'){
          charset = charsets[key].trim();
          break;
        }
      }
    }
  }

  if(!charset && mime == 'text/html'){
    var html = resp.body.toString('ascii'), meta;
    if(meta = html.match(/<meta\scharset=["']*([a-zA-Z\d\-]*)["']*?>/i)){
      charset = meta[1];
    }
    if(!charset && (meta = html.match(/<meta[\s\S]*http-equiv=["']*content-type["']*[\s\S]*?>/i))){
      if(meta = meta[0].match(/charset\s*=\s*([a-zA-Z\d\-]*)["';]/i)){
        charset = meta[1];
      }
    }
  }
  return {
    mime: mime,
    charset: charset
  };
}
