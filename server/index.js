'use strict'

import Koa from 'koa'
import { Nuxt, Builder } from 'nuxt'
import socket from 'socket.io'
import http from 'http'
import Router from 'koa-trie-router'
import mount from 'koa-mount'
import r from 'rethinkdb'
import config from './config'
import middlewares from './middlewares'

const app = new Koa()
const router = new Router()
const host = process.env.HOST || '127.0.0.1'
const port = process.env.PORT || config.server.port

// Import and Set Nuxt.js options
let nuxtConfig = require('../nuxt.config.js')
nuxtConfig.dev = !(app.env === 'production')

// Instantiate nuxt.js
const nuxt = new Nuxt(nuxtConfig)

// Build in development
if (nuxtConfig.dev) {
  const builder = new Builder(nuxt)
  builder.build().catch(e => {
    console.error(e) // eslint-disable-line no-console
    process.exit(1)
  })
}

// Socket io hook up.
const server = http.createServer(app.callback())
const io = socket(server)

// Essential middlewares are imported here.
middlewares(app, io)

const middleware1 = async(ctx, next) => {
  console.log("I'll be logged first. ")
  await next()
  console.log("I'll be logged last. ")
}

const middleware2 = async(ctx, next) => {
  console.log("I'll be logged second. ")
  await next()
  console.log("I'll be logged third. ")
}

const index = async(ctx, next) => {
  await next()
  ctx.type = 'json'
  ctx.body = {
    message: 'Hello home sample!'
  }
}

const db = async() => {
  // https://rethinkdb.com/api/javascript/connect/
  const connection = await r.connect({
    host: config.database.host,
    port: config.database.port,
    db: config.database.dbname
  })
  return connection
}

// Integrate socket and rethinkdb.
const listenChanges = async(connection, io) => {
  var cursor = await r.table('users')
    .changes()
    .run(connection)

  io.sockets.on('connection', (socket) => {
    console.log('a user connected')
    socket.on('disconnect', () => {
      console.log('user disconnected')
    })
    cursor.each(function (err, row) {
      if (err) throw err
      console.log(JSON.stringify(row, null, 2))
      socket.emit('users.changed', row)
    })
  })
}

const getUsers = async(ctx, next) => {
  await next()

  // Get the db connection.
  const connection = await db()

  // Check if a table exists.
  var exists = await r.tableList().contains('users').run(connection)
  if (exists === false) {
    ctx.throw(500, 'users table does not exist')
  }

  // Retrieve documents.
  // https://www.rethinkdb.com/docs/guide/javascript/
  var cursor = await r.table('users')
    .run(connection)

  // Convert the object to array.
  var users = await cursor.toArray()

  // Now start listening for changes in the table.
  await listenChanges(connection, io)

  ctx.type = 'json'
  ctx.body = users
}

const getUser = async(ctx, next) => {
  await next()
  let name = ctx.params.name

  // Throw the error if no name.
  if (name === undefined) {
    ctx.throw(400, 'name is required')
  }

  // Get the db connection.
  const connection = await db()

  // Throw the error if the table does not exist.
  var exists = await r.tableList().contains('users').run(connection)
  if (exists === false) {
    ctx.throw(500, 'users table does not exist')
  }

  let searchQuery = {
    name: name
  }

  // Retrieve documents by filter.
  // https://rethinkdb.com/api/javascript/filter/
  var user = await r.table('users')
    .filter(searchQuery)
    .nth(0) // query for a stream/array element by its position
    .default(null) // will return null if no user found.
    .run(connection)

  // Throw the error if no user found.
  if (user === null) {
    ctx.throw(400, 'no user found')
  }

  ctx.body = user
}

const insertUser = async(ctx, next) => {
  await next()

  // Get the db connection.
  const connection = await db()

  // Throw the error if the table does not exist.
  var exists = await r.tableList().contains('users').run(connection)
  if (exists === false) {
    ctx.throw(500, 'users table does not exist')
  }

  let body = ctx.request.body || {}

  // Throw the error if no name.
  if (body.name === undefined) {
    ctx.throw(400, 'name is required')
  }

  // Throw the error if no email.
  if (body.email === undefined) {
    ctx.throw(400, 'email is required')
  }

  let document = {
    name: body.name,
    email: body.email
  }

  var result = await r.table('users')
    .insert(document)
    .run(connection)

  ctx.body = result
}

const updateUser = async(ctx, next) => {
  await next()

  // Get the db connection.
  const connection = await db()

  // Throw the error if the table does not exist.
  var exists = await r.tableList().contains('users').run(connection)
  if (exists === false) {
    ctx.throw(500, 'users table does not exist')
  }

  let body = ctx.request.body || {}

  // Throw the error if no id.
  if (body.id === undefined) {
    ctx.throw(400, 'id is required')
  }

  // Throw the error if no name.
  if (body.name === undefined) {
    ctx.throw(400, 'name is required')
  }

  // Throw the error if no email.
  if (body.email === undefined) {
    ctx.throw(400, 'email is required')
  }

  let objectId = body.id
  let updateQuery = {
    name: body.name,
    email: body.email
  }

  // Update document by id.
  // https://rethinkdb.com/api/javascript/update/
  var result = await r.table('users')
    .get(objectId)
    .update(updateQuery, {returnChanges: true})
    .run(connection)

  ctx.body = result
}

const deleteUser = async(ctx, next) => {
  await next()

  // Get the db connection.
  const connection = await db()

  // Throw the error if the table does not exist.
  var exists = await r.tableList().contains('users').run(connection)
  if (exists === false) {
    ctx.throw(500, 'users table does not exist')
  }

  let body = ctx.request.body || {}

  // Throw the error if no id.
  if (body.id === undefined) {
    ctx.throw(400, 'id is required')
  }

  let objectId = body.id

  // Delete a single document by id.
  // https://rethinkdb.com/api/javascript/delete/
  var result = await r.table('users')
    .get(objectId)
    .delete()
    .run(connection)

  // Delete all documents.
  // var result = await r.table("users").delete().run(connection)

  ctx.body = result
}

// Add routes here.
router
  .use(function (ctx, next) {
    console.log('* requests')
    return next()
  })
  .get('/', middleware1, middleware2, index)
  .get('/users', getUsers)
  .get('/users/:name', getUser)
  .post('/users', insertUser)
  .put('/users', updateUser)
  .del('/users', deleteUser)

app.use(mount('/api', router.middleware()))

// Hook Nuxt up!
// https://github.com/nuxt-community/koa-template/blob/master/template/server/index.js
app.use(ctx => {
  ctx.status = 200 // koa defaults to 404 when it sees that status is unset

  return new Promise((resolve, reject) => {
    ctx.res.on('close', resolve)
    ctx.res.on('finish', resolve)
    nuxt.render(ctx.req, ctx.res, promise => {
      // nuxt.render passes a rejected promise into callback on error.
      promise.then(resolve).catch(reject)
    })
  })
})

// If you want to do unit testing, it's important to export the http.Server
// object returned by app.listen(3000) instead of just the function app,
// otherwise you will get TypeError: app.address is not a function.
// server.listen(port, host)
// server.listen(port, host)
module.exports = server.listen(port, host)
