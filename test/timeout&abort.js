'use strict'

var req = require('../')
var chai = require('chai')
var expect = chai.expect
var should = chai.should()

describe('request', function () {
  describe('timeout', function () {
    it('should catch an exception', function (done) {
      req({
        url: 'http://httpbin.org/delay/5',
        timeout: 3000
      }, function (err, resp) {
        should.exist(err)
        expect(err.code).has.string('ECONN')
        done()
      })
    })
  })
  describe('abort', function () {
    it('should works fine', function (done) {
      var aborted = false
      var rs = req({
        url: 'http://httpbin.org/delay/5'
      }, function (err, resp) {
        should.exist(err)
        expect(aborted).equals(true)
        expect(err.code).equals('ECONNRESET')
        done()
      })

      rs.on('abort', function () {
        aborted = true
      })

      setTimeout(function () {
        rs.abort()
      }, 1000)
    })
  })
})
