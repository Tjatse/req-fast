'use strict'

var req = require('../')
var fs = require('fs')
var chai = require('chai')
var expect = chai.expect
var should = chai.should()

describe('piping stream', function () {
  describe('from bing', function () {
    it('should create file and have HTML content', function (done) {
      var savedPath = './bing.html'
      var pipePingHome = function () {
        var rs = req('http://www.bing.com')
        rs.pipe(fs.createWriteStream(savedPath))
        rs.on('end', function () {
          fs.exists(savedPath, function (exists) {
            exists.should.be.ok
            if (exists) {
              return fs.readFile(savedPath, {'encoding': 'utf-8'}, function (err, body) {
                should.not.exist(err)
                should.exist(body)
                expect(body).to.match(/^\s*</)
                try {
                  fs.unlink(savedPath)
                } catch (err) {}
                done()
              })
            }
            done()
          })
        })
      }
      fs.exists(savedPath, function (exists) {
        if (exists) {
          return fs.unlink(savedPath, pipePingHome)
        }
        pipePingHome()
      })
    })
  })
})
