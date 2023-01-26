var mongoose = require('mongoose');
var config = require('../config.js');
const Grid = require('gridfs-stream');
// hot fix https://github.com/aheckmann/gridfs-stream/issues/125
eval(`Grid.prototype.findOne = ${Grid.prototype.findOne.toString().replace('nextObject', 'next')}`);

var options = { keepAlive: true, useFindAndModify: false};
const mongoConnection = mongoose.connect(config.dbURI, options);
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
// Connected handler
mongoose.connection.on('connected', function (err) {
  console.log("Connected to DB using chain: " + config.dbURI);
});

// Error handler
mongoose.connection.on('error', function (err) {
  console.log(err);
});

// Reconnect when closed
mongoose.connection.on('disconnected', function () {

});

let gfs = null;
const conn = db;
conn.once('open', function () {
  gfs = Grid(conn.db, mongoose.mongo);
})

const getDB = () => db
const connectDB = () => mongoConnection
const disconnectDB = () => db.close()
const getGfs = () => gfs

module.exports = { connectDB, getDB, disconnectDB, getGfs }
