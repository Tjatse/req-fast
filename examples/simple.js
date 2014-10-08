
var req = require('../');
req({
  uri: 'http://baike.baidu.com/subview/27748/6175876.htm',
  error: function(err){
    console.log('[ERROR]', err.message);
  },
  success: function(resp){
    console.log(resp);
  }
});
/*
var fs = require('fs');
var req = require('../');
req('http://nodestreams.com/input/people.json').pipe(fs.createWriteStream('people.json'));
  */