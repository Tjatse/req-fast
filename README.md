# req-fast

This module is designed to be the fast, lightweight way to fetch the web content(HTML stream) from specific server. it supports:
- Follow Redirects
- Automatic Decoding Content Encodings(Avoid Messy Codes, Especially Chinese)
- Cookies
- JSON Response Auto Handling
- Gzip/Deflate Encoding(Automatic Decompress)
- Proxy

## Installation
```javascript
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
  - **method** Http method, `GET` as default, but if `data` was set and this value was undefined, it will be `POST`.
  - **timeout** Set a timeout (in milliseconds) for the request.
  - **agent** A value indicating whether automatic generating browser-like `user-agent`, `true` as default. **CAUTION:** Once `user-agent` was generated, the `Process finished with exit code 0` thing will not happen unless triggered manually.
  - **charset** Set charset of content encodings if necessary. **CAUTION:** This option takes top priority of decoding chunks, if not set, the `charset` in `response.headers['content-type']` will be used at first, then the `charset` on `<meta ... />`.
  - **disableRedirect** A value indicating whether disable following redirect or not, if this value was set to `true`, the `maxRedirects` will has no effect.
  - **maxRedirects** The maximum number of redirects to follow(3 as default).
  - **disableGzip** Request compressed content from server and automatic decompress response content, if this option sets to `true`, this feature will be disabled.
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
  - **data** Data to be sent to the server, it should be key/value pairs. If the method is not set to `POST`, it will be converted to a query string, and appended to the `url`.
  - **proxy** The proxy including all the options from [tunnel](https://www.npmjs.org/package/tunnel) proxy:
    - **host** A domain name or IP address of the server to issue the proxy request to.
    - **port** Port of remote proxy server..
    - **localAddress** Local interface if necessary.
    - **proxyAuth** Basic authorization for proxy server if necessary, i.e. `username:password`.
    - **headers** An object containing request headers.

### Callback
Function to be called if the request succeeds or fails. The function gets passed two argument:
  - **error** The `Error` instance. if succeeds, this value should be `null`.
  - **response** the response object, including:
    - **body** The response body string.
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
})
```
### Pipe to file
In my project, I will download millions of files from servers, using `pipe` could improving performance, the file downloading from server chunk by chunk, but not read whole file to memory then download once, it sucks.
```javascript
var fs = require('fs');
req('http://example.com/beauty.gif').pipe(fs.createWriteStream('download/001.gif'));
```

## HTTP Status
All the http statuses will be handled, but you'd better check status carefully, some status likes 404, and error will be thrown:
```javascript
req('http://example.com', function(err, resp){
  if(err){
    // get status error;
  }
  // statusCode always exist except STREAM `error` was caught.
  var status = resp && resp.statusCode
})
```

## TODO
- [ ] More examples
- [ ] Write test cases
- [ ] Performance tests
- [ ] Fix typo bugs

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


