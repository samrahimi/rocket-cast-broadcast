//requires socket.io-client

/* example usage, by an embedded player that listens for realtime resync events
var dispatcher = new Dispatcher('socvid.player', 'hamsterdam', (dispatch => {
    switch (dispatch.type) {
        case "SYNC":
            location.reload()
    }
})) */

//should be same as base URL for socvid REST API
const socvidServerWsEndpoint="https://broadcast.svn.im:443"
const wsOptions = {secure: true, rejectUnauthorized: false}

class Dispatcher {
    constructor(moduleId, channelId, dispatchHandler) {
        this.moduleID = moduleId
        this.channelID= channelId
        //this.dispatchHandler= dispatchHandler

        this.socket = io.connect(socvidServerWsEndpoint, wsOptions)

        //handle all incoming broadcasts or those destined for current module & channel
        this.socket.on('dispatch', function(msg){
            if ((msg.targetModuleId == this.moduleID || msg.targetModuleId == '*') &&
            (msg.targetChannelId == this.channelID || msg.targetChannelId == '*')) {
                dispatchHandler(msg)
            }
        }.bind(this)); 
    }

    Dispatch(type, payload, targetChannelId, targetModuleId) {
        var msg = {type, payload, targetChannelId, targetModuleId}
        console.log(JSON.stringify(msg, null, 2))
        this.socket.emit("dispatch", msg)
    }
}