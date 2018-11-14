const socket = io();

let username;

let private = false;

let currentUserTab = false;

$('#main').hide();
$('.create-room-container').hide();

$('.room-current-tab').on('click', () => {
    $('.room-hide').toggle();
});
// changes the tab name
$(".room-tab-select").on("click", (event) => {
    let id = event.target.id;
    $('.room-tab-select').removeClass('inset');
    switch(id) {
        case 'public-tab':
            $('.room-current-tab-name').html("Public");
            $(`#${id}`).addClass("inset");
            $('.room-container').show();
            $('.search-bar-container').show();
            $('.create-room-container').hide();
        break;
        case 'private-tab':
            $('.room-current-tab-name').html("Private");
            $(`#${id}`).addClass("inset");
            $('.search-bar-container').show();
            $('.create-room-container').hide();
        break;
        case 'create-tab':
            $('.room-current-tab-name').html("Create");
            $(`#${id}`).addClass("inset");
            $('.room-container').hide();
            $('.search-bar-container').hide();
            $('.create-room-container').show();
        break;
    }
    $('.room-hide').toggle();
});

$('#public-tab').on('click', () => {
    socket.emit('clickedPublicRooms');
})

$('#private-tab').on('click', () => {
    socket.emit('clickedPrivateRooms');
})

$('.user-current-tab').on('click', () => {
    $('.user-hide').toggle();
});

$(".user-tab-select").on("click", (event) => {
    let id = event.target.id;
    $('.user-tab-select').removeClass('user-inset');
    switch(id) {
        case 'all-users-tab':
        $('.user-current-tab-name').html("All users");
        $(`#${id}`).addClass("user-inset");
        break;
        case 'current-users-tab':
        $('.user-current-tab-name').html("Users in current room");
        $(`#${id}`).addClass("user-inset");
        break;
    }
});

$('#login-form').submit(function(e){
    e.preventDefault();
    let name = $('#username').val();
    let data = {'username': name, 'room': "Global"};
    username = $('#username').val();
    $('#current-user').html(username);
    socket.emit("newUser", data);
    $('#login-container').hide();
    $('#main').show();
    console.log();
    return false;
});

$('#chat-box').submit(function(e){
    e.preventDefault();
    let data = {'username': username, 'message': $('#chat-text').val()};
    socket.emit('chatMessage', data);
    $('#chat-text').val('');
    return false;
});

socket.on('chatMessage', function(msg){
    $('#chat-display').append($(`
        <div class="chat-message-wrapper">
            <p class="chat-message-user">${msg.username}</p>
            <p class="chat-message">${msg.message}</p>
        </div>
    `));
});

/* current users in room tab */
socket.on('getRoomUsers2', (data) => {
    if (currentUserTab) {
        $('.user-wrapper').html('');
        for (let i = 0; i < data.length; i++) {
            $('.user-wrapper').append(`
                <div class="user">
                    <p class="user-name">${data[i]}</p>
                </div>
            `)
        }
    }
})

/* all users */
socket.on('getUsers', function(users) {
    if (currentUserTab == false) {
        $('.user-wrapper').html('');
        for (let i = 0; i < users.length; i++) {
            $('.user-wrapper').append(`
                <div class="user">
                    <p class="user-name">${users[i].name}</p>
                </div>
            `)
        }
    }
});


$('#current-users-tab').on('click', function() {
    currentUserTab = true;
    socket.emit('getRoomUsers');
    $('.user-tab-select').hide();
})

$('#all-users-tab').on('click', function() {
    currentUserTab = false;
    socket.emit('getUsers');
    $('.user-tab-select').hide();
})

socket.on('currentRoom', function(data) {
    $('#current-room').html(data.message);
});

socket.on('getRooms', function(data) {
    $('.room-container').html('');
    for (let i = 0; i < data.length; i++) {
        $('.room-container').append(`
            <div class="room public" id="${data[i].name}">
                <p class="room-name">${data[i].name}</p>
                <p class="room-users">${data[i].users} users</p>
            </div>
        `)
    }
})

socket.on('getPrivateRooms', function(data) {
    $('.room-container').html('');
    for (let i = 0; i < data.length; i++) {
        $('.room-container').append(`
            <div class="room private" >
                <p class="room-name">${data[i].name}</p>
                <p class="room-users">${data[i].users} users</p>
                <input class="password-guess" type="password" placeholder="password" required/>
                <button class="private-submit" id=${data[i].password} type="submit">join</button>
                <input class="hidden" type='hidden' value="${data[i].name}"/>
            </div>
        `)
    }
})

$('')

$('.room-container').on('click','.public', (event) => {
    let data = event.target.id;
    socket.emit('joinPublicRoom', data);
})

$('.room-container').on('click','.private-submit', (event) => {
    let password = event.target.id;
    let passwordGuess = $(event.target).siblings('.password-guess').val();
    let roomName = $(event.target).siblings('.hidden').val();

    if (password == passwordGuess) {
        socket.emit('joinPrivateRoom', roomName);
    } else {
        alert("Incorrect password");
    }
    
})

$('.create-room-private-switch').on('click', (e) => {
    e.preventDefault();
    if (!private) {
        private = !private;
        $('.create-room-private-switch').addClass('blue');
        $('.create-room-password').show();
    } else {
        private = !private;
        $('.create-room-private-switch').removeClass('blue');
        $('.create-room-password').hide();
    }
});

$('.create-room-submit').on('click', (e) => {
    e.preventDefault();
    if (!private) {
        let data = {'name': $('.create-room-name').val(), 'users': 1, 'admin': username, 'id': 0};
        socket.emit('newRoom', data);
    } else {
        let password = $('.create-room-password').val();
        let data = {'name': $('.create-room-name').val(), 'users': 1, 'admin': username, 'id': 0, 'password': password};
        socket.emit('newPrivateRoom', data);
    }
})

socket.on('success', (data) => {
    $('#chat-display').html('');
})

socket.on('roomNameExists', (msg) => {
    alert(msg);
})

socket.on('getPrivateRooms', (data) => {

});

$('.delete-form').submit((event) => {
    event.preventDefault();
    let val = $('.delete-room-name').val();
    socket.emit('deleteRoom', val);
})

$('.kick-user').submit((event) => {
    alert('asd');
    event.preventDefault();
    let val = $('.kick-user-name').val();
    socket.emit('kickUser', val);
})