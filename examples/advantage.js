var req = require('../');
req({
  url: 'http://httpbin.org/get',  // url and uri are both fine.
  method: 'GET',                  // could be one of OPTIONS, GET, HEAD, POST, PUT, PATCH, DELETE, TRACE and CONNECT
  timeout: 10000,                 // millisecond(s)
  dataType: 'JSON',               // `json` or `form`, `json` as default, this property effects on POST, PUT, PATCH `method` only.
  data: {                         // JSON Object
    q: 'req-fast',
    v: 0.1
  },
  agent: true,                    // automatic generate `user-agent` header.
  charset: 'utf-8',               // set charset of content encodings if necessary. this option takes top priority of
                                  // decoding chunks, if not set, the charset in response.headers['content-type'] will
                                  // be used at first, then the charset on <meta ... />.
  disableRedirect: false,         // enabled following redirects(false as default).
  maxRedirects: 10,               // maximize redirects(3 as default).
  disableGzip: false,             // enabled `gzip,deflate,shcd` encodings and automatic decompress content encodings(false as default).
  cookies: {                      // JSON Object
    token: 'abcdef123'
  },
  headers: {                      // JSON Object
    referer: 'http://www.google.com'
  }/*,
  proxy: {
    host: '[HOST]',
    port: [PORT],
    localAddress: '[LOCALADDRESS]',
    proxyAuth: 'user:password',
    headers: [JSON Object]
  }*/
}, function(err, resp){
  if(err){
    return console.log('[ERROR]', err.message);
  }

  console.log(resp);
});