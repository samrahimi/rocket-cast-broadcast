const db = require('../model/mongo')
const request = require('request');
const rawUserPresenceUpdates = []
module.exports = {
    updateUserPresence: async(latestUpdate) => {
        if (latestUpdate.channel.channel_type != "c") 
        {
            console.log("Skipping presence update for room type "+latestUpdate.channel.channel_type)
            return
        } 
        else {
            console.log(JSON.stringify(latestUpdate, null, 2))
            rawUserPresenceUpdates.push(latestUpdate)
        }

    },
    clearAll: (req, res) => {rawUserPresenceUpdates = []; res.end()},
    getUserPresenceData: (req, res) => {res.json(rawUserPresenceUpdates)}
}