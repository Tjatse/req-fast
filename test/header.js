var req = require('../'),
  chai = require('chai'),
  expect = chai.expect,
  should = chai.should();

describe('request server', function(){
  describe('with headers', function(){
    it('should returns header dictionary', function(done){
      req({
        url: 'http://httpbin.org/headers',
        headers: {
          Module: 'req-fast',
          User: 'tjatse'
        }
      }, function(err, resp){
        should.not.exist(err);
        should.exist(resp.body);
        expect(resp.body).to.have.property('headers');
        expect(resp.body).deep.have.property('headers.Module', 'req-fast');
        expect(resp.body).deep.have.property('headers.User', 'tjatse');
        done();
      });
    });
  })
});
