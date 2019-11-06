//Truelife TV API - POC / MVP
//Functionality: lets the site administrator set or reset the YouTube playlist being streamed on the client
//provides the current playlist ID and last update timestamp to the client when requested
const fs = require('fs');
const http = require('http');
//const https = require('https');
const express = require('express');
const cors = require('cors')
const app = express();
// Certificate
//const privateKey = fs.readFileSync('/etc/letsencrypt/live/samrahimi.com/privkey.pem', 'utf8');
//const certificate = fs.readFileSync('/etc/letsencrypt/live/samrahimi.com/cert.pem', 'utf8');
//const ca = fs.readFileSync('/etc/letsencrypt/live/samrahimi.com/chain.pem', 'utf8');
//const credentials = {
//        key: privateKey,
//        cert: certificate,
//        ca: ca
//};

const bodyParser = require('body-parser')

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(__dirname, { dotfiles: 'allow' } ));

//REST API routes
var channelController = require('./controllers/channelController.js')


app.route('/proxy/playlist/:playlistId')
    .get(channelController.youtubePlaylistProxy)
app.route('/channel')
    .get(channelController.getAll)

app.route('/channel/:channel')
    .get(channelController.getChannelState)
    .post(channelController.createOrUpdateChannel);


app.route('/channel/:channel/play')
    .post(channelController.setPlaylist);

app.route('/channel/:channel/restart')
   .get(channelController.restart)

app.route('/channel/:channel/resync')
    .get(channelController.resync)
// Starting both http & https servers
const httpServer = http.createServer(app);
//const httpsServer = https.createServer(credentials, app);
httpServer.listen(8080, () => {
        console.log('HTTP Server running on port 8080');
});

//fuck it, let nginx handle the SSL 
//httpsServer.listen(443, () => {
//        console.log('HTTPS Server running on port 443');
//});

console.log("Running")
