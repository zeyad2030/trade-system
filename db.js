const { MongoClient } = require("mongodb");

const uri = "mongodb://myAdmin:password@192.168.1.14:27017/myDatabase?authSource=admin";

const client = new MongoClient(uri);

let db;

async function connectDB() {
    await client.connect();

    db = client.db("database");

    console.log("MongoDB Connected");
}

function getDB() {
    return db;
}

module.exports = {
    connectDB,
    getDB,
    db: () => db
};
