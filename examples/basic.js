var req = require('../');
req('http://www.google.com', function(err, resp){
  if(err){
    return console.log('[ERROR]', err.message);
  }

  console.log(resp);
});