const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const GameSchema = require('./GameSchema');


const PublishedGameSchema = new Schema({
  ...GameSchema.obj,
  game: {
    type: Schema.Types.ObjectId,
    ref: 'Game'
  },
  codeOnly: Boolean,
  downloads: Number,
},
{
  timestamps: true,
})

module.exports = mongoose.model('PublishedGame', PublishedGameSchema);
