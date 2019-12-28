const APP_ID = "im.svn.rtc."                  //a unique namespace under which all channels will reside

const IPFS = require('ipfs')
const Room = require('ipfs-pubsub-room')                     //an ipfs pubsub room, for signaling and discovery
const RTCManager = require('./rtcmanager')    //manages p2p mesh networking for the room,
                                              //with exchange of sdp offer / response etc
const debug = console.log;

const ipfs = new IPFS({
  repo: repo(),
  EXPERIMENTAL: {
    pubsub: true
  },
  config: {
    Addresses: {
      Swarm: [
        '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
      ]
    }
  }
})

const announceRetryInterval = 5000
const announce = (room) => {
  room.broadcast(JSON.stringify({type:'announce'}))
}

const joinChannel = (channel, userInfo, callback) => {
  const room = Room(ipfs, 'im.svn.rtc.'+channel)
  const rtcManager = RTCManager(room, userInfo)
  room.on("subscribed", () => {
    debug(`Subscribed to ${channel} on IPFS pubsub, listening for connection requests`)

    room.on('peer joined', (peer) => 
    {
        if (peer == userInfo.id)
          debug("ignoring echoed join event")
        else
        {
          debug('ipfs peer ' + peer + ' joined, sending rtc connection request')
          rtcManager.requestConnection(peer)
        }
    }) 

      //...and we will listen for others who join after us.
    room.on("message", (message) => {
      if (message.from == userInfo.id) {
        debug("ignoring broadcast message from self")
        return
      }

      var payload = JSON.parse(message.data)
      if (payload.to == userInfo.id || payload.type =="announce") {
        switch (payload.type) {
          case "announce":
            rtcManager.requestConnection(message.from)
            break
          case "rtc_connection_request":
            rtcManager.acceptConnectionRequest(message.from, payload)
            break
          case "rtc_connection_response":
            rtcManager.completeConnection(message.from, payload)
            break
        }
      }
    })
  })


  room.on('peer left', (peer) => {
    debug('ipfs peer ' + peer + ' left...')
  })
  callback({room, rtcManager, ipfs})
}

const joinWhenConnectedToSwarm = (channel, userInfo, callback) =>
{    
  //wait till we've actually got peers and then the join thing won't happen
  ipfs.swarm.peers((err, peers) => {
    if (err) throw err
    debug('IPFS peers in swarm: ', peers)
    if (!peers || peers.length == 0) {
      setTimeout(() => {joinWhenConnectedToSwarm(channel, userInfo, callback)}, 1000)
    } else {
      joinChannel(channel, userInfo, callback)
    }
  })
}

//Entry point. If no channel is specified, it will use the window's location hash as the channel
//userInfo can be whatever you want... as long as the interface is consistent between users
//listening on a given topic
const start = (channelToJoin, userInfo, callback) => {
  ipfs.once('ready', () => ipfs.id((err, info) => {
    if (err) { throw err }
    debug('IPFS node ready with address ' + info.id)
    userInfo.id = info.id //so we can filter out our own messages lol
    const channel= APP_ID+  (channelToJoin || location.hash.substring(1))

    joinWhenConnectedToSwarm(channel, userInfo, callback)
  }))
}

function repo () {
  return 'ipfs/im-svn-rtc/' + Math.random()
}

window["ServerlessSignalHub"] = {
  init: (channelToJoin, userInfo, callback) => {
    start(channelToJoin, userInfo, callback)
  }
}