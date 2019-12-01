//Truelife TV API - POC / MVP
//Functionality: lets the site administrator set or reset the YouTube playlist being streamed on the client
//provides the current playlist ID and last update timestamp to the client when requested
const fs = require('fs');
const http = require('http');
//const https = require('https');
const express = require('express');
const cors = require('cors')
const app = express();

const bodyParser = require('body-parser')

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(__dirname, { dotfiles: 'allow' } ));

//DISPATCHER SOCKET API
//Clients should include /client/dispatcher.js



//REST API routes and socket data handlers
var channelController = require('./controllers/channelController.js')
var presenceController = require('./controllers/presenceController.js')

app.route('/proxy/playlist/:playlistId')
    .get(channelController.youtubePlaylistProxy)

    app.route('/config/fixMissingAvatars')
    .get(channelController.fixMissingAvatars)

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

app.route('/channel/:channel/setChannelAvatar')
    .get(channelController.setAvatarForChannel)


app.route('/presence')
    .get(presenceController.getUserPresenceData)

app.route('/presence/clear')
    .get(presenceController.clearAll)


// This app is designed to run behind a load balancer / reverse proxy like nginx
// and does not handle HTTPS itself... we run HTTP and WS on port 8080 
// you can run in HTTP but this limits player embedding
const httpServer = http.createServer(app);

//SOCKET DISPATCH API
var io = require('socket.io')(httpServer);
io.on('connection', function(socket){
    console.log('WS: Client connected');
    socket.on('dispatch', function(msg){
        //Messages with a targetChannelId should be routed to clients tuned in on that channel
        //If targetChannelId is not specified, that means this server is the final destination
        //and we pass the data on the appropriate controller 
        if(msg.targetChannelId == null) {
            switch (msg.type) {
                //Clients that want to use "now watching" or "channel surfer" modules 
                //must connect to the socket and emit messages of type user_presence on a 
                //fixed interval, whenever a channel page is open in the browser (e.g. someone is watching) 
                //
                //Because player and broadcast studio will work with any system that embeds them, 
                //we don't know or care about how a particular client handles users and channels...
                //therefore clients must provide enough data in the user presence updates to 
                //render text and profile pics with fully qualified links to said channels and users 
                //See room.js in rocket-cast client for details of this format.
                case "user_presence":
                    //this kicks off the regeneration of the channel's recent viewers
                    //updates the user's location for the directory (so you can see 
                    //that the hot girl is watching taylor-swift-tv and join her in the room)
                    //and rebuilds the channel surfer for the site
                    //channel surfer is active channels, sorted by viewer count
                    //with up to 5 current viewers attached for previewing purposes
                    presenceController.updateUserPresence(msg.payload)
                    break;
                default:
                    console.log("Warning - no handler defined for message type "+msg.type)
                    console.log(JSON.stringify(msg))
                    break;
            }
            return false 
        }

        console.log("received message, dispatching")
        console.log(JSON.stringify(msg))
        io.emit('dispatch', msg);
    });
});
    
httpServer.listen(8080, () => {
        console.log('HTTP Server  on port 8080');
});

//I recommended putting this behindrunning a reverse proxy or load balancer like nginx...
//and letting that system deal with HTTPS. It's faster and more secure. But if you 
//want to do it here, just use the code below as a guide
// Certificate
//const privateKey = fs.readFileSync('/etc/letsencrypt/live/samrahimi.com/privkey.pem', 'utf8');
//const certificate = fs.readFileSync('/etc/letsencrypt/live/samrahimi.com/cert.pem', 'utf8');
//const ca = fs.readFileSync('/etc/letsencrypt/live/samrahimi.com/chain.pem', 'utf8');
//const credentials = {
//        key: privateKey,
//        cert: certificate,
//        ca: ca
//};
//const httpsServer = https.createServer(credentials, app);
//httpsServer.listen(443, () => {
//        console.log('HTTPS Server running on port 443');
//});
