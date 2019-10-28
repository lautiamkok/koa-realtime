'use strict'

import Koa from 'koa'
import socket from 'socket.io'
import http from 'http'
import config from './config'
import middlewares from './middlewares'
import rdbChangeFeeds from 'core/database/rethinkdb/changefeeds'

const app = new Koa()
const host = process.env.HOST || '127.0.0.1'
const port = process.env.PORT || config.server.port

// Middlewares are imported here.
middlewares(app)

// Hook socket.io up.
const server = http.createServer(app.callback())
const io = socket(server)

io.sockets.on('connection', function(socket) {
  console.log('a user connected: ' + socket.id)
  socket.on('disconnect', () => {
    console.log('user disconnected: ' + socket.id)
  })
})

// Integrate socket and rethinkdb.
// It should be done only once globally.
rdbChangeFeeds(io)

// app.listen(port, host)
server.listen(port, host)
