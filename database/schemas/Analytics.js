const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AnalyticsSchema = new Schema({

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
  data:   {
      finished: Boolean,
      duration: Number,
      activities: [{
        name: String,
        finished: Boolean,
        duration: Number,
        data: Schema.Types.Mixed
      }],
      data: Schema.Types.Mixed
  },
})

module.exports = mongoose.model('Analytics', AnalyticsSchema);
