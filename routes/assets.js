const express  = require('express');
const router   = express.Router();

const MediaAsset = require('../database/schemas/MediaAsset');
const ObjectId = require('mongodb').ObjectId;

var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

const {
  mediaPost,
  mediaDelete,
  mediaGet,
  // mediaGetThumb,
} = require('./media');


// GET ALL MediaAsset
router.get('/', function(req, res, next) {
  if (req.user && req.org) {
    MediaAsset
    .find({owner: req.org._id})
    .exec(( err, assets) => {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {
        res.status(200).send({
          success: true,
          data: assets
        });
      }
    });
  } else{
    res.status(401).send({
      success: false,
      message: "Unauthorized access to resources"
    })
  }
});

function getAsset(assetId, res, cb) {
  if (ObjectId.isValid(assetId)) {
    MediaAsset
    .findOne({_id: assetId})
    // .populate('mediaContent')
    .exec(function(err, asset) {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {
        cb(asset)
      }
    });
  } else {
    res.status(400).send({
      success: false,
      message: "Invalid ID of the requested object"
    });
  }
}

router.get('/:assetId/media/', function(req, res) {
  getAsset(req.params.assetId, res, (asset) => {
    if (asset && asset.mediaContent) {
      mediaGet(res, asset.mediaContent)
    } else {
      res.status(404).send({
        success: false,
        message: "No media content for the asset"
      });
    }
  })
})

//TODO fix orgId and userId
router.post('/:assetId/media', upload.single('file'), function(req, res) {
  const id = req.params.assetId;
  if (ObjectId.isValid(id)) {
    mediaPost(res, req.file, null /*req.user.orgId*/, id)
  } else {
    res.status(400).send({
      success: false,
      message: "Invalid ID of the requested object"
    });
  }
});

router.delete('/:assetId/media/', function(req, res) {
  const id = req.params.assetId;
  if (ObjectId.isValid(id)) {
    mediaDelete(res, id, null) //req.org._id)
  } else {
    res.status(400).send({
      success: false,
      message: "Invalid ID of the requested object"
    });
  }
})

router.get('/:assetId', function(req, res, next) {
  getAsset(req.params.assetId, res, (asset) => {
    res.status(200).send({
      success: true,
      data: asset
    });
  })
});

router.post('/', function(req, res, next) {
  //TODO check org if is set
  var asset = new MediaAsset();

  asset.metadata =  req.body.metadata;
  asset.mediaType = req.body.mediaType
  asset.language = req.body.language
  asset.license = req.body.license
  asset.owner = req.org._id
  asset.creator = req.user._id

  asset.save(function(err) {
    if (err){
      res.status(500).send({
        success: false,
        error: err,
      });
    } else {
      res.status(200).send({
        success: true,
        data: asset
      });
    }
  });
});


router.put('/:assetId', function(req, res, next) {
  const id = req.params.assetId;
  if (ObjectId.isValid(id)) {
    MediaAsset.findById(id, function(err, asset) {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {

        if (req.body.metadata) asset.metadata = req.body.metadata;
        if (req.body.mediaType) asset.mediaType = req.body.mediaType;
        if (req.body.language) asset.language = req.body.language;
        if (req.body.license) asset.license = req.body.license;

        asset.save(function(err) {
          if (err) {
            res.status(500).send({
              success: false,
              error: err
            });
          } else {
            res.status(200).send({
              success: true,
              message: 'Asset has been updated!',
              data: asset
            });
          }
        });
      }
    });
  } else {
    res.status(400).send({
      success: false,
      message: "Invalid ID of the requested object"
    });
  }
});

router.delete('/:assetId', function(req, res, next) {
  //TODO delete mediaContent
  const id = req.params.assetId;
  if (ObjectId.isValid(id)) {
    MediaAsset.findByIdAndRemove(id, function(err) {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {
        res.status(200).send({
          success: true,
          message: 'MediaAsset has been removed!'
        });
      }
    });
  } else {
    res.status(400).send({
      success: false,
      message: "Invalid ID of the requested object"
    });
  }
});

module.exports = router;
