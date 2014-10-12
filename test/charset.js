var req = require('../'),
  chai = require('chai'),
  expect = chai.expect,
  should = chai.should();

describe('decoding content', function(){
  describe('from Chinese', function(){
    it('automatic', function(done){
      req('http://news.163.com/14/1011/05/A88K45VJ0001121M.html', function(err, resp){
        should.not.exist(err);
        expect(resp).to.be.an('object');
        resp.statusCode.should.equal(200);
        expect(resp.body).to.match(/^\s*</);
        done();
      });
    });
    it('avoid messy codes', function(done){
      req({
        url: 'http://game.163.com/14/0506/10/9RI8M9AO00314SDA.html',
        charset: 'gbk'
      }, function(err, resp){
        should.not.exist(err);
        expect(resp).to.be.an('object');
        resp.statusCode.should.equal(200);
        expect(resp.body).to.match(/^\s*</);
        expect(resp.body).to.have.string('亲爱的冒险者');
        done();
      });
    })
  })
});
