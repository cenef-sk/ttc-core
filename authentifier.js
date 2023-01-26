const jwt = require('jsonwebtoken');
const config = require('./config.js');

//router check if authentified user
function authentifier(req, res, next) {

  const auth = req.headers.authorization

  const bearer = (
    auth &&
    auth.startsWith("Bearer ")) ?
      auth.replace(/^(Bearer )/,"") : null;

  const accessToken =
    req.body.access_token ||
    req.query.access_token ||
    req.headers['x-access-token'] ||
    bearer;

  if (accessToken) {
    jwt.verify(accessToken, config.SECRET, function(err, decoded) {
      if (err) {
        res.status(401).json({
          success: false,
          message: "Unauthorized access to resource"
        })
        // next(new Error('Failed to authenticate. Login again.'));
      } else {
        req.user = {
          _id: decoded._id,
          name: decoded.name,
          role: decoded.role,
          language: decoded.language,
        };
        if (decoded.orgId) {
          req.org = {
              _id: decoded.orgId,
              name: decoded.orgName,
              role: decoded.orgRole
          }
        }
        next();
      }
    })
  } else {
    req.user = null;
    req.org = null;
    next();
  }
};

module.exports = authentifier;
