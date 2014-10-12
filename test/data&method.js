var req = require('../'),
  chai = require('chai'),
  expect = chai.expect,
  should = chai.should();

// all support methods: 'OPTIONS', 'GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'TRACE', 'CONNECT'
describe.skip('request', function(){
  describe('through GET method', function(){
    it('no matter dataType is', function(done){
      req({
        url: 'http://httpbin.org/get',
        method: 'GET',
        data: {
          q: 'req-fast'
        }
      }, function(err, resp){
        should.not.exist(err);
        should.exist(resp.body);
        expect(resp.body).have.deep.property('args.q', 'req-fast');
        done();
      });
    });
  });

  describe('through POST method when dataType is:', function(){
    it('JSON', function(done){
      req({
        url: 'http://httpbin.org/post',
        method: 'post',   // `POST` as default if `data` was set
        dataType: 'json', // `json` as default if this value was not set
        data: {
          q: 'req-fast'
        }
      }, function(err, resp){
        should.not.exist(err);
        should.exist(resp.body);
        expect(resp.body).have.deep.property('json.q', 'req-fast');
        done();
      });
    });
    it('FORM', function(done){
      req({
        url: 'http://httpbin.org/post',
        method: 'post',
        dataType: 'form',
        data: {
          q: 'req-fast'
        }
      }, function(err, resp){
        should.not.exist(err);
        should.exist(resp.body);
        expect(resp.body).have.deep.property('form.q', 'req-fast');
        done();
      });
    });
  });

  describe('through PATCH method when dataType is:', function(){
    it('JSON', function(done){
      req({
        url: 'http://httpbin.org/patch',
        method: 'patch',
        dataType: 'json', // `json` as default if this value was not set
        data: {
          q: 'req-fast'
        }
      }, function(err, resp){
        should.not.exist(err);
        should.exist(resp.body);
        expect(resp.body).have.deep.property('json.q', 'req-fast');
        done();
      });
    });
    it('FORM', function(done){
      req({
        url: 'http://httpbin.org/patch',
        method: 'patch',
        dataType: 'form',
        data: {
          q: 'req-fast'
        }
      }, function(err, resp){
        should.not.exist(err);
        should.exist(resp.body);
        expect(resp.body).have.deep.property('form.q', 'req-fast');
        done();
      });
    });
  });
  describe('through PUT method when dataType is:', function(){
    it('JSON', function(done){
      req({
        url: 'http://httpbin.org/put',
        method: 'put',
        dataType: 'json', // `json` as default if this value was not set
        data: {
          q: 'req-fast'
        }
      }, function(err, resp){
        should.not.exist(err);
        should.exist(resp.body);
        expect(resp.body).have.deep.property('json.q', 'req-fast');
        done();
      });
    });
    it('FORM', function(done){
      req({
        url: 'http://httpbin.org/put',
        method: 'put',
        dataType: 'form',
        data: {
          q: 'req-fast'
        }
      }, function(err, resp){
        should.not.exist(err);
        should.exist(resp.body);
        expect(resp.body).have.deep.property('form.q', 'req-fast');
        done();
      });
    });
  });

  describe('through DELETE method', function(){
    it('no matter dataType is', function(done){
      req({
        url: 'http://httpbin.org/delete',
        method: 'delete',
        data: {
          q: 'req-fast'
        }
      }, function(err, resp){
        should.not.exist(err);
        should.exist(resp.body);
        expect(resp.body).have.deep.property('args.q', 'req-fast');
        done();
      });
    });
  });
});