const mongoose = require('mongoose');
const GameSchema = require('./GameSchema');

module.exports = mongoose.model('Game', GameSchema);
