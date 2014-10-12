var req = require('../'),
  chai = require('chai'),
  expect = chai.expect,
  should = chai.should();

describe('handle', function(){
  describe.skip('different status', function(){
    [200, 201, 404].forEach(function(status){
      it(status.toString(), function(done){
        req('http://httpbin.org/status/' + status, function(err, resp){
          // error could exists.
          should.equal(resp.statusCode, this.status);
          done();
        }.bind({status: status}));
      })
    })
  })
})