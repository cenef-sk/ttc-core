//Define passwords and codes to be gitignored later
function config(){
    switch(process.env.NODE_ENV){
        case 'develop':
            return {
                'dbURI': 'mongodb://localhost/ttc',
                'port': 3070,
                SECRET: "", // secret for signing jwt token
                supportCenterEmail: "", //email where reported issues will be sent
                smtpLogin: "", // login for smtp server we are using gmail
                smtpPass: "", // password for smtp server
                // for gmail you should allow Less secure app access
                // https://accounts.google.com/DisplayUnlockCaptcha
                // further update https://support.google.com/accounts/answer/6010255?hl=en
                WEB_APP: 'https://app.touchtheculture.eu/web/',
            };

        default:
            return {
                'dbURI': 'mongodb://localhost/ttc',
                'port': 3070,
                SECRET: "", // secret for signing jwt token
                supportCenterEmail: "", //email where reported issues will be sent
                smtpLogin: "", // login for smtp server we are using gmail
                smtpPass: "", // password for smtp server
                WEB_APP: 'https://app.touchtheculture.eu/web/',
            };
    }
};

module.exports = config();
