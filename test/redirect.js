var req = require('../'),
  chai = require('chai'),
  expect = chai.expect,
  should = chai.should();

describe('request server', function(){
  describe('following redirects', function(){
    it('disabled', function(done){
      req({
        url: 'http://httpbin.org/redirect/3',
        disableRedirect: true
      }, function(err, resp){
        should.not.exist(err);
        should.equal(resp.statusCode, 302);
        expect(resp.redirects).to.have.length(0);
        done();
      });
    });
    it('can not over 3 times', function(done){
      req({
        url: 'http://httpbin.org/redirect/10',
        maxRedirects: 3
      }, function(err, resp){
        if(resp){
          should.equal(resp.statusCode, 302);
        }
        done();
      });
    });
    it('make Url reachable', function(done){
      req({
        url: 'http://httpbin.org/redirect/2',
        maxRedirects: 10
      }, function(err, resp){
        should.not.exist(err);
        should.equal(resp.statusCode, 200);
        done();
      });
    });
    it('no matter relative or absolute redirect location', function(done){
      req({
        url: 'http://httpbin.org/relative-redirect/2',
        maxRedirects: 10
      }, function(err, resp){
        should.not.exist(err);
        should.equal(resp.statusCode, 200);
        done();
      });
    })
  })
});
