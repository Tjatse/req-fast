'use strict'

var req = require('../')
var chai = require('chai')
var should = chai.should()

describe('handle', function () {
  describe('different status', function () {
    [200, 201, 404].forEach(function (status) {
      it(status.toString(), function (done) {
        req('http://httpbin.org/status/' + status, function (err, resp) { // eslint-disable-line handle-callback-err
          should.equal(resp.statusCode, this.status)
          done()
        }.bind({status: status}))
      })
    })
  })
})
