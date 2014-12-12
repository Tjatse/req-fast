var req      = require('request'),
    reqFast  = require('../'),
    async    = require('async');

// ignoring network issues, using local site for testing.
console.log('A sample of 1000 cases:');
async.waterfall([
  function(next){
    test('request', 1000, next);
  },
  function(next){
    test('req-fast', 1000, next);
  },
]);

var max = -100, min = 100, total = 0;
function test(module, count, cb){
  var waterfalls = [];
  for (var i = 0; i < count; i++) {
    waterfalls.push(function(next){
      this.start = Date.now();
      this.callback = next;
      var mod = {
        'request' : req,
        'req-fast': reqFast
      };
      mod[module]('http://localhost:9002/?t=' + Math.random(), tookMS.bind(this));
    });
  }
  async.waterfall(waterfalls, function(error, result){
    var avg = total / count;
    console.log('%s x %d ms (+%s%, -%s%).', module, avg.toFixed(3), ((max / avg - 1) * 100).toFixed(2), ((1 - min / avg) * 100).toFixed(2));
    min = 0;
    max = 0;
    total = 0;
    cb();
  });
}
function tookMS(err, resp, body){
  var tick = Date.now() - this.start;
  total += tick;
  max = Math.max(tick, max);
  min = Math.min(tick, min);

  // setTimeout makes server have no stick(there have too much socket connections).
  setTimeout(function(that){
    that.callback();
  }, 10, this);
}