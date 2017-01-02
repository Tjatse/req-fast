'use strict'

var req = require('../')

let buffers = []
let rs = req('http://httpbin.org/stream/10')
rs.on('error', (err) => {
  console.log('[ERROR]', err.message)
})
rs.on('data', (chunk) => {
  console.log('[INFO] chunk length:', chunk.length)
  buffers.push(chunk)
})
rs.on('end', () => {
  console.log('[INFO] Response Buffers:', buffers)
})
