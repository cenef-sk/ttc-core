const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');
const authentifier = require('./authentifier');

const app = express();
const API_PATH = '/api/'

// if (process.argv.length != 5){
//   console.log(process.argv)
//   console.log("There are expected arguments to run myslim-core:");
//   console.log("google-email");
//   console.log("google-password");
//   console.log("secret");
//   process.exit(0);
// }

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true })); //limit: '2mb', 

//Start mongodb connection
const dbconnection = require('./database/db.js');

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  next();
});
//TODO add logger
app.use(authentifier)

const users = require('./routes/users')
app.use(API_PATH + 'users/', users);

const orgs = require('./routes/orgs')
app.use(API_PATH + 'orgs/', orgs);

const assets = require('./routes/assets')
app.use(API_PATH + 'assets/', assets);

const games = require('./routes/games')
app.use(API_PATH + 'games/', games);

//TODO add error logger


app.listen(config.port, () => console.log(`Listening on port ${config.port}`));
