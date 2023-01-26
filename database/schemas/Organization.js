const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrganizationSchema = new Schema({
  name: {
    type: String
  },
  description: {
    type: String
  },
  trusted: {
    type: Boolean,
    default: false
  },
  cover: {
    type: Schema.Types.ObjectId,
    ref: 'MediaAsset'
  },
  members: [{
    role: {
      type: String,
      enum: ['Admin', 'Member'],
      default: 'Member'
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  memberRequests:[{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
},
{
  timestamps: true
});

module.exports = mongoose.model('Organization', OrganizationSchema);
