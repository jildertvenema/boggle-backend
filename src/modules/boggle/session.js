const Board = require('./board')

class Session {
    constructor (host, onEnding) {
        this.sessionID = Math.random().toString(36).substring(7)
        this.host = host
        this.player = null
        this.board = new Board(() => onEnding(this))
    }
}

module.exports = Session
