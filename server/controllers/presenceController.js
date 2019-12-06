const SV_MAX_VIEW_HISTORY = 100 //save the 100 most recent viewers for each channel
const SV_IDLE_TIMEOUT_MS = 3600 * 1000  //show a user in channel surfer if their last known location was the channel, 
                                       //and less than 1h has elapsed

const db = require('../model/mongo')
const request = require('request');

const rawUserPresenceUpdates = []

const channelViewers = {}
const activeUsers = {}
let channelSurferData = []

const updateActiveChannels= (presenceUpdate) => {
   const {channel, user, timestamp} = presenceUpdate
    
    var channelId = channel.channel_name
    var userId = user.username

    //mark the timestamp on channel and user
    channel.last_activity = timestamp
    user.last_activity = timestamp

    //map the user to their latest channel
    activeUsers[userId] = {
        channel: channel,
        user: user
    }

    //update the history of viewers for the channel that is involved
    if (!channelViewers[channelId])
        channelViewers[channelId] = []  //if there are no viewers, create the empty list

    //if the user is already in the viewer history for a channel, remove and readd them
    //otherwise just add them. the query below handles either case
    var viewers = channelViewers[channelId].filter(u => u.username != userId)
    viewers.push(user)

    //attach the updated viewer history to the channel
    channelViewers[channelId] = viewers

    //sort the updated view history, and truncate if over the max length
    sortAndTrimViewHistory(channelId)

    //now we have a sorted, trimmed list of unique viewers for that channel
    return channelViewers[channelId]
}

//better we do this on insert: 
//sort the view history most to least recent...
//and then truncate to length SV_MAX_VIEW_HISTORY 
const sortAndTrimViewHistory = (channelId) => {
    channelViewers[channelId].sort((a,b) => b > a)
    if (channelViewers[channelId].length > SV_MAX_VIEW_HISTORY)
        channelViewers[channelId] = channelViewers[channelId].slice(0, SV_MAX_VIEW_HISTORY)
}

//Given: a channel, and its recent viewers (in any order)
//Return: only the users who are ACTUALLY WATCHING THIS CHANNEL RIGHT NOW

//Note: max age is SV_IDLE_TINEOUT_MS

//Note: if a user has multiple channels open, on one or more devices, 
//they will randomly show up as watching ONE of those channels, and it will 
//be different each time the filtering runs. The crazy thing about this
//is that it ends up as an Arayi graph when you've got lots of active users 
//and lots of channels. The path you, my dear user, take through the graph alters the reality 
//you're a part of, just like Schroedinger's Cat. The last time I ran this algorithm,
//people found friends, lovers, business partners, and formed powerful real life alliances
//through the app's discovery engine.
//
//The algorithm acts as a giant lever, because it facilitates new experiences, encounters
//and opportuniteis... So I prefer to think of our users as quantum Orangutans,
//gamboling amidst the strands of existence and joyfully exploring different universes.
const filterActiveUsers = (channelName, channelRecentUsers) => {
    return channelRecentUsers.filter(user => {
        return (
            activeUsers[user.username] 
            && activeUsers[user.username].channel.channel_name == channelName
            && Date.now() - activeUsers[user.username].user.last_activity <= SV_IDLE_TIMEOUT_MS)
    })
}


let aggregationThread = 0

module.exports = {

    updateChannelSurfer: () => 
    {
        console.log("*** WARNING: Regenerate active viewer graph on main I/O Thread, should be asynchronous")

        //go through the channel-viewers map, and filter the viewers 
        //for each channel against the user's last known channel (in activeUsers)
        //this way each user is shown in their current or last known channel only
        let activeChannelArray = [] 
        Object.keys(channelViewers).forEach(function(key, index) {
            //put the active channels into an array, after filtering
            //their viewers for channel surfer purposes
            activeChannelArray.push({
                channel_name: key, 
                //recentViewers: this[key]
                currentViewers: filterActiveUsers(key, this[key]).slice(0,12)
            });
          }, channelViewers);
    
          activeChannelArray.sort((a,b) => a.currentViewers.length > b.currentViewers.length)
          activeChannelArray.reverse()
          
          console.log(JSON.stringify(activeChannelArray, null, 2))
    
          //the data source for the channel surfer UI... active channels
          //with their most current viewers
          channelSurferData= activeChannelArray
          return channelSurferData
    
    },
    //The above, polled... I'm duplicating code because we might want these to differ
    startChannelSurferAggregationService: (interval) => {
        clearInterval(aggregationThread)
        aggregationThread = setInterval(() => {
            console.log("*** Regenerate active viewer graph, thread ID "+aggregationThread)
            //go through the channel-viewers map, and filter the viewers 
            //for each channel against the user's last known channel (in activeUsers)
            //this way each user is shown in their current or last known channel only
            let activeChannelArray = [] 
            Object.keys(channelViewers).forEach(function(key, index) {
                //put the active channels into an array, after filtering
                //their viewers for channel surfer purposes
                activeChannelArray.push({
                    channel_name: key, 
                    //recentViewers: this[key]
                    currentViewers: filterActiveUsers(key, this[key]).slice(0,12)
                });
              }, channelViewers);

              activeChannelArray.sort((a,b) => a.currentViewers.length > b.currentViewers.length)
              activeChannelArray.reverse()
              
              console.log(JSON.stringify(activeChannelArray, null, 2))

              //the data source for the channel surfer UI... active channels
              //with their most current viewers
              channelSurferData= activeChannelArray
        }, interval)
    },
    updateUserPresence: (latestUpdate) => {
        if (latestUpdate.channel.channel_type != "c") 
        {
            console.log("Skipping presence update for room type "+latestUpdate.channel.channel_type)
            return null
        } 

        if (latestUpdate.user.anonymous == true) {
            console.log("Skipping presence update for anonymous user, anyone wanna implement?")
            return null
        }
        else {
            console.log(JSON.stringify(latestUpdate, null, 2))
            // for later rawUserPresenceUpdates.push(latestUpdate)

            return updateActiveChannels(latestUpdate)
        }

    },
    clearAll: (req, res) => {
        rawUserPresenceUpdates = []; 
        channelViewers = {}
        channelSurferData = []
        res.end()
    },
    getViewHistoryForChannel: (req, res) => {
        var channelId = req.params.channel
        if (!channelViewers[channelId])
            channelViewers[channelId] = []
        res.json(channelViewers[channelId])
    },
    /*
    getAllChannels: (req, res) => {
        var channelId = req.params.channel
        if (!channelViewers[channelId])
            channelViewers[channelId] = []
        res.json(channelViewers[channelId])
    }, */

    //view history for all channels
    getUserPresenceData: (req, res) => {res.json(channelViewers)},

    //channel surfer
    getActiveChannels: (req, res) => {res.json({channelSurferData})},

    //user-channel map... useful for site wide "who's online"
    getActiveUsers: (req, res) => {res.json(activeUsers)},

}