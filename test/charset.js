'use strict'

var req = require('../')
var chai = require('chai')
var expect = chai.expect
var should = chai.should()

describe('decoding content', function () {
  describe('from Chinese', function () {
    it('automatic', function (done) {
      req('http://news.163.com/14/1011/05/A88K45VJ0001121M.html', function (err, resp) {
        should.not.exist(err)
        expect(resp).to.be.an('object')
        resp.statusCode.should.equal(200)
        expect(resp.body).to.match(/^\s*</)
        done()
      })
    })
    it('avoid messy codes when multi charset detected', function (done) {
      req({
        url: 'http://www.ce.cn/xwzx/gnsz/gdxw/201505/25/t20150525_5453608.shtml'
      }, function (err, resp) {
        should.not.exist(err)
        expect(resp).to.be.an('object')
        resp.statusCode.should.equal(200)
        expect(resp.body).to.match(/^\s*</)
        expect(resp.body).to.have.string('饮用水新国标实施')
        done()
      })
    })
  })
})
