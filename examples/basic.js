var req = require('../');
req('http://www.bing.com', function(err, resp){
  if(err){
    return console.log('[ERROR]', err.message);
  }

  console.log(resp);
});