const express  = require('express');
const router   = express.Router();
const Game = require('../database/schemas/Game');
var ObjectId = require('mongodb').ObjectId;

// GET ALL Games for the org
router.get('/', function(req, res, next) {
  if (req.user && req.org) {
    Game
    .find({owner: req.org._id})
    .exec(( err, games) => {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {
        res.status(200).send({
          success: true,
          data: games
        });
      }
    });
  } else{
    Game
    .find({published: true})
    .populate("owner")
    .exec(( err, games) => {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {
        res.status(200).send({
          success: true,
          data: games
        });
      }
    });
  }
});

function addAsset(assets, asset) {
  if (asset) {
    assetId = asset.toString()
    if (assetId && !assets.includes(assetId)) {
      return assets.concat(assetId)
    }
  }
  return assets
}

function addAssets(assets, addedAssets) {
  let res = assets;
  for (let asset of addedAssets) {
    res = addAsset(res, asset)
  }
  return res
}

function extractAssetsGame(game) {
  let assets = []
  if (game.bg && game.bg.asset && game.bg.asset._id) {
    assets = addAsset(assets, game.bg.asset._id)
  }
  if (game.bg && game.bg.asset && !game.bg.asset._id) {
    assets = addAsset(assets, game.bg.asset)
  }
  if (game.activities) {
    game.activities.forEach(activity => {
      if (activity.type === "find-detail") {
        if (activity.content && activity.content.asset) {
          assets = addAsset(assets, activity.content.asset)
        }
      }
      if (activity.type === "timeline") {
        if (activity.content && activity.content.items) {
          assets = addAssets(assets, activity.content.items)
        }
      }
      if (activity.type === "quiz" || activity.type === "open-question") {
        if (activity.content && activity.content.questions) {
          let toAdd = activity.content.questions.map(q => q.img)
          assets = addAssets(assets, toAdd)
        }
      }
      if (activity.type === "memory") {
        if (activity.content && activity.content.pairs) {
          let pairAssets = activity.content.pairs.reduce((prev, cur) => {
            let res = []
            if (cur.item1 && cur.item1.img) {
              res = res.concat(cur.item1.img)
            }
            if (cur.item2 && cur.item2.img) {
              res = res.concat(cur.item2.img)
            }
            return prev.concat(res)
          }, [])
          assets = addAssets(assets, pairAssets)
        }
      }
    })
  }
  return Object.assign({}, game.toObject(), {assets: assets})
}
router.get('/:gameId/download', function(req, res, next) {
  gameById(req, res, true);
})
router.get('/:gameId', function(req, res, next) {
  gameById(req, res, false);
})

function gameById(req, res, download) {
  const id = req.params.gameId;
  if (ObjectId.isValid(id)) {
    Game
    .findOne({_id: id})
    .populate("bg.asset")
    .exec(function(err, game) {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {
        if (download) {
          // TODO save statistics of download!
          res.status(200).send({
            success: true,
            data: extractAssetsGame(game)
          });
        } else {
          res.status(200).send({
            success: true,
            data: game
          });
        }
      }
    });
  } else {
    res.status(400).send({
      success: false,
      message: "Invalid ID of the requested object"
    });
  }
}


router.post('/', function(req, res, next) {
  var game = new Game();

  game.name =  req.body.name;
  game.description = req.body.description
  game.bg = req.body.bg
  game.activities = req.body.activities
  game.owner = req.org._id
  game.creator = req.user._id
  game.language = req.body.language
  game.difficulty = req.body.difficulty
  game.ageRestriction = req.body.ageRestriction

  game.badge = req.body.badge
  game.introText = req.body.introText
  game.endText = req.body.endText
  game.entryCode = req.body.entryCode

  game.published = req.body.published

  game.save(function(err) {
    if (err){
      res.status(500).send({
        success: false,
        error: err,
      });
    } else {
      res.status(200).send({
        success: true,
        data: game
      });
    }
  });
});


router.put('/:gameId', function(req, res, next) {
  const id = req.params.gameId;
  if (ObjectId.isValid(id)) {
    Game.findById(id, function(err, game) {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {
        if (req.body.name) game.name =  req.body.name
        if (req.body.description) game.description = req.body.description
        if (req.body.bg) game.bg = req.body.bg
        if (req.body.activities) game.activities = req.body.activities
        if (req.body.language) game.language = req.body.language
        if (req.body.difficulty || req.body.difficulty == 0) game.difficulty = req.body.difficulty
        if (req.body.ageRestriction) game.ageRestriction = req.body.ageRestriction

        if (req.body.badge) game.badge = req.body.badge
        if (req.body.introText) game.introText = req.body.introText
        if (req.body.endText) game.endText = req.body.endText
        if (req.body.entryCode) game.entryCode = req.body.entryCode

        if (req.body.published) {
          game.published = req.body.published
        } else {
          game.published = false
        }

        game.save(function(err) {
          if (err) {
            res.status(500).send({
              success: false,
              error: err
            });
          } else {
            res.status(200).send({
              success: true,
              message: 'Game has been updated!',
              data: game
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

router.delete('/:gameId', function(req, res, next) {
  const id = req.params.gameId;
  if (ObjectId.isValid(id)) {
    Game.findByIdAndRemove(id, function(err) {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {
        res.status(200).send({
          success: true,
          message: 'Game has been removed!'
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
