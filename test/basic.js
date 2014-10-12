var req = require('../'),
  chai = require('chai'),
  expect = chai.expect,
  should = chai.should();

describe('basic request', function(){
  describe.skip('from google', function(){
    it('everything goes fine', function(done){
      req('http://www.google.com', function(err, resp){
        should.not.exist(err);
        expect(resp).to.be.an('object');
        expect(resp.cookies).to.be.an('object');
        expect(resp.headers).to.be.an('object');
        expect(resp.redirects).to.be.an('array');
        resp.statusCode.should.equal(200);
        expect(resp.body).to.match(/^\s*</);
        done();
      });
    })
  })
})