"use strict";

const Session = require('./session')

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'boggle-server';
// Port where we'll run the websocket server
var webSocketsServerPort = 3200;
// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

var clients = [];

var sessions = [new Session()];

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

  var index = clients.push(connection) - 1;

  console.log((new Date()) + ' Connection accepted.');

  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      try {
        const data = JSON.parse(message.utf8Data)
        const action = data.action && clientActions[data.action]
        if (action) {
          action(connection, data.options)
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


  const joinRoom = (connection, options) => {

  }

  const createRoom = (connection, options) => {
    connection.sendUTF(
      JSON.stringify({ board: sessions[0].board.board })
    )
  }

  const checkWord = (connection, options) => {
    connection.sendUTF(
      JSON.stringify({ valid: sessions[0].board.wordIsValid(options.word)})
    )
  }


  const clientActions = {
    'joinRoom': joinRoom,
    'createRoom': createRoom,
    'checkWord' : checkWord
  }

  // user disconnected
  connection.on('close', function(connection) {
    console.log((new Date()) + " Peer "
        + connection.remoteAddress + " disconnected.");
    // remove user from the list of connected clients
    clients.splice(index, 1);
  });
});