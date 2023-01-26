const MediaAsset = require('../database/schemas/MediaAsset');
// const User = require('../database/Schemas/User');

// const mongoose = require('mongoose');
var fs = require('fs');
// const gm = require('gm').subClass({imageMagick: true});
// const path = require('path');
const dbconnection = require('../database/db.js');
const gfs = () => dbconnection.getGfs();

var ObjectId = require('mongodb').ObjectId;


function updateAssetMedia(res, assetId, fileId) {
  MediaAsset.update(
    { _id: assetId },
    { mediaContent: fileId }
  ).exec(function(err, asset) {
      if(err) {
        res.status(500).send({
          success: false,
          error: err,
        });
      } else {
        res.status(200).send({
          success: true,
          message: (fileId)?"Media successfully uploaded":"Media successfully deleted"
        })
      }
  })
}

function createMedia(res, file, assetId) {
  const writestream = gfs().createWriteStream({
    filename: file.originalname,
    content_type: file.mimetype,
  })
  fs.createReadStream(file.path).pipe(writestream);
  writestream.on('close', function (file) {
    updateAssetMedia(res, assetId, file._id)
  });
}

const mediaPost = function(res, file, orgId, assetId) {
  MediaAsset
  .findOne({_id: assetId/*, owner: orgId*/})
  .exec((err, asset) => {
    if (err) {
      res.status(500).send({
        success: false,
        error: err,
      });
    } else {
      if (asset) {
        createMedia(res, file, assetId)
      } else {
        res.status(403).send({
          success: false,
          message: "You don't have an access to specified asset"
        })
      }
    }
  })
};

// // TODO check owner if could be deleted
// // add to metadata that it is public file or private file
const mediaDelete = function(res, assetId, orgId) {
  MediaAsset
  .findOne({_id: assetId/*, owner: orgId*/})
  .exec((err, asset) => {
    if (err) {
      res.status(500).send({
        success: false,
        error: err,
      });
    } else {
      if (asset) {
        if (asset.mediaContent){
          // new ObjectId(asset.mediaContent) - maybe not needed
          gfs().remove({_id: asset.mediaContent}, function (err, gridStore) {
            if (err) {
              res.json(
                {
                  success: false,
                  message: 'Media couldnt be deleted'
                }
              );
            } else {
              updateAssetMedia(res, assetId, null);
            }
          });
        } else {
          res.status(404).send({
            success: false,
            message: "This asset does not have attached media content"
          })
        }
      } else {
        res.status(403).send({
          success: false,
          message: "You don't have an access to specified asset"
        })
      }
    }
  })
  //TODO check userId == ownerId - in router
  //TODO find media Id in Media Asset!
}

const mediaGet = function(res, mediaId, thumbnail = false) {
  gfs().findOne({_id: mediaId}, function (err, file) {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      }
      else if (!file) {
        res.status(404).send({
          success: false,
          message: "Error on the database looking for the file."
        });
      } else {
        res.set('Content-Type', file.contentType);
        res.set('Content-Disposition', 'inline; filename="' + file.filename + '"');

        // if (thumbnail) {
        //   if (file.contentType.startsWith('image')) {
        //     //check if thumbnails directory exists
        //     const dir = path.join(__dirname, '/../../../thumbnails/')
        //     if (!fs.existsSync(dir)){
        //       fs.mkdirSync(dir);
        //     }
        //     //cache thumbnail if it does not exists
        //     const cacheFile = path.join(dir, file._id.toString());
        //     if (!fs.existsSync(cacheFile)){
        //       var readstream = gfs().createReadStream({
        //         _id: new ObjectId(file._id)
        //       });
        //
        //       readstream.on("error", function(err) {
        //         res.end();
        //       });
        //       //use OS installed imagemagick
        //       gm(readstream, file.filename)
        //       .resize(240, 240)
        //       .noProfile()
        //       .write(cacheFile, function (err) {
        //         if (err) {
        //           res.status(404).send('File not found.');
        //         } else {
        //           res.sendFile(cacheFile);
        //         };
        //       });
        //     } else {
        //       res.sendFile(cacheFile);
        //     }
        //   } else {
        //     const dir = path.join(__dirname, '/../../../public/images');
        //     let placeholder = path.join(dir, 'unknown.png');
        //     if (file.contentType.startsWith('video')) {
        //       placeholder = path.join(dir, 'video.png');
        //     }
        //     if (file.contentType.startsWith('audio')) {
        //       placeholder = path.join(dir, 'audio.png');
        //     }
        //     res.sendFile(placeholder);
        //   }
        // } else {
          var readstream = gfs().createReadStream({
            _id: new ObjectId(file._id)
          });

          readstream.on("error", function(err) {
            res.status(200).end();
          });

          readstream.pipe(res);
        // }

      }
    })
}

// const mediaGetThumb = function(res, mediaId, userId, parentId = null, parentType = null) {
//   mediaGet(res, mediaId, userId, parentId, parentType, true);
// }

module.exports = {
  mediaPost,
  mediaDelete,
  mediaGet,
  // mediaGetThumb,
};
