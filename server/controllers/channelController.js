//Controls a channel - get / set the content being broadcast and other info about the stream (ie. start time)
const opts = {
    bufferLengthInSeconds: 1 //average time for clients to load next video in playlist
}

//for now there is only 1 channel
//but we are supporting multiple channels from the start because it's easy to do
//when multiple channels actually are introduced (and created by users) we will need a database
const channels = {
    "TrueLifeTV": 
    {
        startTime: 0,
        elapsedTime: 0,
        playlistId: '',
        channelName: 'TrueLife TV - Find Your Purpose',
        channelOwner: 'Alex Adams',
        channelDescription: ''
    }
}
const updateElapsedTime= (channelId) => {
    var channel = channels[channelId]
    if (channel.startTime > 0) {
        channel.elapsedTime = Date.now() - channels[channelId].startTime
    } else {
        channel.elapsedTime = 0
    }
    return channel
}
module.exports = {
    //global create or update channel data directly
    //not secure
    createOrUpdateChannel: (req, res) => {
        channels[req.body.channelName] = req.body.channelData
    },
    //sets the YouTube playlist and starts playing from the beginning
    //setting an empty playlist will cause startTime and elapsedTime to reset to 0
    //so that the client knows not to play anything
    setPlaylist: (req, res) => {
        var channel = channels[req.params.channel]
        channel.playlistId = req.body.playlistId || ''
        channel.startTime= channel.playlistId.length > 0 ? Date.now() : 0
        channel.elapsedTime=0
        res.json(channel)
    },

   //reset the start time. this causes the client to start playing from the beginning
   restart: (req, res) => {
    var channel = channels[req.params.channel]
    channel.startTime= channel.playlistId.length > 0 ? Date.now() : 0
    channel.elapsedTime = 0
    res.json(channel)
   },

   //returns the latest info about the channel, including yt playlist id & elapsed time since playback was started
   //this is enough info for the client to calculate the index and offset to sync the viewer with others
   //(note that the client must get the playlist details, including lengths of each video, directly from youtube)
   getStatus: (req, res) => {
       res.json(updateElapsedTime(req.params.channel))
   }
}