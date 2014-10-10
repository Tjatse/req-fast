var fs = require('fs');
var req = require('../');
req('http://nodestreams.com/input/people.json').pipe(fs.createWriteStream('people.json'));