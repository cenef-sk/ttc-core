const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const GameSchema = require('./GameSchema');
const PublishedGame = require('./PublishedGame');


const DownloadSchema = new Schema({

  game: {
    type: Schema.Types.ObjectId,
    ref: 'Game'
  },
  pubGame: {
    type: Schema.Types.ObjectId,
    ref: 'PublishedGame'
  },
  downloadId: {
    type: String
  },
},
{
  timestamps: true,
})

module.exports = mongoose.model('Download', DownloadSchema);
