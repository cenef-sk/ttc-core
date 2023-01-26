const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');

const UserSchema = new Schema({
  name: {
    type: String
  },
  email: {
    type: String
  },
  password: {
    type: String
  },
  approvedEmail: {
    type: Boolean
  },
  googleSignIn: {
    type: Boolean
  },
  googleToken: {
    type: String
  },
  role: {
    type: String,
    enum: ['Curator', 'Admin'],
    default: 'Curator'
  },
  language: {
    type: String,
    enum: ['en', 'sk', 'cz', 'pl'],
  },
},
{
  timestamps: true
});

UserSchema.pre('save', function(next) {
  const user = this,
        SALT_FACTOR = 5;

  if (!user.isModified('password')) return next();

  bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

// Method to compare password for login
UserSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) { return cb(err); }

    cb(null, isMatch);
  });
}

module.exports = mongoose.model('User', UserSchema);
