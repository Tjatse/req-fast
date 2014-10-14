var req = require('request'),
  reqFast = require('../'),
  async = require('async'),
  progress = require('progress');


// ignoring network issues, using local site for testing.
// TODO: how about test `req-fast` module, just change the 'request' to 'req-fast'.
test('http://localhost:9002/', 'req-fast', 1000);

/****** test codes ********/
var total, bar;
function tookMS(err, resp, body){
  var tick = Date.now() - this.start;
  total += tick;
  bar && bar.tick(1);

  // setTimeout makes server have no stick(there have too much socket connections).
  setTimeout(function(){
    this.callback();
  }.bind(this), 10);
}
function test(url, module, count){
  total = 0;
  bar = new progress('[PROCESSING]\t[:bar] :percent :etas', {
    total: count,
    width: 40
  });
  var waterfalls = [];
  for(var i = 0; i < count; i++){
    waterfalls.push(function(next){
      this.start = Date.now();
      this.callback = next;
      var mod = {
        'request': req,
        'req-fast': reqFast
      };
      mod[module](url + '?t=' + Math.random(), tookMS.bind(this));
    });
  }
  async.waterfall(waterfalls, function(error, result){
    console.log('[AVERAGE]\t%s tooks %d(ms)', module, total/count);
  });
}