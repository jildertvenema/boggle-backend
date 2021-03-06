
const MongoClient = require('mongodb').MongoClient;

class MongoDatabaseClient {
  constructor(uri) {
    const options = {
      poolSize: 20,
      socketTimeoutMS: 480000,
      keepAlive: 300000,
      ssl: true,
      sslValidate: false
    }
    this.client = new MongoClient(uri, options)
  }

  read(db, collectionName, onFulfilled) {
    this.client.connect(err => {
      if (err){
        console.log(err)
        return
      }
      const collection = this.client.db(db).collection(collectionName)
      
      collection.find().toArray().then(data => onFulfilled(data)).catch(console.log)
      this.client.close();
    });
  }

  write(db, collectionName, item) {
    this.client.connect((err, clientdb) => {
      if (err){
        console.log(err)
        return
      }
      const collection = clientdb.db(db).collection(collectionName)
      collection.insertOne(item, err => {
        if (err){
          console.log(err)
          return
        }
        clientdb.close();
      })
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
