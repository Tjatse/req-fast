var req = require('../'),
  chai = require('chai'),
  expect = chai.expect,
  should = chai.should();

describe('request server', function(){
  describe('get IP address', function(){
    it.skip('with VPN', function(done){
      req('http://httpbin.org/ip', function(err, resp){
        should.not.exist(err);
        should.exist(resp.body);
        var originIp = resp.body.origin;

        // TODO: change your proxy here.
        var proxyIp = '211.162.79.66';
        req({
          url: 'http://httpbin.org/ip',
          proxy: {
            host: proxyIp,
            port: 80
          }
        }, function(err, resp){
          should.not.exist(err);
          should.exist(resp.body);
          var ipWithVPN = resp.body.origin;
          should.not.equal(ipWithVPN, originIp);
          should.equal(ipWithVPN, proxyIp);
          done();
        });
      });
    })
  })
})