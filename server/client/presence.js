//The user presence updater. 
//This file be included in the <head> after dispatch.js
const   SV_MODULE_ID = "socvid.chat"
const   SV_PRESENCE_UPDATE_INTERVAL = 30000 //how often do we tell the server where we're at. perhaps this can be reactive...

let   SV_PRESENCE = null    //handle to the global instance of UserPresenceDaemon

class UserPresenceDaemon {
    constructor(moduleName) {
        this.dispatcher = new Dispatcher(
            moduleName,
            '*',
            (message) => {
                console.log("*** SocVid WS Dispatch received in Chat Client ***")
                console.log(JSON.stringify(message))

                document.dispatchEvent(new CustomEvent("SVDispatchReceived", {
                    bubbles: true,
                    detail: message
                }))
                /*
                console.log("*** Raising body.SVDispatchReceived event ***")
                document.dispatchEvent(new CustomEvent("SVDispatchReceived", {
                    bubbles: true,
                    detail: message
                })); */
        
            }
        )
        this.user = null
        this.channel = null
        this.updatePresenceThreadId = 0
    }

    channelIsOpen() {
        //in case the user's navigated away to a non-channel page
        return (location.href.toLowerCase().indexOf('/channel') >= 0)
    }

    setUser(user) {
        this.user = user
    }

    setChannel(channel) {
        this.channel = channel
        this.dispatcher.channelID = channel.channel_name;
    }

    //if the user and room have been set and the room is still open
    //tell the server "hey, i'm hamster123 and i'm watching 80stv"
    sendPresenceUpdate() {
        //If the user and room have been set, and the room is still open, tell the server where we're at
        if (this.user != null && this.channel != null)  {
            if (!this.channelIsOpen()) {
                console.log("*** PRESENCE - no longer in channel, update not sent")
                //this.channel = null
                return
            }

            this.dispatcher.Dispatch(
				"user_presence", 
				{
					user: this.user, 
                    channel: this.channel,
                    actualUrl: window.location.href,
                    timestamp: Date.now()
				}, 
                null, 'socvid.server')
                
            console.log(`*** PRESENCE: update sent to dispatch server by socket. User: ${this.user.username}, Channel: ${this.channel.channel_name}`)
        }
    }
    isRunning() {
        return this.presenceUpdateThreadId != 0
    }
    stopPresenceUpdateThread() {
        if (this.isRunning()) {
            var oldThreadId = this.presenceUpdateThreadId
            clearInterval(oldThreadId)
            this.presenceUpdateThreadId = 0
            console.log(`*** PRESENCE: killed update thread ${oldThreadId}`)
        }
    }
    startPresenceUpdateThread() {
        //if there is already an update thread running, kill it
        if (this.isRunning())
            this.stopPresenceUpdateThread()

        //send a single update right away, then continue updating in background thread on a fixed interval
        this.sendPresenceUpdate()
        this.presenceUpdateThreadId = setInterval(this.sendPresenceUpdate.bind(this), SV_PRESENCE_UPDATE_INTERVAL)
        console.log(`*** PRESENCE: update thread started, thread ID is ${this.presenceUpdateThreadId}`)
    }
    //A classic singleton pattern... consumers should never call UserPresenceDaemon's constructor
    //and should always grab an instance via UserPresenceDaemon.getDefaultInstance()
    //You can choose if you want the updater thread to start immediately if not already running
    //If calling this from a channel onload script, specify currentUser and currentRoom so that 
    //the first update goes out with the right info
    static getDefaultInstance(startUpdateThreadIfNeeded, currentUser, currentChannel){
        //get-or-create an object reference
        if (SV_PRESENCE == null) 
            SV_PRESENCE = new UserPresenceDaemon(SV_MODULE_ID)

        //update user and channel if specified
        currentUser && SV_PRESENCE.setUser(currentUser)
        currentChannel && SV_PRESENCE.setChannel(currentChannel)

        //start the updater thread if desired and thread is not already running
        if (startUpdateThreadIfNeeded)
            SV_PRESENCE.startPresenceUpdateThread()

        //return a window-level reference to the object
        return SV_PRESENCE
    }

    //Any other script on the page can use this to send Dispatches easily 
    //Use this to send a one-off message down the socket
    //without instantiating the presence daemon:  
    //UserPresenceDaemon.getDispatcher()
    //                  .Dispatch(type, payload, targetChannelId, targetModuleId) 
    static getDispatcherRef() {
        if (SV_PRESENCE != null)
            return SV_PRESENCE.dispatcher;
        else
        {
            //create the daemon if necessary...
            //but don't start the update thread
            SV_PRESENCE = new UserPresenceDaemon(SV_MODULE_ID)
            return SV_PRESENCE
        }
    }
 }

 //Usage: when a channel is opened or login state changes, retrieve the instance, set channel / user, and let it roll
 // 
 //var presence = UserPresenceUpdateDaemon.getDefaultInstance()
 //presence.setUser({a generic user object})
 //presence.setChannel({a generic channel object})


/*
const init = (moduleName) => {
    window["SV_PRESENCE"] = {
        dispatcher: new Dispatcher(
            moduleName,
            '*',
            (message) => {
                console.log("*** SocVid WS Dispatch received in Chat Client ***")
                console.log(JSON.stringify(message))
                console.log("*** Raising body.SVDispatchReceived event ***")
                document.dispatchEvent(new CustomEvent("SVDispatchReceived", {
                    bubbles: true,
                    detail: message
                }));
        
            }
        ),
        user: null,
        room: null
    }
} */