var req = require('../'),
  request = require('request'),
  chai = require('chai'),
  expect = chai.expect,
  should = chai.should();

describe('stream', function () {
  var url = 'http://mp.weixin.qq.com/s?__biz=MjM5MzIyMDExOQ==&mid=400941252&idx=1&sn=0d98926515101df82e552720e93d6f6a&scene=2&srcid=11298yEW5zEhufnUxomV561q&from=timeline&isappinstalled=0#wechat_redirect';
  var html;
  before(function (done) {
    request(url, function (err, resp, body) {
      html = body;
      done();
    });
  });
  describe('deflate/deflateRaw', function () {
    it('auto switch', function (done) {
      var rs = req(url);
      var error;
      rs.on('error', function (err) {
        error = err;
      });
      var buffers = [];
      rs.on('data', function (chunk) {
        buffers.push(chunk.toString('utf8'));
      });
      rs.on('end', function () {
        should.not.exist(error);
        expect(buffers.join('')).to.equal(html);
        done();
      });
    });
  })
});
