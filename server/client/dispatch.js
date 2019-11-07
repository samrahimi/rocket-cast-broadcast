//requires socket.io-client

/* example usage, by an embedded player that listens for realtime resync events
var dispatcher = new Dispatcher('socvid.player', 'hamsterdam', (dispatch => {
    switch (dispatch.type) {
        case "SYNC":
            location.reload()
    }
})) */
class Dispatcher {
    constructor(moduleId, channelId, dispatchHandler) {
        this.moduleID = moduleId
        this.channelID= channelId
        //this.dispatchHandler= dispatchHandler

        this.socket = io()

        //handle all incoming broadcasts or those destined for current module & channel
        this.socket.on('dispatch', function(msg){
            if ((msg.targetModule == this.moduleName || msg.target_module == '*') &&
            (msg.targetChannel == this.channelID || msg.targetChannel == '*')) {
                dispatchHandler(msg)
            }
        }); 
    }

    Dispatch(type, payload, targetChannelId, targetModuleId) {
        var msg = {type, payload, targetChannelId, targetModuleId}
        console.log(JSON.stringify(msg, null, 2))
        this.socket.emit("dispatch", msg)
    }
}