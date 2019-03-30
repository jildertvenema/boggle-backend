
const Session = require('../boggle/session')

// manage sessions
var sessions = []
var scores = []


const isCurrentTurn = (player, currentTurn) => player.isHost ? currentTurn === 'host' : currentTurn === 'player'

const sendState = (connection, session, playerType) => {
    const { sessionID, board} = session
    connection.sendUTF(
      JSON.stringify({ sessionID, board, playerType})
    )
  }

const notifySessionState = session => {
    const { player, host } = session
    if (player) { 
      sendState(player.connection, session, 'player')
    }
    if (host) { 
      sendState(host.connection, session, 'host')
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


  const getScores = (connection, options, player) => {
    connection.sendUTF(
        JSON.stringify({ scores })
      )
  }

  const onEnding = session => {
    const { player, host } = session

    scores.push({
        sessionID: session.sessionID,
        player1: session.host.points,
        player2: session.player.points
    })

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

  const deleteSession = (connection, options, player) => {
      const session = player.session
      if (session) {
            sessions = sessions.filter(s => s.sessionID !== session.sessionID)
      }
  }


  const sendToOpponent = (session, player, data) => {
    if (player.isHost) {
      session.player.connection.sendUTF(
        JSON.stringify(data)
      )
    } else {
      session.host.connection.sendUTF(
        JSON.stringify(data)
      )
    }
  }

  const selectedLetters = (connection, options, player) => {
    const session = player.session
      if (session) {
          if (isCurrentTurn(player, session.board.currentTurn)) {
            console.log(options.positions)
            sendToOpponent(session, player, {  selectedLetters: options.positions, pointsOpponent: player.points })
          }
      }
  }

module.exports = getAction = type => {
    return clientActions[type]
}

const clientActions = {
  'joinRoom': joinRoom,
  'createRoom': createRoom,
  'checkWord' : checkWord,
  'startGame': startGame,
  'deleteSession': deleteSession,
  'getScores': getScores,
  'selectedLetters': selectedLetters
}

