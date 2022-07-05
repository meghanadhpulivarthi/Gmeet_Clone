let guests = new Array(userEmail);
const socket = io('/');
let guest = $('.guest_input');
const addGuest = () => {
  if(guest.val().length != 0){
    guests.push(guest.val());
    guest.val('');
  }
  console.log(guests);
}

const submit = () => {
  if(guests.length > 1){
    let date = $('.meetingDate');
    let time = $('.meetingTime');
    console.log(time.val());
    let agenda = $('.guest_agenda');
    socket.emit('schedule', date.val(), time.val(), agenda.val(), guests, userName, userEmail);
    date.val('');
    time.val('');
    agenda.val('');
    guest.val('');
    guests = new Array(userEmail);
  }
}
