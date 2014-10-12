var req = require('../'),
  chai = require('chai'),
  expect = chai.expect,
  should = chai.should();

describe('decompress encodings', function(){
  describe('gzip', function(){
    it('enabled(default)', function(done){
      req('http://httpbin.org/gzip', function(err, resp){
        should.not.exist(err);
        should.exist(resp.body);
        expect(resp.body).to.have.property('gzipped', true);
        expect(resp.body).deep.have.property('headers.Accept-Encoding', 'gzip,deflate,sdch');
        done();
      });
    });
    it('disabled(returning String)', function(done){
      req({
        url: 'http://httpbin.org/gzip',
        disableGzip: true
      }, function(err, resp){
        should.not.exist(err);
        should.exist(resp.body);
        expect(resp.body).to.be.a('string');
        done();
      });
    });
  });

  describe('deflate', function(){
    it('enabled(default)', function(done){
      req('http://httpbin.org/deflate', function(err, resp){
        should.not.exist(err);
        should.exist(resp.body);
        expect(resp.body).to.have.property('deflated', true);
        expect(resp.body).deep.have.property('headers.Accept-Encoding', 'gzip,deflate,sdch');
        done();
      });
    });
    it('disabled(returning String)', function(done){
      req({
        url: 'http://httpbin.org/deflate',
        disableGzip: true
      }, function(err, resp){
        should.not.exist(err);
        should.exist(resp.body);
        expect(resp.body).to.be.a('string');
        done();
      });
    });
  })
});
