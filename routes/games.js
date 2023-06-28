const express  = require('express');
const router   = express.Router();
const Game = require('../database/schemas/Game');
const Analytics = require('../database/schemas/Analytics');
const PublishedGame = require('../database/schemas/PublishedGame');
const Download = require('../database/schemas/Download');
var ObjectId = require('mongodb').ObjectId;
const uuid = require('uuid');

router.get('/published/all', function(req, res, next) {
  PublishedGame
  .find({})//{publicGame: true}
  // .find({codeOnly: false})//{publicGame: true}
  .populate("owner")
  // .populate("game")
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
});

router.get('/published', function(req, res, next) {
  PublishedGame
  .find({codeOnly: false})//{publicGame: true}
  .populate("owner")
  // .populate("game")
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
});
// GET ALL Games for the org



router.get('/', function(req, res, next) {
  if (req.user && req.org) {
    Game
    .find({owner: req.org._id})
    // Game.aggregate([
    //   { "$match": { owner: req.org._id } }
    // //   {
    // //     $lookup: {
    // //         from: "PublishedGame", // collection name in db
    // //         localField: "game",
    // //         foreignField: "_id",
    // //         as: "worksnapsTimeEntries"
    // //     }
    // // }
    // ])
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
    //TODO Unauthorized access
    res.status(200).send({
      success: true,
      data: []
    });
  }
});

router.get('/assets/:assetId', function(req, res, next) {
  const assetId = req.params.assetId;
  if (ObjectId.isValid(assetId)) {
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
          PublishedGame
          .find({owner: req.org._id})
          .exec(( err, games2) => {
            if (err) {
              res.status(500).send({
                success: false,
                error: err
              });
            } else {
              let gs1 = games.reduce((prev, g) => {
                if (extractAssetsGame(g).assets.includes(assetId)) {
                  return(prev.concat({
                    name: g.name,
                    _id: g._id
                  }))
                } else {
                  return prev
                }
              }, [])
              let gs2 = games2.reduce((prev, g) => {
                if (extractAssetsGame(g).assets.includes(assetId)) {
                  return(prev.concat({
                    name: g.name,
                    _id: g._id,
                    game: g.game,

                  }))
                } else {
                  return prev
                }
              }, [])
              res.status(200).send({
                success: true,
                data: gs1.concat(gs2)
              });
            }
        })
      }
      });
    } else{
      //TODO Unauthorized access
      res.status(200).send({
        success: true,
        data: []
      });
    }
  } else {
    res.status(400).send({
      success: false,
      message: "Invalid ID of the requested object"
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
      if (activity.type === "one-correct") {
        if (activity.content && activity.content.questions) {
          let pairAssets = activity.content.questions.reduce((prev, cur) => {
            let res = []
            if (cur.correct && cur.correct.img) {
              res = res.concat(cur.correct.img)
            }
            if (cur.wrong && cur.wrong.img) {
              res = res.concat(cur.wrong.img)
            }
            return prev.concat(res)
          }, [])
          assets = addAssets(assets, pairAssets)
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
  return Object.assign({}, game, {assets: assets})
}

router.get('/:code/codedownload', function(req, res, next) {
  const code = req.params.code;
  PublishedGame
  .findOne({entryCode: code})
  .populate("bg.asset")
  .exec(function(err, game) {
    if (err) {
      res.status(500).send({
        success: false,
        error: err
      });
    } else {
      if (game) {
        game = Object.assign({}, game.toObject())
        game = enhanceById(game)

        var downloadGame = new Download();
        downloadGame.game = game.game
        downloadGame.pubGame = game._id
        downloadGame.downloadId = game.downloadId

        downloadGame.save(function(err) {
          if (err){
            res.status(500).send({
              success: false,
              error: err,
            });
          } else {
            res.status(200).send({
              success: true,
              data: extractAssetsGame(game)
            });
          }
        })

      } else {
        res.status(404).send({
          success: false,
          message: "Game under specific code is not published"
        });
      }
    }
  });
})

router.get('/:gameId/download', function(req, res, next) {
  const id = req.params.gameId;
  if (ObjectId.isValid(id)) {
    PublishedGame
    .findOne({game: id})
    .populate("bg.asset")
    .exec(function(err, game) {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {
        if (game) {
          game = Object.assign({}, game.toObject())
          game = enhanceById(game)

          var downloadGame = new Download();
          downloadGame.game = game.game
          downloadGame.pubGame = game._id
          downloadGame.downloadId = game.downloadId

          downloadGame.save(function(err) {
            if (err){
              res.status(500).send({
                success: false,
                error: err,
              });
            } else {
              res.status(200).send({
                success: true,
                data: extractAssetsGame(game)
              });
            }
          })

        } else {
          res.status(404).send({
            success: false,
            message: "Game with specific ID is not published"
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
})

router.get('/:gameId/downloads', function(req, res, next) {
  const id = req.params.gameId;
  if (ObjectId.isValid(id)) {
    Download
    .find({game: id})
    .exec(function(err, downloads) {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {
        res.status(200).send({
          success: true,
          data: downloads.length
        });
      }
    });
  } else {
    res.status(400).send({
      success: false,
      message: "Invalid ID of the requested object"
    });
  }
})

router.get('/:gameId/test', function(req, res, next) {
  const id = req.params.gameId;
  if (ObjectId.isValid(id)) {
    Game
    // .findOneAndUpdate({game: id}, {$inc : {'downloads' : 1}})
    // update should be done in analytics
    .findOne({_id: id})
    .populate("bg.asset")
    .exec(function(err, game) {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {
        if (game) {
          game = Object.assign({}, game.toObject())
          game = enhanceById(game)
          game.game = game._id
          // saveAnalytics(game)
          res.status(200).send({
            success: true,
            data: extractAssetsGame(game)
          });
        } else {
          res.status(404).send({
            success: false,
            message: "Game with specific ID is not published"
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
})

router.get('/:gameId', function(req, res, next) {
  gameById(req, res, false);
})

function enhanceById(game) {
  return Object.assign({}, game, {downloadId: uuid.v1()})
}

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
          game = Object.assign({}, game.toObject())
          game = enhanceById(game)
          // saveAnalytics(game)
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

router.get('/:gameId/analytics', function(req, res, next) {
  const id = req.params.gameId;
  if (ObjectId.isValid(id)) {
    Game
    .findOne({_id: id})
    .exec(function(err, game) {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {
        Analytics
        .find({game: id})
        .exec(function(err, analytics) {
          if (err) {
            res.status(500).send({
              success: false,
              error: err
            });
          } else {
            res.status(200).send({
              success: true,
              data: analytics
            });
          }
        })
      }
    });
  } else {
    res.status(400).send({
      success: false,
      message: "Invalid ID of the requested object"
    });
  }
})

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

// router.put('/:gameId/unpublish', function(req, res, next) {

// router.post('/:gameId/analytics', function(req, res, next) {

router.post('/:gameId/analytics', function(req, res, next) {
  const id = req.params.gameId;
  if (ObjectId.isValid(id)) {
    Game
    .findOne({_id: id})
    .exec(function(err, game) {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {
        var analytics = new Analytics()

        analytics.game = id
        analytics.pubGame = req.body.pubGame
        analytics.downloadId = req.body.downloadId
        analytics.data = req.body.data

        // finished: Boolean,
        // duration: Number,
        // activities: [
        //   name: String,
        //   finished: Boolean,
        //   duration: Number,
        //   data: Schema.Types.Mixed
        // ],
        // data: Schema.Types.Mixed

        analytics.save(function(err) {
          if (err){
            res.status(500).send({
              success: false,
              error: err,
            });
          } else {
            res.status(200).send({
              success: true,
              data: analytics
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
})

// router.put('/:gameId/analytics', function(req, res, next) {
// // TODO remove old versions
// // version timestamp
//   const id = req.params.gameId;
//   if (ObjectId.isValid(id)) {
//     Game.findById(id, function(err, game) {
//       if (err) {
//         res.status(500).send({
//           success: false,
//           error: err
//         });
//       } else {
//         var gameObj = game.toObject()
//         var gameId = gameObj._id
//         delete gameObj._id
//         var pubGame = Object.assign(new PublishedGame(), gameObj)
//         pubGame.game = gameId
//
//         pubGame.save(function(err) {
//           if (err) {
//             res.status(500).send({
//               success: false,
//               error: err
//             });
//           } else {
//             res.status(200).send({
//               success: true,
//               message: 'Game has been published',
//               data: pubGame
//             });
//           }
//         });
//       }
//     });
//   } else {
//     res.status(400).send({
//       success: false,
//       message: "Invalid ID of the requested object"
//     });
//   }
// });

// gameId vs pubgameId - only as reference
router.put('/:gameId/publish', function(req, res, next) {
// TODO remove old versions
// version timestamp
  const id = req.params.gameId;
  if (ObjectId.isValid(id)) {
    Game.findById(id, function(err, game) {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {
        var gameObj = game.toObject()
        var gameId = gameObj._id
        delete gameObj._id
        delete gameObj.updatedAt
        delete gameObj.createdAt
        var pubGame = Object.assign(new PublishedGame(), gameObj)
        pubGame.game = gameId
        pubGame.published = true
        if (req.body.codeOnly) {
          pubGame.codeOnly = true
        } else {
          pubGame.codeOnly = false
        }
        delete pubGame.updatedAt
        delete pubGame.createdAt

        PublishedGame.findOneAndRemove({game: id}, function(err) {
          if (err) {
            res.status(500).send({
              success: false,
              error: err
            });
          } else {
            pubGame.save(function(err) {
              if (err) {
                res.status(500).send({
                  success: false,
                  error: err
                });
              } else {
                res.status(200).send({
                  success: true,
                  message: 'Game has been published',
                  data: pubGame
                });
              }
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

router.delete('/:pubGameId/unpublish', function(req, res, next) {

  const id = req.params.pubGameId;
  if (ObjectId.isValid(id)) {
    PublishedGame.findOneAndRemove({game: id}, function(err, game) {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {
        if (game) {
          res.status(200).send({
            success: true,
            message: 'Game has been unpublished!'
          });
        } else {
          res.status(404).send({
            success: false,
            message: 'No game found!'
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
    PublishedGame.findOneAndRemove({game: id}, function(err, game) {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {
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
