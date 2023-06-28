const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameSchema = new Schema({
  // gameType: {
  //   type: String,
  //   enum: ["EscapeRoom", "Map"]
  // },

  // game map - position of points
  name: {
    type: String
  },
  description: {
    type: String
  },
  cover: {
    type: Schema.Types.ObjectId,
    ref: 'MediaAsset'
  },
  //bg, map - definition, type of game, ...config
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'Organization'
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  published: { // no modification allowed after publishing,
    type: Boolean
  },
  entryCode: { // when game is private,
    type: String
  },
  rating: {
    type: Number
  },
  difficulty: {
    type: Number
  },
  ageRestriction: {
    type: String
  },
  introText: {
    type: String
  },
  endText: {
    type: String
  },
  badge: {
    type: String
  },
  bg: {
    asset: {
      type: Schema.Types.ObjectId,
      ref: 'MediaAsset'
    },
    width: {
      type: Number
    },
    height: {
      type: Number
    },
    selectedPointer: {
      type: Number
    }
  },
  activities: [
    //every activity has it's own properties, processed by the application
    { type: Schema.Types.Mixed }
  ],
  statistics: {
    type: Schema.Types.Mixed,
  },
  language: {
    type: String,
    enum: ['en', 'sk', 'cz', 'pl'],
  },
},
{
  timestamps: true,
});

module.exports = GameSchema;
