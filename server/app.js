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


 app.route('/config/fixMissingAvatars')
    .get(channelController.fixMissingAvatars)

app.route('/channel/:channel/setChannelAvatar')
    .get(channelController.setAvatarForChannel)


//view history for one channel
app.route('/channel/:channel/viewers')
    .get(presenceController.getViewHistoryForChannel)

//channels with their actual current viewers
//render in "channel surfer" view
app.route('/channels/active')
    .get(presenceController.getActiveChannels)


//all users who have tuned in at least once, and their 
//most recent location
app.route('/users/active')
    .get(presenceController.getActiveUsers)



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
                //user_presence messages are sent by clients for processing on the server
                //these messages trigger updates of channel view history, user status, and active channels data
                case "user_presence":
                    var userHistoryForChannel = presenceController.updateUserPresence(msg.payload)

                    /* uncomment to blast out realtime updates to clients on the channel
                       it's a bad idea to do this before we fix the bug in the socket manager 
                    if (userHistoryForChannel != null) {
                        //broadcast the updated viewer list to clients watching that channel... it should be debounced
                        io.emit('dispatch', {     
                            type: 'channel_viewers',
                            targetModuleId: 'socvid.chat',
                            payload: userHistoryForChannel,
                            targetChannelId: msg.payload.channel.channel_name
                        })
                    } */

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

//update channel surfer data every 15 seconds
presenceController.startChannelSurferAggregationService(15000)

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
