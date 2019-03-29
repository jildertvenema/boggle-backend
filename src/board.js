
const CheckWord = require('./check-word')

const MIN_LETTERS = 3
const GRID_SIZE = 5

class Board {
    constructor() {
        this.board = this.getRandomBoard()
        this.checkWord = CheckWord.getInstance()
    }

    
    getRandomBoard() {
        const result = []
        var possible = 'aaaabcdeeeefghiiiijklmnoooopqrstuuuuvwxyz'

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

    wordIsValid(word) {
        word = word.toLowerCase()
        console.log('Word :   ' + word)

        if (
            word.length >= MIN_LETTERS &&
            this.checkWord.check(word) &&
            this.findWord(this.board, word) 
        ) {
            console.log("WORD FOUND!")
            return true
        }
        else {
            console.log('INVALID')
            return false
        }

    } 
}

module.exports = Board
