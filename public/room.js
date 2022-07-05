const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer(undefined, {
  host: '/',
  port: '3001'
})
const myVideo = document.createElement('video');
myVideo.muted = true;
myVideo.setAttribute('id', 1);
myVideo.controls = true;
let myVideoStream;
let ok=0
let is_board=0
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream);
  myPeer.on('call', call => {
    if(ok != 1){
      call.answer(myVideoStream);
      const video = document.createElement('video');
      const userid = call.peer;
      video.setAttribute('id', userid);
      video.setAttribute('class', 'notascreen');
      video.controls = true;
      call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
      })
    }
  })

  socket.on('someone-sharing', (userId, user_Name) => {
    console.log(`${userId} is sharing screeen`)
    console.log(userId)
    $('ul').append(`<li>${user_Name} is screen sharing </br></li>`)
    setTimeout(connectToNewUser, 1000, userId, stream, 1);
  })

  socket.on('whiteboardon', (userId, user_Name) => {
    if(userId != USER_ID){
      $('ul').append(`<li>${user_Name} started WhiteBoard</li>`);
    }
    let canvas = document.querySelector('.canvas');
    document.querySelector('#video-grid').style.opacity = '0';
    canvas.style.opacity = '1';
    let ctx = canvas.getContext("2d");
    let x,y,mouseDown = false;
    canvas.addEventListener('mousedown', e => {
      ctx.moveTo(x,y);
      socket.emit('down', {x,y});
      mouseDown = true;
    })
    canvas.addEventListener('mouseup', e => {
      mouseDown = false;
    })
    socket.on('ondraw', ({x, y}) => {
      ctx.lineTo(x,y);
      ctx.stroke();
    })
    socket.on('ondown', ({x, y}) => {
      ctx.moveTo(x,y);
    })

    canvas.addEventListener('mousemove', e => {
      x = e.clientX;
      y = e.clientY;
      if(mouseDown){
        socket.emit('draw', {x, y});
        ctx.lineTo(x,y);
        ctx.stroke();
      }
    })
  })

  socket.on('user-connected', (userId, user_Name) => {
    console.log('user connected : ' + userId);
    $('ul').append(`<li>${user_Name} joined </br></li>`);
    setTimeout(connectToNewUser, 1000, userId, stream, 0);
  })

  let msg = $('input');
  $('html').keydown(e => {
    if(e.which == 13 && msg.val().length !== 0){
      //console.log(msg.val());
      $('ul').append(`<li class="mymessage"><b class="name">You</b> <span>${msg.val()}</span></li>`);
      scrollToBottom();
      socket.emit('message', msg.val(), userName);
      msg.val('');
    }
  });

  socket.on('createMessage', (message, user_Name) => {
    $('ul').append(`<li class="message"><b class="name">${user_Name}</b><span>${message}</span></li>`);
    scrollToBottom();
  })
})

myPeer.on('error', (err) => {
  console.log(err);
})

socket.on('stop-screen', (userId, user_Name) => {
  $('ul').append(`<li>${user_Name} stopped screen sharing </br></li>`)
  document.querySelector('.screen').remove()
})

socket.on('whiteboardoff', (userId, user_Name) => {
  if(userId != USER_ID){
    $('ul').append(`<li>${user_Name} stopped WhiteBoard </br></li>`)
  }
  const canvas = document.querySelector('.canvas')
  const ctx = canvas.getContext('2d');
  canvas.style.opacity = '0';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.querySelector('#video-grid').style.opacity = '1';
})

socket.on('user-disconnected', (userId, user_Name) => {
  //console.log('user disconnected : ' + userId);
  document.getElementById(userId).remove();
  $('ul').append(`<li>${user_Name} left </br></li>`)
  const temp = document.getElementById(userId);
  if(temp){
    temp.remove();
  }
})

let USER_ID;
myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id, userName);
  USER_ID = id;
})

const connectToNewUser= (userId, stream, isscreen) => {
  const call = myPeer.call(userId, stream);
  const video = document.createElement('video');
  video.setAttribute('id', userId);
  video.controls = true;
  if(isscreen){
    video.setAttribute('class', 'screen');
    video.controls = true;
  }
  else{video.setAttribute('class', 'notascreen');}
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream);
  });
}

const addVideoStream = (video, stream) => {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', ()=> {
    video.play();
  })
  videoGrid.append(video);
}

const scrollToBottom = () => {
  let d = $('.messages');
  d.scrollTop(d.prop("srollHeight"));
}

const WhiteBoardorNot = () => {
  const canvas = document.querySelector(".canvas");
  if(!is_board){
    if(canvas.style.opacity === '1'){
      alert('Someone already started WhiteBoard');
      return;
    }
    socket.emit('whiteboard', ROOM_ID, USER_ID, userName);
    $('ul').append(`<li>You started WhiteBoard <br/></li>`)
    setNotWhiteBoardButton();
    is_board = 1;
  }else{
    socket.emit('whiteboardoff', ROOM_ID, USER_ID, userName);
    $('ul').append(`<li>You have stopped WhiteBoard</li>`)
    setWhiteBoardButton();
    is_board = 0;
  }
}

setWhiteBoardButton = () => {
  const html = `
  <i class="fa-solid fa-chalkboard"></i>
  <span>WhiteBoard</span>
  `
  document.querySelector('.white_board_button').innerHTML = html;
}

setNotWhiteBoardButton = () => {
  const html = `
  <i class="stopboard fa-solid fa-chalkboard"></i>
  <span>Stop Board</span>
  `
  document.querySelector('.white_board_button').innerHTML = html;
}

const shareScreenorNot = () => {
  const screen_is = document.querySelector('.screen');
  if(ok == 0){
    if(screen_is){
      alert('Someone else is Screen Sharing')
      return;
    }
    ok = 1
    setNotShareScreenButton()
    navigator.mediaDevices.getDisplayMedia({
      video: {cursor: true},
      audio: false
    }).then(stream => {
      socket.emit('sharescreen', ROOM_ID, USER_ID, userName)
      myPeer.on('call', call => {
        call.answer(stream);
      })
    })
    $('ul').append(`<li>You are Screen Sharing </br></li>`)
  }else{
    setShareScreenButton()
    $('ul').append(`<li>You stopped Screen Sharing </br></li>`)
    socket.emit('sharescreenoff', ROOM_ID, USER_ID, userName);
    ok = 0;
  }
}

setNotShareScreenButton = () => {
  const html = `
  <i class="unshare fa-solid fa-eye-slash"></i>
  <span>Stop Sharing</span>
  `
  document.querySelector('.screen_share_button').innerHTML = html;
}

setShareScreenButton = () => {
  const html = `
  <i class="fa-solid fa-arrow-up-from-bracket"></i>
  <span>Share Screen</span>
  `
  document.querySelector('.screen_share_button').innerHTML = html;
}

const MuteorUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if(enabled){
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  }else{
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const setUnmuteButton = () => {
  const html =
  `<i class="unmute fa-solid fa-microphone-slash"></i>
  <span>Unmute</span>`;
  document.querySelector('.mute_button').innerHTML = html;
}
const setMuteButton = () => {
  const html =`
  <i class="fa-solid fa-microphone"></i>
  <span>Mute</span>
  `
  document.querySelector('.mute_button').innerHTML = html;
}

const OnorOffvideo = () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if(enabled){
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  }else{
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

const setPlayVideo = () => {
  const html = `
  <i class="stop fa-solid fa-video-slash"></i>
  <span>Play Video</span>
  `
  document.querySelector('.stop_video_button').innerHTML = html;
}

const setStopVideo = () => {
  const html = `
  <i class="fa-solid fa-video"></i>
  <span>Stop Video</span>
  `
  document.querySelector('.stop_video_button').innerHTML = html;
}
