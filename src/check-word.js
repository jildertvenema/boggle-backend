var checkWord = require('check-word')


var CheckWord = (function () {
    var instance
 
    function createInstance() {
        var object = checkWord('en')
        return object;
    }
 
    return {
        getInstance: function () {
            if (!instance) {
                instance = createInstance()
            }
            return instance
        }
    }
})()

module.exports = CheckWord
