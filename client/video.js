const serverUrl='https://5d65884c.ngrok.io'
const defaultChannelUrl='https://5d65884c.ngrok.io/channel/TrueLifeTV'
channelData = {};

const  getChannelData= (channelId,callback) => {  
    var url = channelId ? `${serverUrl}/channel/${channelId}` : defaultChannelUrl
    $.get(url, (json) => {
        channelData = json;
        console.log("Got channel data: "+JSON.stringify(channelData, null, 2));
        
        callback(channelData)
    })
}

const setNewPlaylistForChannel= (playlistId, channelId, callback) => {
    var url = channelId ? `${serverUrl}/channel/${channelId}` : defaultChannelUrl

    $.ajax({
        url: url,
        data: {playlistId: playlistId},
        method: 'POST',
        success: function( result ) {
            channelData = result
            console.log("Set playlist complete. Updated channel data: "+JSON.stringify(channelData, null, 2));
            callback(channelData)
        }
      });
}
const restartPlaylist= (channelId, callback) => {
    var url = channelId ? `${serverUrl}/channel/${channelId}/restart` : defaultChannelUrl+"/restart"
    $.get(url, (json) => {
        channelData = json;
        console.log("Broadcast restarted. New channel data: "+JSON.stringify(channelData, null, 2));
        
        callback(channelData)
    })
}