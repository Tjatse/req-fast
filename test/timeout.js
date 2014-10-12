var req = require('../'),
  chai = require('chai'),
  expect = chai.expect,
  should = chai.should();

describe('request', function(){
  describe('timeout', function(){
    it('should catch an exception', function(done){
      req({
        url: 'http://httpbin.org/delay/5',
        timeout: 3000
      }, function(err, resp){
        should.exist(err);
        expect(err.code).has.string('ECONN');
        done();
      });
    })
  })
})