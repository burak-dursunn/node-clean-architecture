const mongoose = require('mongoose');

let instance = null;
class Database {
    //! Singleton
    //? Node.js halihazırda ilk kez export edilen bir değeri Cache'e kaydeder. 
    //? Projenin başka dosyalarında aynı dosya tekrar "require" edilse bile Node, cache'deki değeri döndürür.
    //? Bir bakıma Singleton mimarisini çağırıştırır.
    constructor() {
        if (!instance) {
            this.mongoConnection = null;
            instance = this;
        }

        return instance;
    }

    async connect(options) {
        console.log("DB connecting...");
        let db = await mongoose.connect(options.CONNECTION_STRING);
        
        this.mongoConnection = db;
        console.log("DB connected!");
    }
}

module.exports = new Database();