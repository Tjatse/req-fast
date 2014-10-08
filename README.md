# req-fast

This module is designed to be the fast, lightweight way to fetch the web content(HTML stream). it supports:
- Gzip
- Cookie
- Auto-redirect
- Proxy

## Installation
```javascript
npm install req-fast
```

## Usage
see test or examples folder for a complete example

```javascript
var req = require('req-fast');
req(options)
```
when options is instance of String, it means the URI of web page that to be requested.
otherwise it should be an object, including:
  * **uri || url** uri of web page.
  * **method** http method, `GET` as default.
  * **headers** http headers(key-value pairs, such as `{'Connection':'keep-alive', 'Cache-Control':'max-age=0'}`).
  * **maxRedirects** the maximum number of redirects to follow(3 as default).
  * **disableGzip** request compressed content from server and automatic decompress response content, if this option sets to `true`, this feature will be disabled.
  * **proxy** the proxy including all the options from [tunnel](https://www.npmjs.org/package/tunnel) proxy.

## Stream pipe

## Thanks
Thanks andris9. I've used [fetch](https://github.com/andris9/fetch) for a long time, it's very fast(*my ES Spider needs speed up,
[request](https://github.com/mikeal/request) is very powerful, but too heavy/slow to me, and can not automatic decode encodings,
especially Chinese*). Unfortunately andris9 could not maintain his repository any more, it have bugs, also I can fix them
in my project, but it's fussy. One more, I need a http request module that supports PROXY.

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


