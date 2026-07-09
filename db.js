const { MongoClient } = require("mongodb");

const uri = "mongodb://admin:jJeqj3GKx77LtiUs0W7HDwDvnthZtyzW@51.68.107.75:19094/?authSource=admin";

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
