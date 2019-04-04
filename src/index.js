"use strict";

const Player = require('./modules/boggle/player')
const GetAction = require('./modules/client-actions')

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'boggle-server';
// Port where we'll run the websocket server
// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

var clients = [];



const readline = require('readline');
const fs = require('fs');

// create instance of readline
// each instance is associated with single input stream
let rl = readline.createInterface({
    input: fs.createReadStream('src/Dutch.dic.txt')
});

const words = {}

// event is emitted after each line
rl.on('line', function(line) {
  const index = line.indexOf('/')
  const word = index > 0 ? line.substring(0, index).toLowerCase() : line.toLowerCase()

  const prop = words.hasOwnProperty(word.charAt(0))

  if (!prop) {
    words[word.charAt(0)] = []
  }

  words[word.charAt(0)].push(word)

});

// end
rl.on('close', function(line) {
    // console.log(words.find(word => word === 'pro'));
    fs.appendFile('woordenboek.json', JSON.stringify(words), function (err) {
      if (err) {
        // append failed
      } else {
        // done
        console.log(Object.keys(words).map(key => `${key}: ${words[key].length} words`))
      }
    })
    
  });



/**
 * HTTP server
 */
var server = http.createServer(function(request, response) {
  // Not important for us. We're writing WebSocket server,
  // not HTTP server
});

server.listen(process.env.PORT || 1337, function() {
  console.log((new Date()) + " Server is listening on port "
      + (process.env.PORT || 1337));
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

        // get action from modules/cient-actions
        const action = data.action && GetAction(data.action)
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

  // user disconnected
  connection.on('close', function(connection) {
    console.log((new Date()) + " Peer "
        + connection.remoteAddress + " disconnected.");
    // remove user from the list of connected clients
    clients.splice(index, 1);

    // delete session if player was host
    if (player.isHost) {
      GetAction('deleteSession')(connection, {}, player)
    }
  });
});