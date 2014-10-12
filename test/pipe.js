var req = require('../'),
  chai = require('chai'),
  expect = chai.expect,
  should = chai.should(),
  fs = require('fs');

describe('piping stream',function(){

  describe('from google',function(){
    it('should create file and have HTML content',function(done){
      var pipeGoogleHome = function(){
        req('http://www.google.com').pipe(fs.createWriteStream('google.html'));
        // check file 5 seconds later.
        setTimeout(function(){
          fs.exists('google.html', function(exists){
            exists.should.be.ok;
            if(exists){
              return fs.readFile('google.html', function(err, body){
                should.not.exist(err);
                should.exist(body);
                expect(body).to.match(/^\s*</);
                try{fs.unlink('google.html')}catch(err){}
                done();
              });
            }
            done();
          });
        }, 5000);
      };
      fs.exists('google.html', function(exists){
        if(exists){
          return fs.unlink('google.html', pipeGoogleHome);
        }
        pipeGoogleHome();
      });
    });
  });

});