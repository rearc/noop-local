const https = require('https')
const express = require('express')
const app = express()
const routes = (process.env.ROUTES) ? JSON.parse(process.env.ROUTES) : []
const fs = require('fs')
const http = require('http')
let requestCount = 0
const crypto = require('crypto')

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE")
  next()
})

routes.forEach((route) => {
  app[route.method.toLowerCase()](route.pattern, (clientRequest, clientResponse) => {
    const startTime = new Date().getTime()
    requestCount++
    clientRequest.requestCount = requestCount
    clientRequest.id = crypto.randomBytes(4).toString('hex') + `#${requestCount}`
    clientResponse.header('X-Request-ID', clientRequest.id)
    console.log(
      `REQ #${clientRequest.requestCount}`,
      clientRequest.method,
      clientRequest.path,
      '->',
      route.componentName
    )
    if (clientRequest.secure) { 
      clientRequest.headers['X-forwarded-proto'] = 'https'
    }
    const options = {
      hostname: route.hostname,
      port: route.port,
      method: clientRequest.method,
      path: clientRequest.originalUrl,
      timeout: 5000,
      headers: clientRequest.headers
    }
    const serverRequest = http.request(options, (serverResponse) => {
      clientResponse.writeHead(serverResponse.statusCode, serverResponse.headers)
      serverResponse.on('data', (chunk) => {
        clientResponse.size += chunk.length
        clientResponse.write(chunk)
      })
      serverResponse.on('end', () => {
        logResponse()
        clientResponse.end()
      })
    })
    clientResponse.size = 0
    serverRequest.on('error', (err) => {
      clientResponse.statusCode = 500
      clientResponse.statusMessage = `NoopRouterError`
      clientResponse.write(`Noop router error: ${err.code}`)
      logResponse()
      clientResponse.end()
    })
    clientRequest.on('data', (chunk) => {
      serverRequest.write(chunk)
    })
    clientRequest.on('end', () => {
      serverRequest.end()
    })
    function logResponse () {
      const duration = (new Date().getTime() - startTime) + 'ms'
      clientResponse.end()
      console.log(
        `RES #${clientRequest.requestCount}`,
        duration,
        `${clientResponse.size}b`,
        clientResponse.statusCode,
        clientResponse.statusMessage
      )
    }
  })
})

https.createServer({
  cert: fs.readFileSync('./certificates/localnoop.app.cert'),
  key: fs.readFileSync('./certificates/localnoop.app.key')
}, app).listen(443)

app.listen(80)
