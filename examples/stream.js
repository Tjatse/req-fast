var req = require('../');
var rs = req('http://httpbin.org/stream/10');
rs.on('error', function(err){
  console.log('[ERROR]', err.message);
});
var buffers = [], offset = 0;
rs.on('data', function(chunk){
  console.log('[INFO] chunk length:', chunk.length);
  offset += chunk.length;
  buffers.push(chunk);
});
rs.on('end', function(){
  console.log('[INFO] Response Buffers:', buffers);
});
