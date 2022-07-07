const nodemailer = require('nodemailer');
const {google} = require('googleapis');
const ClIENT_ID = "305399775006-svr99f488q9s5o3ml59i7ieoglioipgr.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URL = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN = "1//04JnoyM0Y2krGCgYIARAAGAQSNwF-L9Ir_gP5HQhJ3xtDnkbXwJKVQRXq0E65gOWQhCNRIbNoRTpuZ-5KgxQdyICSCi9o7ip7jiw";
const oAuth2Client = new google.auth.OAuth2(ClIENT_ID, CLIENT_SECRET, REDIRECT_URL);
oAuth2Client.setCredentials({refresh_token: REFRESH_TOKEN});
const sendEmail = (mailOptions) => {
  const accessToken = oAuth2Client.getAccessToken();
  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: 'meghanadh27@gmail.com',
      clientId: ClIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: REFRESH_TOKEN,
      accessToken: accessToken
    }
  })
  transport.sendMail(mailOptions, (error, info) => {
    if(error){console.log(error);}
    else{console.log('Email Send: ' + info.response);}
  })
}
module.exports = {
  sendEmail
}
