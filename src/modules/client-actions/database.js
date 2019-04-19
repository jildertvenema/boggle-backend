
const MongoClient = require('mongodb').MongoClient;

class MongoDatabaseClient {
  constructor(uri) {
    this.client = new MongoClient(uri, { useNewUrlParser: true })
  }

  read(db, collectionName, onFulfilled) {
    this.client.connect(err => {
      if (err){
        console.log(err)
        return
      }
      const collection = this.client.db(db).collection(collectionName)
      
      collection.find().toArray().then(data => onFulfilled(data))
      this.client.close();
    });
  }

  write(db, collectionName, item) {
    this.client.connect(err => {
      if (err){
        console.log(err)
        return
      }
      const collection = this.client.db(db).collection(collectionName)
      collection.insertOne(item, err => {
        if (err){
          console.log(err)
          return
        }
      })
      this.client.close();
    });
  }
}


var DataBaseSingleton = (function () {
  var instance

  function createInstance() {
      var object = new MongoDatabaseClient(process.env.MONGO_DB)
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

module.exports = DataBaseSingleton
