const SV_MAX_VIEW_HISTORY = 100 //save the 100 most recent viewers for each channel
const SV_IDLE_CUTOFF_MS = 3600 * 1000  //show a user in channel surfer if their last known location was the channel, 
                                       //and less than 1h has elapsed

const db = require('../model/mongo')
const request = require('request');

const rawUserPresenceUpdates = []

const channelViewers = {}
const activeUsers = {}
const channelSurferData = []

const updateActiveChannels= (presenceUpdate) => {
   const {channel, user, timestamp} = presenceUpdate
    
    var channelId = channel.channel_name
    var userId = user.username

    //mark the timestamp on channel and user
    channel.last_activity = timestamp
    user.last_activity = timestamp

    //map the user to their latest channel
    activeUsers[userId] = channel

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

let aggregationThread = 0

module.exports = {
    startChannelSurferAggregationThread: (interval) => {

    },
    updateUserPresence: async(latestUpdate) => {
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

    //TODO: channel surfer
    getActiveChannels: (req, res) => {res.json({})},

    //user-channel map
    getActiveUsers: (req, res) => {res.json(activeUsers)},

}