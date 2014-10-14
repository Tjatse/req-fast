var req = require('request'),
  reqFast = require('../'),
  async = require('async'),
  memwatch = require('memwatch'),
  progress = require('progress');

// ignoring network issues, using local site for testing.
test('http://localhost:9002/', process.argv.length > 2 ? process.argv[2] : 'req-fast', process.argv.length > 3 ? parseInt(process.argv[3]):10);

/****** test codes ********/
var total, bar;
function tookMS(err, resp, body){
  var diff = this.hd.end();
  total += (diff.after.size_bytes - diff.before.size_bytes);
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
      this.hd = new memwatch.HeapDiff();
      this.callback = next;
      var mod = {
        'request': req,
        'req-fast': reqFast
      };
      mod[module](url + '?t=' + Math.random(), tookMS.bind(this));
    });
  }
  async.waterfall(waterfalls, function(error, result){
    console.log('[AVERAGE]\t%s tooks %d(bytes)', module, total/count);
  });
}