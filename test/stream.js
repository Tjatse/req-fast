'use strict'

var req = require('../')
var chai = require('chai')
var expect = chai.expect
var should = chai.should()

describe('stream', function () {
  var url = 'http://mp.weixin.qq.com/s?__biz=MjM5MzIyMDExOQ==&mid=400941252&idx=1&sn=0d98926515101df82e552720e93d6f6a&scene=2&srcid=11298yEW5zEhufnUxomV561q&from=timeline&isappinstalled=0#wechat_redirect'
  describe('deflate/deflateRaw', function () {
    it('auto switch', function (done) {
      var rs = req(url)
      var error
      rs.on('error', function (err) {
        error = err
      })
      var html = ''
      rs.on('data', function (chunk) {
        html += chunk.toString('utf8')
      })
      rs.on('end', function () {
        should.not.exist(error)
        expect(html).to.contain('写个Hello Word 而已，要不要这么震撼')
        expect(html).to.contain('感受一下')
        done()
      })
    })
  })
})
