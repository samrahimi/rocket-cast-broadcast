//Truelife TV API - POC / MVP
//Functionality: lets the site administrator set or reset the YouTube playlist being streamed on the client
//provides the current playlist ID and last update timestamp to the client when requested


//Server config
var express = require('express');
var cors = require('cors')

var app = express(),
port = process.env.PORT || 3000,
bodyParser = require('body-parser')

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//REST API routes
var channelController = require('./controllers/channelController.js')

app.route('/channel/:channel')
    .get(channelController.getStatus)
    .post(channelController.setPlaylist);

app.route('/channel/:channel/restart')
   .get(channelController.restart)


//Start the server
app.listen(port)
console.log("Running on port "+port)