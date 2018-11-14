const app = require('express')();
const express = require('express');
const http = require('http').Server(app);
const io = require('socket.io')(http);

let users = [];
let connections = [];
let publicRooms = [{'name': 'Global', 'users': 0, 'admin': 0, 'id': 0}];
let privateRooms = [];

// {'name': 'Global', 'users': 0, 'admin': 0, 'id': 0, 'password': ""}

app.use(express.static('public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});

io.sockets.on("connection", function(socket) {
    console.log("Socket id is: " + socket.id);
    connections.push(socket);
    console.log('Connected: %s sockets connected', connections.length);

    socket.on('newUser', function(data) {
        // console.log(data);
        socket.username = data.username;
        let data2 = {'name': socket.username, 'room': data.room, 'id': socket.id};
        users.push(data2);
        socket.join(data.room);
        socket.room = data.room;
        publicRooms[0].users++;
        socket.emit('currentRoom', msg={'message': `Current room: ${data.room}`});
        updateRooms();
        updateUsers();

        updateUsers2();
        updateRoomUsers();
    });
    
    socket.on('chatMessage', function(msg){
        io.to(socket.room).emit('chatMessage', msg);
    });

    socket.on('getUsers', () => {
        updateUsers2();
    })

    // all users tab
    function updateUsers2() {
        socket.emit('getUsers', users);
    }


    // this is only in newUser function
    function updateUsers() {
        io.sockets.emit('getUsers', users);
    }

    // all users in current room
    function updateRoomUsers() {
        let data = [];
        for (let i = 0; i < users.length; i++) {
            if (users[i].room == socket.room) {
                data.push(users[i].name);
            }
        }
        socket.emit('getRoomUsers2', data);
    }

    socket.on('getRoomUsers', () => {
        updateRoomUsers();
    });

    function updateRooms() {
        io.sockets.emit('getRooms', publicRooms);
    }

    function updatePrivateRooms() {
        io.sockets.emit('getPrivateRooms', privateRooms);
    }

    socket.on('disconnect', function(data) {
		users.splice(users.indexOf(socket.username), 1);
        connections.splice(connections.indexOf(socket), 1);
        socket.leave(socket.room);
        for (let i = 0; i < publicRooms.length; i++) {
            if (publicRooms[i].name == socket.room) {
                publicRooms[i].users = publicRooms[i].users - 1;
            }
        }
        updateUsers2();
        updateRoomUsers();
		console.log('Disconnected: %s sockets still connected', connections.length);
    });

    socket.on('newPrivateRoom', (data) => {
        // console.log(`Data: ${data.name} ${data.users} ${data.admin} ${data.id} ${data.password}`);
        for (let i = 0; i < privateRooms.length; i++) {
            if (privateRooms[i].name == data.name) {
                socket.emit('roomNameExists', msg="Room name taken!");
                return false;
            }
        }
        socket.leave(socket.room);
        for (let i = 0; i < publicRooms.length; i++) {
            if (publicRooms[i].name == socket.room) {
                publicRooms[i].users = publicRooms[i].users - 1;
            }
        }
        for (let i = 0; i < privateRooms.length; i++) {
            if (privateRooms[i].name == socket.room) {
                privateRooms[i].users = privateRooms[i].users - 1;
            }
        }
        socket.join(data.name);
        socket.room = data.name;
        for (let i = 0; i < users.length; i++) {
            if (users[i].name == socket.username) {
                users[i].room = data.name;
            }
        }
        // {'name': 'Global', 'users': 0, 'admin': 0, 'id': 0, 'password': ""}
        // let data2 = {'name': data.name, 'users': 1, 'admin': data.name, 'id': 0, 'password': data.password};
        socket.emit('currentRoom', msg={'message': `Current room: ${data.name}`});
        socket.emit('success', check="success");
        //data.id = privateRooms.length;
        privateRooms.push(data);
        console.log(privateRooms[0].name);
        updatePrivateRooms();
        updateUsers2();
        updateRoomUsers();
    });

    socket.on('newRoom', (data) => {
        for (let i = 0; i < publicRooms.length; i++) {
            if (publicRooms[i].name == data.name) {
                socket.emit('roomNameExists', msg="Room name taken!");
                return false;
            }
        }
        socket.leave(socket.room);
        for (let i = 0; i < publicRooms.length; i++) {
            if (publicRooms[i].name == socket.room) {
                publicRooms[i].users = publicRooms[i].users - 1;
            }
        }
        socket.join(data.name);
        socket.room = data.name;
        for (let i = 0; i < users.length; i++) {
            if (users[i].name == socket.username) {
                users[i].room = data.name;
            }
        }
        socket.emit('currentRoom', msg={'message': `Current room: ${data.name}`});
        socket.emit('success', check="success");
        data.id = publicRooms.length;
        publicRooms.push(data);
        // console.log("Room: " + publicRooms[1].id);
        updateRooms();
        updateUsers2();
        updateRoomUsers();
    })

    socket.on('joinPrivateRoom', (data) => {
        socket.leave(socket.room);
        for (let i = 0; i < publicRooms.length; i++) {
            if (publicRooms[i].name == socket.room) {
                publicRooms[i].users = publicRooms[i].users - 1;
            }
        }
        for (let i = 0; i < privateRooms.length; i++) {
            if (privateRooms[i].name == socket.room) {
                privateRooms[i].users = privateRooms[i].users - 1;
            }
            if (privateRooms[i].name == data) {
                privateRooms[i].users = privateRooms[i].users + 1;
            }
        }

        socket.join(data);
        socket.room = data;
        for (let i = 0; i < users.length; i++) {
            if (users[i].name == socket.username) {
                users[i].room = data;
            }
        }
        socket.emit('currentRoom', msg={'message': `Current room: ${data}`});
        socket.emit('success', check="success");
        updatePrivateRooms();
        updateUsers2();
        updateRoomUsers();
    })

    socket.on('joinPublicRoom', (data) => {
        socket.leave(socket.room);
        for (let i = 0; i < publicRooms.length; i++) {
            if (publicRooms[i].name == socket.room) {
                publicRooms[i].users = publicRooms[i].users - 1;
            }
            if (publicRooms[i].name == data) {
                publicRooms[i].users = publicRooms[i].users + 1;
            }
        }
        socket.join(data);
        socket.room = data;
        for (let i = 0; i < users.length; i++) {
            if (users[i].name == socket.username) {
                users[i].room = data;
            }
        }
        socket.emit('currentRoom', msg={'message': `Current room: ${data}`});
        socket.emit('success', check="success");
        //io.to(socket.room).emit('chatMessage', ree=`${socket.username} has joined the room!`);
        updateRooms();
        updateUsers2();
        updateRoomUsers();
    })

    socket.on('clickedPrivateRooms', () => {
        updatePrivateRooms();
        console.log("We are updating private rooms");
    })

    socket.on('clickedPublicRooms', () => {
        updateRooms();
        console.log("We are updating public rooms");
    })

    socket.on('deleteRoom', (roomName) => {
        let admin;
        for (let i = 0; i < publicRooms.length; i++) {
            if (publicRooms[i].name == roomName) {
                admin = publicRooms[i].admin;
                if (socket.username == admin) {
                    publicRooms.splice(i, 1);
                    // for loop to find all users in the room being deleted
                    // send them to global
                    // find them by their socket ids
                    updateRooms();
                    updateUsers2();
                    updateRoomUsers();
                }
            }
        }
        for (let i = 0; i < privateRooms.length; i++) {
            if (privateRooms[i].name == roomName) {
                admin = privateRooms[i].admin;
                if (socket.username == admin) {
                    privateRooms.splice(i, 1);
                    updatePrivateRooms();
                    updateUsers2();
                    updateRoomUsers();
                }
            }
        }
    })

    socket.on('kickUser', (userName) => {
        let admin;
        for (let i = 0; i < publicRooms.length; i++) {
            if (publicRooms[i].name == socket.room) {
                admin = publicRooms[i].admin;
                if (socket.username == admin) {
                    for (let j = 0; j < users.length; j++) {
                        if (userName == users[j].name) {
                            console.log("Inside kick");
                            let bye = io.sockets.connected[users[j].id]
                            bye.leave(socket.room);
                            bye.join('Global');
                            bye.room = 'Global';
                            bye.emit('currentRoom', msg={'message': `Current room: ${bye.room}`});
                            bye.emit('clear');
                            //io.to(bye.room).emit('chatMessage', ree=`${userName} has joined the room!`);
                            updateRooms();
                            updateUsers2();
                            updateRoomUsers();
                        }
                    } 
                }
            }
        }
        for (let i = 0; i < privateRooms.length; i++) {
            if (privateRooms[i].name == socket.room) {
                admin = privateRooms[i].admin;
                if (socket.username == admin) {
                    for (let j = 0; j < users.length; j++) {
                        if (userName == users[j].name) {
                            let bye = io.sockets.connected[users[j].id]
                            bye.leave(socket.room);
                            bye.join('Global');
                            updatePrivateRooms();
                            updateUsers2();
                            updateRoomUsers();
                        }
                    } 
                }
            }
        }
    })
})