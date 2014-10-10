var req = require('../');
req({
  uri: 'http://www.google.com',
  error: function(err){
    console.log('[ERROR]', err.message);
  },
  success: function(resp){
    console.log(resp);
  }
});