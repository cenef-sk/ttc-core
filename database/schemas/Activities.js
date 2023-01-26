const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MemoryActivitySchema = new Schema({
  activityType: {
    type: String,
    default: "MemoryActivity"
  },
  config: {
    timer: {
      type: Number
    }
  },
  pairs: [{
    // _id: false,
    item1: {
      mediaAsset: {
        type: Schema.Types.ObjectId,
        ref: 'MediaAsset'
      },
      text: {
        type: String
      }
    },
    item2: {
      mediaAsset: {
        type: Schema.Types.ObjectId,
        ref: 'MediaAsset'
      },
      text: {
        type: String
      }
    },
    explanation: {
      type: String
    }
  }]
})

const QuizActivitySchema = new Schema({
  activityType: {
    type: String,
    default: "QuizActivity"
  },
  config: {
    timer: {
      type: Number
    }
  },
  questions: [{
    question: {
      text: {
        type: String
      },
      mediaAsset: {
        type: Schema.Types.ObjectId,
        ref: 'MediaAsset'
      }
    },
    answers: [{
      type: String
    }],
    correctAnswer: {
      type: Number
    },
    explanation: {
      type: String
    }
  }]
})

// timeline
// true - false
// question - two images

module.exports = {
  MemoryActivity: mongoose.model('MemoryActivity', MemoryActivitySchema),
  QuizActivity: mongoose.model('QuizActivity', QuizActivitySchema),
}
