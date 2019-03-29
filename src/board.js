
const CheckWord = require('./check-word')

const MIN_LETTERS = 3
const GRID_SIZE = 5

const PLAY_TIME = 10

class Board {
    constructor(onEnding) {
        this.board = this.getRandomBoard()
        this.checkWord = CheckWord.getInstance()
        this.startedTime = null
        this.guessedWords = []
        this.onEnding = onEnding
    }


    startGame () {
        this.startedTime = Date()
        setTimeout(this.onEnding, PLAY_TIME * 1000)
    }
    
    getRandomBoard() {
        const result = []
        var possible = 'aaaabbcddeeeeffgghhiiijjkkllmmnnooppqrsttuuuuvwxyz'

        for (let x = 0; x < GRID_SIZE; x++) {
            result.push([])
            for (let y = 0 ; y < GRID_SIZE; y++) {
                result[x][y] = possible.charAt(Math.floor(Math.random() * possible.length))
            }
        }    
        return result
    }

    findWordsUtil(board, visited, i, j, str, word) { 
        // Mark current cell as visited and append current character 
        // to str 
        visited[i][j] = true; 
        str = str + board[i][j]; 

        if (str === word) {
            return true
        }

        if (str.length > word.length || !word.startsWith(str)){
            str = str.slice(0, str.length -1); 
            visited[i][j] = false; 
            return
        }

        // Traverse 8 adjacent cells of boggle[i][j] 
        for (let row=i-1; row<=i+1 && row < GRID_SIZE; row++) 
        for (let col=j-1; col<=j+1 && col < GRID_SIZE; col++) 
        if (row>=0 && col>=0 && !visited[row][col]){
            if (this.findWordsUtil(board,visited, row, col, str, word)){
                return true
            }
        }

        // Erase current character from string and mark visited 
        // of current cell as false 
        str = str.slice(0, str.length -1); 
        visited[i][j] = false; 
    } 

    findWord (board, word) { 
        let str = '';
        const visited = []
        
        for (let i = 0 ; i < GRID_SIZE ; i++) {
            visited.push([])
        }
    
        for (let i=0; i<GRID_SIZE; i++) {
            for (let j=0; j<GRID_SIZE; j++) {
                if (this.findWordsUtil(board, visited, i, j, str, word)) {
                    return true
                }
            }
        }

        console.log('Not found in board')
    }

    getPoints(word) {
        switch(word.length) {
            case 3:
            case 4:
                return 1;
            case 5:
                return 2
            case 6:
                return 3
            case 7:
                return 5
            default:
                return 11
        }
    }

    wordIsValid(word) {
        word = word.toLowerCase()
        console.log('Word :   ' + word)

        if (this.guessedWords.includes(word)) {
            return 0
        }
        this.guessedWords.push(word)

        if (
            word.length >= MIN_LETTERS &&
            this.checkWord.check(word) &&
            this.findWord(this.board, word) 
        ) {
            console.log("WORD FOUND!")
            return this.getPoints(word)
        }
        else {
            console.log('INVALID')
            return 0
        }
    } 
}

module.exports = Board
