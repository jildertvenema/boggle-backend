"use strict";
// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'boggle-server';
// Port where we'll run the websocket server
var webSocketsServerPort = 3200;
// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

var clients = [];

var rooms = [
  {
  roomName: 'New room',
  clients: []
},
  {
  roomName: 'second room',
  clients: []
}
];

/**
 * HTTP server
 */
var server = http.createServer(function(request, response) {
  // Not important for us. We're writing WebSocket server,
  // not HTTP server
});

server.listen(webSocketsServerPort, function() {
  console.log((new Date()) + " Server is listening on port "
      + webSocketsServerPort);
});

var wsServer = new webSocketServer({
  httpServer: server
});

wsServer.on('request', function(request) {
  console.log((new Date()) + ' Connection from origin '
      + request.origin + '.');

  var connection = request.accept(null, request.origin);

  var index = clients.push({ connection, room: null }) - 1;

  console.log((new Date()) + ' Connection accepted.');
  // send back chat history

  connection.sendUTF(
    JSON.stringify({ rooms: rooms.map(room => ({ roomName: room.roomName, count: room.clients.length })) })
  )


  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      try {
        const data = JSON.parse(message.utf8Data)
        const action = data.action && clientActions[data.action]
        if (action) {
          action(clients.find(client => client.connection === connection) , data.options)
        } else {
          console.log(connection.remoteAddress)
          console.log(data.options)
          console.log('Action not found')
        }
      } catch (e) {
        console.log(e)
        console.log(`${connection.remoteAddress}`)
        console.log(message.utf8Data)
      }
    }
  });


  const joinRoom = (client, options) => {
    if (!options.roomName) {
      return
    }
    const roomExists = rooms.find(room => room.roomName === options.roomName)
    if (roomExists) {
      roomExists.clients.push(client)
      roomExists.clients.forEach(client => {
        client.connection.sendUTF(
          JSON.stringify({ room: { roomName: roomExists.roomName, count: roomExists.clients.length }})
        )
      })
    client.room = roomExists
    } else {
      const newRoom = {
        roomName: options.roomName,
        clients: [client]
      }
      rooms.push(newRoom)
      client.room = newRoom
    }
    console.log(rooms.length)
    console.log(rooms)
  }


  const clientActions = {
    'joinRoom': joinRoom
  }

  // user disconnected
  connection.on('close', function(connection) {
    console.log((new Date()) + " Peer "
        + connection.remoteAddress + " disconnected.");
    // remove user from the list of connected clients
    clients.splice(index, 1);
    const client = clients.find(client => client.connection === connection)
    console.log(client.room.clients)
    if (client.room) {
      client.room.clients = client.room.clients.filter(client => client.connection !== connection)
    }
  });
});