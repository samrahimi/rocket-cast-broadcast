const db = require('../model/mongo')
const request = require('request');
const youtubeDL = require('youtube-dl')
const wget = require('wget')

const altYouTubePlaylistUrl = 'https://www.youtube.com/list_ajax?style=json&action_get_list=1&list='
const youtubeVideoDetailsUrl = 'https://www.googleapis.com/youtube/v3/videos?part=contentDetails&key=AIzaSyDyqJKwMF_vhGqNUmDbbEkvQ55E9ZDhSnc&id='
const youtubePlaylistItemsUrl = 'https://www.googleapis.com/youtube/v3/videos?part=contentDetails&key=AIzaSyDyqJKwMF_vhGqNUmDbbEkvQ55E9ZDhSnc&id='

//Controls a channel - get / set the content being broadcast and other info about the stream (ie. start time)
const opts = {
    bufferLengthInSeconds: 3 //average time for clients to load next video in playlist
}


//adds an elapsedTime field to a channel object based on its startTime, and returns it
//not sure if we need to actually store this value in db  or not, hmm...
const updateElapsedTime= (channel) => {
    if (channel.startTime > 0) {
        channel.elapsedTime = Date.now() - channel.startTime
    } else {
        channel.elapsedTime = 0
    }
    return channel
}

const getChannel= (channelId, callback) => {
    db.getDb('socvid-broadcast', ref => {
        ref.collection('channels').findOne({id: channelId}, (err, channel) => {
            if (err != null) 
                callback(err)
            else
                callback(channel)
        })
    })
}

const upsertChannel=(channel, callback) => {
    db.getDb('socvid-broadcast', (ref => {
        ref.collection('channels').updateOne({id: channel.id}, {$set: channel}, {upsert: true}, (err, result) => {
            if (err != null) 
                callback(err)
            else
                callback(result) 
        })
    }))
}

const getAllChannels = (callback) => {
    db.getDb('socvid-broadcast', ref => {
        ref.collection('channels').find({}).toArray((err, channels) => {
            if (err != null) 
                callback(err)
            else
                callback(channels)
        })
    })
}

const getPlaylistDetails = (youtubePlaylistId, callback) => {
    console.log('requesting '+altYouTubePlaylistUrl+youtubePlaylistId)
    /*
    wget(
        {
            url: 'https://www.youtube.com/list_ajax?style=json&action_get_list=1&list='+youtubePlaylistId, 
            dest: '../tmp/'
        },
        (e, r, body) => {
            callback(body)
        })*/
        
        request(altYouTubePlaylistUrl+youtubePlaylistId, function (error, response, body) {
            //console.log('error:', error); // Print the error if one occurred
            //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            //console.log('body:', body); // Print the JSON received from the undocumented YouTube Data API endpoint.
                                        // The documented one is annoying and doesn't give you durations...
                                        // while this one has everything and doesn't even need a key.
            callback(JSON.parse(body))
        });
}
module.exports = {
    youtubePlaylistProxy: (req, res) => {
        getPlaylistDetails(req.params.playlistId, (results) => {
            res.json(results)
        })
    }, 
    //todo: access control
    createOrUpdateChannel: (req, res) => {
        var channel = req.body
        channel.id = req.params.channel

        upsertChannel(channel, (result) => {res.json(result)})
    },
    getAll: (req, res) => {
        getAllChannels((channels) => {
            res.json(channels)
        })
    },
    //gets channel data, and calculates the elapsed time if playing
    getChannelState: (req, res) => {
        getChannel(req.params.channel, (channel) => {

            //if the channel doesn't exist, create it
            if (channel == null) {
              channel = {
                id: req.params.channel,
                startTime: 0,
                playlistId: '',
                channelName: '',
                channelOwner: '',
                channelDescription: ''
              }

              //insert into the db on a separate thread 
              //log the result on the server
              upsertChannel(channel, (result) => {
                  console.log("create-on-get new channel")
                  console.log(result)
              })
            }  
   
            //send back the channel with elapsed time, if playing
            res.json(updateElapsedTime(channel))
           
        })
    },
 
    //sets the YouTube playlist and starts playing from the beginning
    //setting an empty playlist will cause startTime and elapsedTime to reset to 0
    //so that the client knows not to play anything
    setPlaylist: (req, res) => {
        getChannel(req.params.channel, (channel) => {
            channel.playlistId = req.body.playlistId || ''
            channel.startTime= channel.playlistId.length > 0 ? Date.now() : 0
            channel.elapsedTime=0
            if (channel.playlistId.length > 0) {
                console.log("syncing playlist from YouTube...")
                getPlaylistDetails(channel.playlistId, (playlistDetails) => {
                    channel.playlistDetails = playlistDetails
                    upsertChannel(channel, (result) => {
                        //console.log("playlist details added to channel and saved")
                        //console.log(result)
                        res.json(channel)
                    })
                })
            } else {
                delete channel.playlistDetails;
                upsertChannel(channel, (result) => {
                    console.log("playlist removed")
                    //console.log(result)
                    res.json(channel)
                })
            }
        })
    },
   resync: (req, res) => {
        getChannel(req.params.channel, (channel) => {
            if (channel.playlistId.length > 0) {
                getPlaylistDetails(channel.id, (playlistDetails) => {
                        channel.playlistDetails = playlistDetails
                        channel.startTime = Date.now()
                        channel.elapsedTime = 0
                        upsertChannel(channel, (result) => {
                            console.log("playlist updated for channel, playback will restart")
                            console.log(result)
                            res.json(channel)
                    })
                })
            } else {
                res.json(channel)
            }
        })
   },
   //reset the start time. this causes the client to start playing from the beginning
   restart: (req, res) => {
    getChannel(req.params.channel, (channel) => {
        channel.startTime= channel.playlistId.length > 0 ? Date.now() : 0
        channel.elapsedTime = 0
        upsertChannel(channel, (result) => {
            console.log("restart channel")
            console.log(result)
        })
        res.json(channel)
    });
   },

   //returns the latest info about the channel, including yt playlist id & elapsed time since playback was started
   //this is enough info for the client to calculate the index and offset to sync the viewer with others
   //(note that the client must get the playlist details, including lengths of each video, directly from youtube)
   //
   //this is a get-or-create... if channel is nonexistent, we create it and don't update the elapsed time

   /*
   getStatus: (req, res) => {
       if (!channels[req.params.channel]) {
        channels[req.params.channel] = {
            startTime: 0,
            elapsedTime: 0,
            playlistId: '',
            channelName: '',
            channelOwner: '',
            channelDescription: ''
        }
        res.json(channels[req.params.channel])   
       } else {
        res.json(updateElapsedTime(req.params.channel))
       }
   }*/
}