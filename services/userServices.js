const jwt = require('jsonwebtoken');
const config = require('../config');

const nodemailer = require("nodemailer");

const RESET_TOKEN_EXPIRATION = "30m"

let userServices = {};

//30 minute valid token with pa
userServices.resetPasswordToken = (email, passHash) => {
  const tokenContent = {
    email: email,
    jti: passHash,
  };
  const token = jwt.sign(tokenContent, config.SECRET, {
    expiresIn: RESET_TOKEN_EXPIRATION
  });
  return token
}

userServices.checkResetPasswordToken = (token) => {
  let res = jwt.verify(token, config.SECRET);
  // check if jti is ok
  return {email: res.email}
}
userServices.resetPassword = () => {

}

userServices.forgotPassword = () => {

}
userServices.sendEmail = (emailAddress, subject, text, callBack) => {

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: config.smtpLogin, // generated ethereal user
      pass: config.smtpPass, // generated ethereal password
    },
  });


// https://accounts.google.com/b/0/DisplayUnlockCaptcha
// use for new device

    // send mail with defined transport object
    let info = transporter.sendMail({
      from: '"Application TouchTheCulture" <app.touchtheculture@gmail.com>', // sender address
      to: emailAddress, // list of receivers , baz@example.com
      subject: subject, // Subject line
      text: text, // plain text body
      // html: "<b>Hello world?</b>", // html body
    }).then(info => {
      console.log("Message sent: %s", info.messageId);
      callBack()
    });
}
module.exports = userServices;
