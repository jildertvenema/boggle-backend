
const Session = require('../boggle/session')

const mongo = require('./database')
const db = mongo.getInstance()

// manage sessions
var sessions = []
var scores = []


const isCurrentTurn = (player, currentTurn) => player.isHost ? currentTurn === 'host' : currentTurn === 'player'

const sendState = (connection, session, playerType, board) => {
    const { sessionID } = session
    connection.sendUTF(
      JSON.stringify({ sessionID, readyToPlay: true, playTime: session.board.playTime, totalRounds: session.board.totalRounds, playerType, board})
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

  const notifyBoth = (session, data) => {
    const { player, host } = session
    console.log('sending both')
    if (player) { 
      console.log('sending player')
      player.connection.sendUTF(
        JSON.stringify(data)
      )
    }
    if (host) { 
      console.log('sending host')
      host.connection.sendUTF(
        JSON.stringify(data)
      )
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
    if (scores.length === 0) {
      db.read('boggle', 'scores', data => {
        scores = data
        connection.sendUTF(JSON.stringify({ scores }))
      })
    } else {
      connection.sendUTF(JSON.stringify({ scores }))
    }
  }

  const onEnding = session => {
    const { player, host } = session
    notifyBoth(session, { gameStarted: false, selectedLetters: [], endTime: null })
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

  const createSinglePlayerSession = (connection, options, player) => {
    player.isHost = true
    const newSession = new Session(player, onEnding)
    player.session = newSession

    newSession.board.currentTurn = 'host'
    newSession.board.singlePlayer = true

    sessions.push(newSession)

    sendState(connection, newSession, 'host', newSession.board)

  }

  const checkWord = (connection, options, player) => {
    const session = player.session
    let points = -1

    if (session) {
      points = session.board.wordIsValid(options.word)
      player.points += points


      if(!session.board.singlePlayer) {
        sendToOpponent(session, player, {  selectedLetters: [], pointsOpponent: player.points, board: session.board  })
      }

    }
    
    connection.sendUTF(
      JSON.stringify({ valid: points, points: player.points, board: session.board })
    )
  }

  const startGame = (connection, options, player) => {
    const session = player.session
    if (session) {
      session.board.startGame()
      notifyBoth(session, { gameStarted: true, board: session.board, selectedLetters: [] })
    }
  }

  const deleteSession = (connection, options, player) => {
      const session = player.session
      if (session) {
          sendToOpponent(session, player, { opponentDisconnected: true, sessionID: null })
          sessions = sessions.filter(s => s.sessionID !== session.sessionID)
      }
  }


  const getOpponent = (session, player) => {
    if (player.isHost) {
      return session.player
    } else {
      return session.host
    }
  }


  const sendToOpponent = (session, player, data) => {

    const opponent = getOpponent(session, player)

    if (opponent) {
      opponent.connection.sendUTF(
        JSON.stringify(data)
      )
    } else {
      console.log("NO OPPONENT")
    }
  }

  const selectedLetters = (connection, options, player) => {
    const session = player.session
      if (session) {
          if (isCurrentTurn(player, session.board.currentTurn)) {
            sendToOpponent(session, player, {  selectedLetters: options.positions, pointsOpponent: player.points })
          }
      }
  }

  const finishGame = (connection, options, player) => {
    const session = player.session
      if (session) {

        let newScore = null

        if (!session.board.singlePlayer) {

            newScore = {
                sessionID: session.sessionID,
                hostName: session.host.name,
                host: session.host.points,
                playerName: session.player.name,
                player: session.player.points
            }

            sendToOpponent(session, player, {
              gameFinshed: true,
              board: session.board,
              points: getOpponent(session, player).points,
              pointsOpponent: player.points
            })

            connection.sendUTF(
              JSON.stringify({ 
                gameFinshed: true,
                board: session.board,
                points: player.points,
                pointsOpponent: getOpponent(session, player).points
              })
            )
          } else {
            connection.sendUTF(
              JSON.stringify({ 
                gameFinshed: true,
                board: session.board,
                points: player.points
              })
            )
            newScore = {
              sessionID: session.sessionID,
              hostName: session.host.name,
              host: session.host.points
            }
          }

          scores.push(newScore)
          db.write('boggle', 'scores', newScore)
          // fs.writeFileSync('scores.json',  JSON.stringify({ scores }), { encoding:'utf8', flag:'w' })

      }
  }

  const setName = (connection, options, player) => {
    const session = player.session
    player.name = options.name

    if (session) {
      sendToOpponent(session, player, {  opponentName: player.name })
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
  'selectedLetters': selectedLetters,
  'finishGame': finishGame,
  'setName': setName,
  'createSinglePlayerSession': createSinglePlayerSession
}

