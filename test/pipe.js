var req = require('../'),
  chai = require('chai'),
  expect = chai.expect,
  should = chai.should(),
  fs = require('fs');

describe('piping stream',function(){

  describe('from bing',function(){
    it('should create file and have HTML content',function(done){
      var pipePingHome = function(){
        req('http://www.bing.com').pipe(fs.createWriteStream('bing.html'));
        // check file 5 seconds later.
        setTimeout(function(){
          fs.exists('bing.html', function(exists){
            exists.should.be.ok;
            if(exists){
              return fs.readFile('bing.html', function(err, body){
                should.not.exist(err);
                should.exist(body);
                expect(body).to.match(/^\s*</);
                try{fs.unlink('bing.html')}catch(err){}
                done();
              });
            }
            done();
          });
        }, 5000);
      };
      fs.exists('bing.html', function(exists){
        if(exists){
          return fs.unlink('bing.html', pipeGoogleHome);
        }
        pipePingHome();
      });
    });
  });

});