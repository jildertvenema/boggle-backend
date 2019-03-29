"use strict";

const Session = require('./session')
const Player = require('./player')

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'boggle-server';
// Port where we'll run the websocket server
var webSocketsServerPort = 3200;
// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

var clients = [];

var sessions = [];

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

  const player = new Player(connection)

  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      try {
        const data = JSON.parse(message.utf8Data)
        const action = data.action && clientActions[data.action]
        if (action) {
          action(connection, data.options, player)
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


  const sendState = (connection, session) => {
    const { sessionID, board} = session
    connection.sendUTF(
      JSON.stringify({ sessionID, board})
    )
  }

  const notifySessionState = session => {
    const { player, host } = session
    if (player) { 
      sendState(player.connection, session)
    }
    if (host) { 
      sendState(host.connection, session)
    }
  }


  const joinRoom = (connection, options, player) => {
    const session = sessions.find(session => session.sessionID == options.sessionID)
    if (session && session.player == null) {
      
      session.player = player
      player.session = session

      notifySessionState(session)

    } else {
      connection.sendUTF(
        JSON.stringify({ error: 'Not found' })
      )
    }
  }

  const onEnding = session => {
    const { player, host } = session
    if (player) { 
      player.connection.sendUTF(
        JSON.stringify({ error: 'The end' })
      )
    }
    if (host) { 
      host.connection.sendUTF(
        JSON.stringify({ error: 'The end' })
      )
    }
  }

  const createRoom = (connection, options, player) => {
    player.isHost = true
    const newSession = new Session(player, onEnding)
    player.session = newSession

    sessions.push(newSession)

    connection.sendUTF(
      JSON.stringify({ sessionID: newSession.sessionID })
    )
  }

  const checkWord = (connection, options, player) => {
    const session = player.session
    let points = -1

    if (session) {
      points = session.board.wordIsValid(options.word)
      player.points += points
    }
    
    connection.sendUTF(
      JSON.stringify({ valid: points, points: player.points})
    )
  }

  const startGame = (connection, options, player) => {
    const session = player.session
    if (session) {
      session.board.startGame()
      notifySessionState(session)
    }
  }


  const clientActions = {
    'joinRoom': joinRoom,
    'createRoom': createRoom,
    'checkWord' : checkWord,
    'startGame': startGame
  }

  // user disconnected
  connection.on('close', function(connection) {
    console.log((new Date()) + " Peer "
        + connection.remoteAddress + " disconnected.");
    // remove user from the list of connected clients
    clients.splice(index, 1);
  });
});