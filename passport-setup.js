const passport = require('passport');
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;

//Used to stuff the profile info into a cookie
passport.serializeUser(function(user, done){
  done(null, user);
})
//Used to decode the recieved cookie and persist session
passport.deserializeUser(function(user, done){
  done(null, user);
})
passport.use(new GoogleStrategy({
    clientID:"177101401323-ddg8oa9r6rk4kad9f992hhunansqni7v.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    //profile data is passed to serializeUser
    return done(null, profile);
  }
));
