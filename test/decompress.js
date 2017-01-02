'use strict'

var req = require('../')
var chai = require('chai')
var expect = chai.expect
var should = chai.should()

describe('decompress encodings', function () {
  describe('gzip', function () {
    it('enabled(default)', function (done) {
      req('http://httpbin.org/gzip', function (err, resp) {
        should.not.exist(err)
        should.exist(resp.body)
        expect(resp.body).to.have.property('gzipped', true)
        expect(resp.body).deep.have.property('headers.Accept-Encoding', 'gzip,deflate,sdch')
        done()
      })
    })
    it('disabled(returning String)', function (done) {
      req({
        url: 'http://httpbin.org/gzip',
        disableGzip: true
      }, function (err, resp) {
        should.not.exist(err)
        should.exist(resp.body)
        expect(resp.body).to.be.a('string')
        done()
      })
    })
  })

  describe('deflate', function () {
    it('enabled(default)', function (done) {
      req('http://httpbin.org/deflate', function (err, resp) {
        should.not.exist(err)
        should.exist(resp.body)
        expect(resp.body).to.have.property('deflated', true)
        expect(resp.body).deep.have.property('headers.Accept-Encoding', 'gzip,deflate,sdch')
        done()
      })
    })
    it('disabled(returning String)', function (done) {
      req({
        url: 'http://httpbin.org/deflate',
        disableGzip: true
      }, function (err, resp) {
        should.not.exist(err)
        should.exist(resp.body)
        expect(resp.body).to.be.a('string')
        done()
      })
    })
    it('auto handled @entertainyou', function (done) {
      req('http://mp.weixin.qq.com/s?__biz=MjM5MzIyMDExOQ==&mid=400941252&idx=1&sn=0d98926515101df82e552720e93d6f6a&scene=2&srcid=11298yEW5zEhufnUxomV561q&from=timeline&isappinstalled=0#wechat_redirect', function (err, resp) {
        should.not.exist(err)
        should.exist(resp.body)
        expect(resp.body).to.be.a('string')
        done()
      })
    })
  })
})
