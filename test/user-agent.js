var req = require('../'),
  chai = require('chai'),
  expect = chai.expect,
  should = chai.should();

describe('generate agent', function(){
  describe.skip('randomize', function(){
    it('enabled(default)', function(done){
      req('http://httpbin.org/user-agent', function(err, resp){
        should.not.exist(err);
        should.exist(resp.body);
        expect(resp.body).to.have.property('user-agent');
        done();
      });
    });
    it('disabled', function(done){
      req({
        uri: 'http://httpbin.org/user-agent',
        agent: false
      }, function(err, resp){
        should.not.exist(err);
        should.exist(resp.body);
        expect(resp.body).to.have.property('user-agent', null);
        done();
      });
    });
  })
});
