'use strict'

var async = require('async')
var request = require('request')
var reqfast = require('../')

let mod = {
  request,
  reqfast
}
let max = -10000
let min = -max
let total = 0
const attempts = 1000
// ignoring network issues, using local site for testing.
console.log(`A sample of ${attempts} cases:\n`)
console.log('module\tavg\tmin\tmax')
async.waterfall([
  async.apply(test, 'request'),
  async.apply(test, 'reqfast')
], () => {
  console.log('\ncompleted')
})

function test (module, fn) {
  let waterfalls = []
  for (let i = 0; i < attempts; i++) {
    waterfalls.push((next) => {
      mod[module]('http://localhost:9002/?t=' + Math.random(), () => {
        took(process.memoryUsage().rss, next)
      })
    })
  }
  async.waterfall(waterfalls, () => {
    let avg = total / attempts
    console.log('%s\t%db\t%db\t%db', module, avg.toFixed(3), min.toFixed(3), max.toFixed(3))
    min = 0
    max = 0
    total = 0
    fn()
  })
}

function took (m, fn) {
  let mem = process.memoryUsage().rss - m
  total += mem
  max = Math.max(mem, max)
  min = Math.min(mem, min)

  // setTimeout makes server have no stick(there have too much socket connections).
  setTimeout(fn, 10)
}
