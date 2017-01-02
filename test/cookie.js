'use strict'

var req = require('../')
var chai = require('chai')
var expect = chai.expect
var should = chai.should()

describe('cookies', function () {
  describe('were passed to server', function () {
    it('should be detected', function (done) {
      req({
        url: 'http://httpbin.org/cookies',
        cookies: {
          'username': 'tjatse',
          'location': 'Beijing'
        }
      }, function (err, resp) {
        should.not.exist(err)
        should.exist(resp.body)
        expect(resp.body).to.have.property('cookies')
        expect(resp.body).have.deep.property('cookies.username', 'tjatse')
        expect(resp.body).have.deep.property('cookies.location', 'Beijing')
        done()
      })
    })
  })

  describe('were sent from server', function () {
    it('should be detected', function (done) {
      req({
        url: 'http://httpbin.org/cookies/set',
        method: 'get',
        disableRedirect: true,
        data: {
          'username': 'tjatse'
        }
      }, function (err, resp) {
        should.not.exist(err)
        should.exist(resp.cookies)
        expect(resp.cookies).to.have.property('username', 'tjatse')
        done()
      })
    })
  })

  describe('were sent from server', function () {
    it('should be detected even redirecting', function (done) {
      req({
        url: 'http://httpbin.org/cookies/set',
        method: 'get',
        trackCookie: true,
        data: {
          'username': 'tjatse'
        }
      }, function (err, resp) {
        should.not.exist(err)
        should.exist(resp.cookies)
        expect(resp.cookies).to.have.property('username', 'tjatse')
        done()
      })
    })
  })
})
