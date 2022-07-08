const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const {v4: uuidv4} = require('uuid');
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const schedule = require('node-schedule')

app.set('view engine', 'ejs');
app.use(morgan('dev'));
app.use(express.static('public'));
require('./passport-setup.js');
const Email = require('./sendEmail.js');

app.use(session({
  secret: 'SECRET',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(urlencodedParser);

function isLoggedin(req, res, next){
  if(req.user){next();}
  else{res.redirect('/');}
}


app.get('/', (req, res) => {
  if(!req.user){res.render('homepage');}
  else{res.redirect('/success');}
})

app.get('/startmeeting', isLoggedin, (req,res) => {
  res.redirect(`/${uuidv4()}`);
})

app.get('/schedulemeeting', isLoggedin, (req,res) => {
  res.render('schedulemeeting', {userinfo: req.user});
})

app.get('/success', isLoggedin, (req,res) => {
  //console.log(req.user);
  res.render('success', {userinfo: req.user});
})

app.post('/success',isLoggedin,(req,res) => {
  res.redirect(`/${req.body.meetingid}`);
})

app.get('/auth/google',
  passport.authenticate('google', { scope:
      [ 'email', 'profile' ] }
));

app.get('/auth/google/callback',
    passport.authenticate( 'google', {
        successRedirect: '/success',
        failureRedirect: '/'
}));

app.get('/logout', (req, res) => {
  req.logout(function(err){
    if(err){return next(err);}
    res.redirect('/');
  });
})

app.get('/:room',isLoggedin, (req,res) => {
  res.render('room', {roomId : req.params.room, username: req.user.displayName});
})

io.on('connection', (socket) => {
  socket.on('schedule', (date, time, agenda, guests, userName, userEmail) => {
    sendMailToGuests(date, time, agenda, guests, userName, userEmail);
  })
  socket.on('join-room', (roomId, userId, userName) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit('user-connected', userId, userName);
    socket.on('sharescreen', (roomId, userId, userName) => {
      socket.broadcast.to(roomId).emit('someone-sharing', userId, userName);
    })
    socket.on('sharescreenoff', (roomId, userId, userName) => {
      socket.broadcast.to(roomId).emit('stop-screen', userId, userName);
    })
    socket.on('whiteboard', (roomId, userId, userName) => {
      io.to(roomId).emit('whiteboardon', userId, userName);
    })
    socket.on('whiteboardoff', (roomId, userId, userName) => {
      io.to(roomId).emit('whiteboardoff', userId, userName);
    })
    socket.on('message', (message, user_Name) => {
      socket.broadcast.to(roomId).emit('createMessage', message, user_Name);
    })
    socket.on('draw', (data) => {
      socket.broadcast.to(roomId).emit('ondraw', {x: data.x, y: data.y});
    })
    socket.on('down', (data) => {
      socket.broadcast.to(roomId).emit('ondown', {x: data.x, y: data.y});
    })
    socket.on('disconnect', () => {
      socket.broadcast.to(roomId).emit('user-disconnected', userId, userName);
    })
  })
})
server.listen(3000);

const sendMailToGuests = (date, time, agenda, guests, userName, userEmail) => {
  const randomnumber = `${uuidv4()}`;
  const mailOptions = {
    from: {
      name: `${userName}`,
      address: `${userEmail}`
    },
    to: guests,
    subject: 'Meeting Invitation',
    text: `\nDetails of the Meeting\n Meeting Agenda: ${agenda}\n Meeting Time: ${time}\n Meeting Date: ${date}\n Meeing Id : ${randomnumber}\n`
  }
  const mailOptions2 = {
    from: {
      name: `${userName}`,
      address: `${userEmail}`
    },
    to: guests,
    subject: 'Meeting Remainder',
    text: `\nMeeting will start in 15 min\n Meeting Agenda: ${agenda}\n Meeting Id : ${randomnumber}\n`
  }
  const array = date.split("-");
  const arr = time.split(":");
  const year = parseInt(array[0]);
  const month = parseInt(array[1])-1;
  const day = parseInt(array[2]);
  const hour = parseInt(arr[0]);
  const min = parseInt(arr[1]);
  let scheduleDate = new Date(year, month, day, hour, min);
  scheduleDate = new Date(scheduleDate-15*60*1000);
  console.log(scheduleDate);
  Email.sendEmail(mailOptions);
  schedule.scheduleJob(scheduleDate, function(){
    Email.sendEmail(mailOptions2);
  });
}
//TODO: whiteboard
