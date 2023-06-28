const express  = require('express');
const router   = express.Router();
const config = require('../config');
const ObjectId = require('mongodb').ObjectId;

const User = require('../database/schemas/User');
const PublishedGame = require('../database/schemas/PublishedGame');
const Organization = require('../database/schemas/Organization');
const PRIVACY_FILTER = {password: 0, email: 0}

const jwt = require('jsonwebtoken');

const {sendEmail} = require('../services/userServices');
const {forgotSubject, forgotEmail, reportSubject, reportEmail} = require('../services/emailTemplates');


function getOrgRole(org, userId) {
  let member = org.members.find((member) => {
    if (member.user && userId) {
      return member.user.toString() == userId.toString()
    }
    return false;
  })
  if(member && member.role) {
    return member.role
  } else {
    return null;
  }
}
// GET TOKEN
// create valid token for valid user
router.post('/token', function(req, res, next) {
  var user = new User();

  const password = req.body.password;
  const email = req.body.email;

  if (password && email) {
    User
    .findOne({email: email})
    .exec((err, user) => {
      if (err) {
        res.status(500).send({
          success: false,
          error: err,
        });
      } else {
        if (user) {
          user.comparePassword(password, function(err, isMatch){
            if(isMatch){
              let tokenContent = {
                _id: user._id,
                name: user.name,
                role: user.role,
                language: user.language,
              };
              getOrgsForUser(user._id, res, (orgs) => {
                if (orgs && orgs.length) {
                  let org = orgs[0]
                  tokenContent = Object.assign({}, tokenContent, {
                    orgId: org._id,
                    orgName: org.name,
                    orgRole: getOrgRole(org, user._id)
                  })
                }
                const token = jwt.sign(tokenContent, config.SECRET, {
                  expiresIn: '30d' // expires in 30 days
                });

                res.status(200).json({
                  success: true,
                  token: token
                });
              })
            } else {
              res.status(401).json({
                success: false,
                message: "Wrong Login or Password"
              });
            }
          });
        } else {
          res.status(401).json({
            success: false,
            message: "Wrong Login or Password"
          });
        }
      }
    });
  } else {
    res.status(500).send({
      success: false,
      message: "Password or email not provided!"
    });
  }
});

router.post('/changed-org-token', function(req, res, next) {
  if (req.user) {
    const orgId = req.body._id;
    if (orgId) {
      getOrgsForUser(req.user._id, res, (orgs) => {
        let org = orgs.find((org) => orgId == org._id);
        if (org) {
          let tokenContent = {
            _id: req.user._id,
            name: req.user.name,
            role: req.user.role,
            language: req.user.language,
            orgId: org._id,
            orgName: org.name,
            orgRole: getOrgRole(org, req.user._id)
          };

          const token = jwt.sign(tokenContent, config.SECRET, {
            expiresIn: '30d' // expires in 30 days
          });

          res.status(200).json({
            success: true,
            token: token
          });
        } else {
          res.status(401).send({
            success: false,
            message: "Unauthorized access to organization"
          })
        }
      })
    } else {
      let tokenContent = {
        _id: req.user._id,
        name: req.user.name,
        role: req.user.role,
        language: req.user.language,
      };

      const token = jwt.sign(tokenContent, config.SECRET, {
        expiresIn: '30d' // expires in 30 days
      });

      res.status(200).json({
        success: true,
        token: token
      });
    }
  } else {
    res.status(401).send({
      success: false,
      message: "Unauthorized access to resource"
    })
  }
});

// GET ALL USERS - only admin
router.get('/', function(req, res, next) {
  User
  .find({}, PRIVACY_FILTER)
  .exec((err, users) => {
    if (err) {
      res.status(500).send({
        success: false,
        error: err
      });
    } else {
      res.status(200).send({
        success: true,
        data: users
      });
    }
  });
});

function getUserById(userId, res, cb) {
  User
  .findOne({_id: id}, PRIVACY_FILTER)
  .exec((err, user) => {
    if (err) {
      res.status(500).send({
        success: false,
        error: err
      });
    } else {
      if (user) {
        cb(user);
      } else {
        res.status(404).send({
          success: false,
          message: "No user found!"
        });
      }
    }
  });
}

function getOrgsForUser(userId, res, cb) {
  Organization
  .find({"members.user": userId})
  .exec((err, orgs) => {
    if (err) {
      res.status(500).send({
        success: false,
        error: err
      });
    } else {
      cb(orgs);
    }
  });
}

// GET User
router.get('/:id', function(req, res, next) {
  const id = req.params.id;
  if (ObjectId.isValid(id)) {
    getUserById(id, res, (user) => {
      res.status(200).send({
        success: true,
        data: user
      });
    })
  } else {
    res.status(500).send({
      success: false,
      message: "Incorect user ID!"
    });
  }
});

// GET organizations for the User
router.get('/:id/orgs', function(req, res, next) {
  const id = req.params.id;
  if (ObjectId.isValid(id)) {
    getOrgsForUser(id, res, (orgs) => {
      res.status(200).send({
        success: true,
        data: orgs
      });
    })
  } else {
    res.status(500).send({
      success: false,
      message: "Incorect user ID!"
    });
  }
});

// DELETE User
router.delete('/:id', function(req, res, next) {
  const id = req.params.id;
  if (ObjectId.isValid(id)) {
    User
    .findByIdAndRemove(id)
    .exec((err, user) => {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {
        if (user) {
          res.status(200).send({
            success: true,
            message: "User has been removed!"
          });
        } else {
          res.status(404).send({
            success: false,
            message: "No user found!"
          });
        }
      }
    });
  } else {
    res.status(500).send({
      success: false,
      message: "Incorect user ID!"
    });
  }
});

router.post('/', function(req, res, next) {
  var user = new User();

  user.name = req.body.name;
  user.language = req.body.language;
  user.email = req.body.email;
  user.password = req.body.password;
  user.role = "Curator";
  user.approvedEmail = false;

  User
  .findOne({email: user.email})
  .exec((err, user2) => {
    if (err) {
      res.status(500).send({
        success: false,
        error: err,
      });
    } else {
      if (user2) {
        res.status(403).send({
          success: false,
          message: "User with the same email already exists",
        });
      } else {
        user.save(function(err) {
          if (err){
            res.status(500).send({
              success: false,
              error: err,
            });
          } else {
            delete user.password;
            res.status(200).send({
              success: true,
              data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                approvedEmail: user.approvedEmail,
              }
            });
          }
        });
      }
    }
  });

});

router.post('/report', function(req, res, next) {

  let gameId = req.body.gameId;
  let reason = req.body.reason;
  if (ObjectId.isValid(gameId)) {
    PublishedGame
    .findOne({game: gameId})
    .populate("owner")
    .exec((err, game) => {
      if (err) {
        res.status(500).send({
          success: false,
          error: err,
        });
      } else {
        if (game) {
          sendEmail(config.supportCenterEmail, reportSubject,
          reportEmail(gameId, game.name, game.owner.name, reason, config.WEB_APP), () => {
            res.status(200).send({
              success: true,
            });
          })
        } else {
          res.status(404).send({
            success: false,
            message: "No published game under this ID!"
          });
        }
      }
    });
  } else {
    res.status(500).send({
      success: false,
      message: "Incorect game ID!"
    });
  }
});

router.post('/forgot', function(req, res, next) {
  var user = new User();

  user.email = req.body.email;
  lng = req.body.lng;

  User
  .findOne({email: user.email})
  .exec((err, user2) => {
    if (err) {
      res.status(500).send({
        success: false,
        error: err,
      });
    } else {
      if (user2) {

        const tokenContent = {
          _id: user2._id,
        };
        const token = jwt.sign(tokenContent, config.SECRET, {
          expiresIn: 60*30 // expires in 30 minutes
        });


        sendEmail(user.email, forgotSubject(lng),
        forgotEmail(lng, token), () => {
          res.status(200).send({
            success: true,
          });
        })
      } else {
        res.status(200).send({
          success: true,
        });
      }
    }
  });

});


// token received via email should be valid
router.put('/reset', function(req, res, next) {
  const token = req.body.token;
  const password = req.body.password;

  if (token && password) {
    jwt.verify(token, config.SECRET, function(err, decoded) {
      if (err) {
        //return wrong token
        res.status(200).json({
          success: false,
        })
        // next(new Error('Failed to authenticate. Login again.'));
      } else {
        let id = decoded._id;
        if (ObjectId.isValid(id)) {
          User.findById(id, function(err, user) {
            if (err) {
              res.status(500).send({
                success: false,
                error: err,
              });
            } else {

              if (user) {
                    user.password = password;
                    //TODO ??? why should i remove this?
                    user.updatedAt = Date.now();

                    user.save(function(err) {
                      if (err) {
                        res.status(500).send({
                          success: false,
                          error: err,
                        });
                      } else {
                        res.status(200).send({
                          success: true,
                          message: "User has been updated!"
                        });
                      }
                    });
              }
            }
          });
        } else {
          res.status(500).send({
            success: false,
            message: "Incorect user ID!"
          });
        }

      }
    })
  } else {
    res.status(400).send({
      success: false,
      message: "Bad request"
    });
  }

});


//UPDATE User (update allowed only for - password or name and language)
// password is updated separatelly
router.put('/:id', function(req, res, next) {
  const id = req.params.id;
  if (ObjectId.isValid(id)) {
    User.findById(id, function(err, user) {
      if (err) {
        res.status(500).send({
          success: false,
          error: err,
        });
      } else {

        if (req.body.password && req.body.newPassword && user) {
          user.comparePassword(req.body.password, function(err, isMatch){
            if(isMatch){
              user.password = req.body.newPassword;

              //TODO ??? why should i remove this?
              user.updatedAt = Date.now();

              user.save(function(err) {
                if (err) {
                  res.status(500).send({
                    success: false,
                    error: err,
                  });
                } else {
                  res.status(200).send({
                    success: true,
                    message: "User has been updated!"
                  });
                }
              });
            } else {
              res.status(200).json({
                success: false,
                message: "Wrong Old Password"
              });
            }
          });
        } else {
          if (req.body.name) user.name = req.body.name;
          if (req.body.language) user.language = req.body.language;
          //TODO ??? why should i remove this?
          user.updatedAt = Date.now();

          user.save(function(err) {
            if (err) {
              res.status(500).send({
                success: false,
                error: err,
              });
            } else {
              res.status(200).send({
                success: true,
                message: "User has been updated!"
              });
            }
          });
        }


      }
    });
  } else {
    res.status(500).send({
      success: false,
      message: "Incorect user ID!"
    });
  }
});

module.exports = router;
