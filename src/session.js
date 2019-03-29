const Board = require('./board')

class Session {
    constructor (host) {
        this.sessionID = Math.random().toString(36).substring(7)
        this.host = host
        this.player = null
        this.board = new Board()
    }
}

module.exports = Session
