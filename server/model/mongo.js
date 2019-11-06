// This runs against the mongodb instance on socvid.net... to connect, run on the same box for now

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const url = 'mongodb://localhost:27017';

// Create a new MongoClient
const client = new MongoClient(url);

// Use connect method to connect to the Server
module.exports = {
    getDb: (name, callback) => {
        client.connect(function(err) {
        assert.equal(null, err);
        console.log("Connected successfully to server");

        const db = client.db(name);
        callback(db); //pass on a live ref to the database
        });
    }
}
