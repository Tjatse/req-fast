# req-fast
[![Build Status](https://travis-ci.org/Tjatse/req-fast.svg)](https://travis-ci.org/Tjatse/req-fast) [![NPM version](https://badge.fury.io/js/req-fast.svg)](http://badge.fury.io/js/req-fast)

This module is designed to be the fast, lightweight way to fetch the web content(HTML stream) from specific server. it supports:
- Follow Redirects
- Automatic Decoding Content Encodings(Avoid Messy Codes, Especially Chinese)
- Cookies
- JSON Response Auto Handling
- Gzip/Deflate Encoding(Automatic Decompress)
- Proxy

## Installation
```
npm install req-fast
```

## Usage
```javascript
var req = require('req-fast');
req(options, callback);
```
### Options
When options is instance of **String**, it means the URL of server that to be requested.
```javascript
req('http://www.google.com', function(err, resp){
  // code goes here...
});
```

Otherwise it should be an object, including:
  - **uri || url** A url to which the request is sent.
  - **method** Http method, `GET` as default, but if `data` was set and this value was undefined, it will be `POST`. And it could be one of *OPTIONS*, *GET*, *HEAD*, *POST*, *PUT*, *PATCH*, *DELETE*, *TRACE* and *CONNECT*.
  - **timeout** Set a timeout (in milliseconds) for the request.
  - **dataType** Type of data that you are expecting send to server, this property effects on POST, PUT, PATCH `method` only. It could be below values:
    - **json** `content-type` equals `application/json`.
    - **form** `content-type` equals `application/x-www-form-urlencoded`.
  - **data** Data to be sent to the server, it should be key/value pairs. If the method is not set to `POST`, it will be converted to a query string, and appended to the `url`.
  - **agent** A value indicating whether automatic generating browser-like `user-agent`, i.e.:`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.101 Safari/537.36`, `true` as default.

    > Once `user-agent` was generated, the `Process finished with exit code 0` thing will not happen unless triggered manually, i.e.: COMMAND+C or `process.exit(0)`.
  - **charset** Set charset of content encodings if necessary.

    > This option takes top priority of decoding chunks, if not set, the `charset` in `response.headers['content-type']` will be used at first, then the `charset` on `<meta ... />`.
  - **disableRedirect** A value indicating whether disable following redirect or not, if this value was set to `true`, the `maxRedirects` will has no effect.
  - **maxRedirects** The maximum number of redirects to follow(3 as default).
  - **disableGzip** Request compressed content from server and automatic decompress response content, if this option sets to `true`, this feature will be disabled.
  - **trackCookie** A value indicating whether gathering all the cookies when following redirect or not, `false` by default, `false` means gathering the cookie of last request only.
  - **cookies** It should be key/value pairs.
  - **headers** Http headers, it should be key/value pairs, and some default values were:

    ```javascript
    {
      'connection': 'keep-alive',
      'accept': 'text/html, text/javascript, application/json, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8',
      'pragma': 'no-cache',
      'cache-control': 'no-cache'
    }
    ```
    > You can override those in the `headers`.
  - **proxy** The proxy including all the options from [tunnel](https://www.npmjs.org/package/tunnel) proxy:
    - **host** A domain name or IP address of the server to issue the proxy request to.
    - **port** Port of remote proxy server..
    - **localAddress** Local interface if necessary.
    - **proxyAuth** Basic authorization for proxy server if necessary, i.e. `username:password`.
    - **headers** An object containing request headers.

### Callback
Function to be called if the request succeeds or fails. The function gets passed two argument:
  - **error** The `Error` instance. if succeeds, this value should be `null`. If status is not okay, `error.message` should be one of [http.STATUSCODES](http://nodejs.org/api/http.html#http_http_status_codes).
  - **response** the response object, including:
    - **body** The response body. If `response.headers['content-type']` equals `application/json`, the data(response.body) back from server will be parsed as JSON automatic, otherwise is `String`.
    - **cookies** The response cookies(key/value pairs).
    - **headers** The response headers(key/value pairs).
    - **redirects** The urls redirect(Array).
    - **statusCode** The response status code.

> see test or examples folder for a complete example

## Streaming
Stream is amazing in node.js, if you are interesting on it, read [John's Blog](http://ejohn.org/blog/node-js-stream-playground/). You can add listeners on the returning Stream if you want.
```javascript
var rs = req([options]);
rs.on('data', function(chunk){
  // ...
});
rs.on('end', function(resp){
  // ...
});
rs.on('error', function(error){
  // ...
});
```
### Pipe to file
In my project, I will download millions of files from servers, using `pipe` could improving performance, the file downloading from server chunk by chunk, but not read whole file to memory then download once, it sucks.
```javascript
var fs = require('fs');
req('http://example.com/beauty.gif').pipe(fs.createWriteStream('download/001.gif'));
```

## Http Status
All the http statuses will be handled, but you'd better check status carefully.
```javascript
req('http://example.com', function(err, resp){
  if(err){
    // get status error;
  }
  // statusCode always exist except STREAM `error` was caught.
  var status = resp && resp.statusCode;
})
```

## Proxy
```javascript
req({
  url: 'http://example.com',
  proxy: {
    host: '127.0.0.1',  // host
    port: 8082,         // port
    proxyAuth: 'user:password'  // authentication if necessary.
  }
}, function(err, resp){
  // code goes here
});
```

## Benchmark
It's comparing with `request` module, in order to avoid the influence of network, all the requests are sent to localhost.
The test cases are just for referencing, it's not trustworthy ^^.

### Run Server
```
node benchmark/server.js
```

### Elapsed Time
```
node benchmark/elapsed_time.js
```

```
A sample of 1000 cases:
request x 1.177 ms (+834.58%, -100.00%).
req-fast x 1.062 ms (+1218.27%, -100.00%).
```

### Memory Usage
```
node benchmark/memory_usage.js
```

```
A sample of 1000 cases:
request x 20729.856 bytes (+11458.98%, -100.00%).
req-fast x 18063.36 bytes (+19038.32%, -100.00%).
```

> GC effects these a lot, and I do not believe the result of `process.memoryUsage().rss`, `request` should performances better.

## Tests
Most tests' requests are sent to [httpbin](http://httpbin.org), so if you wanna run the test, please make sure you can resolve the host(httpbin).
Run test:
```
npm test
```

## Thanks
Appreciate to andris9. I've used [fetch](https://github.com/andris9/fetch) for a long time, it's very fast and simple to use.
> my ES Spider needs speed up, [request](https://github.com/mikeal/request) is very powerful,
> but too heavy/slow to me, and can not automatic decode encodings, especially Chinese.

Unfortunately andris9 could not maintain his repository any more, it have bugs, also I can fix them
in my project, but it's fussy. One more, I need a PROXY feature.

## License
Copyright 2014 Tjatse

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.


