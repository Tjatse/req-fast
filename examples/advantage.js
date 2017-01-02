'use strict'

var req = require('../')

req({
  // url and uri are both fine.
  url: 'http://httpbin.org/get',
  // could be one of OPTIONS, GET, HEAD, POST, PUT, PATCH, DELETE, TRACE and CONNECT
  method: 'GET',
  // millisecond(s)
  timeout: 10000,
  // `json` or `form`, `json` as default, this property effects on POST, PUT, PATCH `method` only.
  dataType: 'JSON',
  // JSON Object
  data: {
    q: 'req-fast',
    v: 0.1
  },
  // automatic generate `user-agent` header.
  agent: true,
  // set charset of content encodings if necessary. this option takes top priority of
  // decoding chunks, if not set, the charset in response.headers['content-type'] will
  // be used at first, then the charset on <meta ... />.
  charset: 'utf-8',
  // enabled following redirects(false as default).
  disableRedirect: false,
  // maximize redirects(3 as default).
  maxRedirects: 10,
  // enabled `gzip,deflate,shcd` encodings and automatic decompress content encodings(false as default).
  disableGzip: false,
  // JSON Object
  cookies: {
    token: 'abcdef123'
  },
  // JSON Object
  headers: {
    referer: 'http://www.google.com'
  },
  proxy: {
    host: '[HOST]',
    port: 8088,
    localAddress: '[LOCALADDRESS]',
    proxyAuth: 'user:password',
    headers: {}
  }
}, (err, resp) => {
  if (err) {
    return console.log('[ERROR]', err.message)
  }

  console.log(resp)
})
