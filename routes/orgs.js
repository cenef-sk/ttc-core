const express  = require('express');
const router   = express.Router();
const Organization = require('../database/schemas/Organization');
const ObjectId = require('mongodb').ObjectId;
const PRIVACY_FILTER = {password: 0, email: 0}

// GET ALL Organizations
router.get('/', function(req, res, next) {
  Organization
  .find({})
  .exec(( err, orgs) => {
    if (err) {
      res.status(500).send({
        success: false,
        error: err
      });
    } else {
      res.status(200).send({
        success: true,
        data: orgs
      });
    }
  });
});


router.get('/:orgId', function(req, res, next) {
  const id = req.params.orgId;
  if (ObjectId.isValid(id)) {
    Organization
    .findOne({_id: id})
    .exec(function(err, org) {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {
        res.status(200).send({
          success: true,
          data: org
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

router.get('/:orgId/members', function(req, res, next) {
  const id = req.params.orgId;
  if (ObjectId.isValid(id)) {
    Organization
    .findOne({_id: id})
    .populate("members.user", PRIVACY_FILTER)
    .populate("memberRequests", PRIVACY_FILTER)
    .exec(function(err, org) {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {
        res.status(200).send({
          success: true,
          data: org
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

router.post('/', function(req, res, next) {
  var org = new Organization();

  org.name = req.body.name;
  org.description =  req.body.description;
  org.members = [{role: "Admin", user: req.user._id}]

  org.save(function(err) {
    if (err){
      res.status(500).send({
        success: false,
        error: err,
      });
    } else {
      res.status(200).send({
        success: true,
        data: org
      });
    }
  });
});

router.put('/:orgId', function(req, res, next) {
  const id = req.params.orgId;
  if (ObjectId.isValid(id)) {
    Organization.findById(id, function(err, org) {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {

        if (req.body.name) org.name = req.body.name;
        if (req.body.description) org.description = req.body.description;

        org.save(function(err) {
          if (err) {
            res.status(500).send({
              success: false,
              error: err
            });
          } else {
            res.status(200).send({
              success: true,
              message: 'Organization has been updated!',
              data: org
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

router.post('/:orgId/join', function(req, res, next) {
  const id = req.params.orgId;
  const userId = req.user._id
  processRequest(id, userId, true, false, false, false, req, res)
});

router.put('/:orgId/accept/:userId', function(req, res, next) {
  //TODO check if current user is admin of org
  const id = req.params.orgId;
  const userId = req.params.userId
  processRequest(id, userId, false, true, false, false, req, res)
});

router.delete('/:orgId/join', function(req, res, next) {
  const id = req.params.orgId;
  const userId = req.user._id
  processRequest(id, userId, false, false, true, false, req, res)
});

router.delete('/:orgId/reject/:userId', function(req, res, next) {
  //TODO check if current user is admin of org
  const id = req.params.orgId;
  const userId = req.params.userId
  processRequest(id, userId, false, false, true, false, req, res)
});

router.delete('/:orgId/cancel/:userId', function(req, res, next) {
  //TODO check if current user is admin of org
  const id = req.params.orgId;
  const userId = req.params.userId
  processRequest(id, userId, false, false, false, true, req, res)
});

function processRequest(id, userId, isRequest, isAccept, isDelete, isCancel, req, res) {
  if (ObjectId.isValid(id)) {
    Organization.findById(id, function(err, org) {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {
        if(isRequest || isAccept || isDelete || isCancel) {
          let saveFnc = (org) => {
            org.save((err) => {
              if (err) {
                res.status(500).send({
                  success: false,
                  error: err
                });
              } else {
                res.status(200).send({
                  success: true,
                  message: 'Organization has been updated!',
                  data: org
                });
              }
            });
          }
          if(isDelete) {
            if(org.memberRequests.some((id) => (userId == id))) {
              org.memberRequests.pull(userId);
              saveFnc(org)
            } else {
              res.status(400).send({
                success: false,
                message: 'No pending request!',
              });
            }
          } else if (isRequest) {
            if(!org.memberRequests.some((id) => (userId == id))) {
              org.memberRequests.push(userId);
              saveFnc(org)
            } else {
              res.status(400).send({
                success: false,
                message: 'Request already pending!',
              });
            }
          } else if (isAccept) {
            if(org.memberRequests.some((id) => (userId == id))) {
              org.memberRequests.pull(userId);
              org.members.push({
                role: "Member",
                user: userId
              })
              saveFnc(org)
            } else {
              res.status(400).send({
                success: false,
                message: 'No pending request!',
              });
            }
          } else if(isCancel) {
            if(org.members.some((member) => (userId == member.user))) {
              org.members = org.members.filter((member) => member.user != userId)
              saveFnc(org)
            } else {
              res.status(400).send({
                success: false,
                message: 'User is not a member!',
              });
            }
          }
        } else {
          res.status(500).send({
            success: false,
            message: 'Something went wrong!',
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

router.delete('/:orgId', function(req, res, next) {
    //TODO remova mediacontent and mediaassets!!! - before skolenie
  const id = req.params.orgId;
  if (ObjectId.isValid(id)) {
    Organization.findByIdAndRemove(id, function(err) {
      if (err) {
        res.status(500).send({
          success: false,
          error: err
        });
      } else {
        res.status(200).send({
          success: true,
          message: 'Organization has been removed!'
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
