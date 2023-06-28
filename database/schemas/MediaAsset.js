const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var GFS = mongoose.model("GFS", new Schema({}, {strict: false}), "fs.files" );

const MediaAssetSchema = new Schema({
  // some assets could be just not artworks - some could be org profile view. ...
  mediaType: {
    type: String,
    enum: ["audio", "image"]
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'Organization'
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  mediaContent: {
    type: Schema.Types.Object, ref: 'GFS'
  },
  thumbnails: [{
    mediaContent: {

    },

  }],
  language: {
    type: String,
    enum: ['en', 'sk', 'cz', 'pl'],
  },
  license: {
    onlyPersonalUse: {
      type: Boolean
    },
    copyrightNotice: {
      type: String
    }, //©2012 Jane Doe, Photos R Us Press, All Rights Reserved.
    attribution: {
      type: String
    }
  },
  metadata: {
    title: {
      type: String
    },
    description: {
      type: String
    },
    author: {
      type: String
    },
    creationDate: {
      type: String
    },
    keywords: [{
      type: String
    }],
    artworkType: {
      type: String
    }, //photograpy, sculpture,
    medium: {
      type: String
    },
    genre: {
      type: String
    },
    dimensions: {
      type: String
    },
    location: {
      type: String
    },
  },
},
{
  minimize: false,
  timestamps: true,
});

module.exports = mongoose.model('MediaAsset', MediaAssetSchema);
