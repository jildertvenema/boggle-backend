class Player {
    constructor (connection) {
        this.points = 0
        this.isHost = false
        this.connection = connection
        this.session = null
    }
}

module.exports = Player
