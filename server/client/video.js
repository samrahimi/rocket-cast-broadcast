// Read a page's GET URL variables and return them as an associative array.
const getUrlVars = () =>
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

//Utility method to retrieve querystring values and handle undefined keys
//If the key is present in the querystring, this returns its value
//If not present, we return the empty string, ''
const query = (key) => {
    return (typeof getUrlVars()[key] !== 'undefined' ? getUrlVars()[key]
            : '')
}

//True if dev=true set in the querystring
//Ideally, the parent app that's embedding video.html 
//will know what environment it's running in, and  server URLs differ between dev and production environments
const isDev = () => {
    return query('dev') == 'true'
}

//For MVP, the player front end and
const serverUrl= !isDev() ? 
                '' : 
                'http://samrahimi.com' //if running on a different host then the front end, otherwise leave blank
const defaultChannelUrl= !isDev() ? 
                '/channel/TrueLifeTV' : 
                'http://samrahimi.com/channel/TrueLifeTV'


//Get your own key by going to google cloud api console, youtube API v3. The one below works only for truelife sites
const youtubeAPIUrl = 'https://www.googleapis.com/youtube/v3/videos?part=contentDetails&key=AIzaSyDyqJKwMF_vhGqNUmDbbEkvQ55E9ZDhSnc&id='
channelData = {};
playlistDetails=[]

const  getChannelData= (channelId,callback) => {  
    var url = channelId ? `${serverUrl}/channel/${channelId}` : defaultChannelUrl
    $.get(url, (json) => {
        channelData = json;
        console.log("Got channel data: "+JSON.stringify(channelData, null, 2));
        
        callback(channelData)
    })
}

//Accepts: an array of video ids
//Returns: a JSON array with the details of each video
//Purpose: to get necessary details like the length of each video in a playlist
const getPlaylistDetails= (videoIds, callback) => {
    var ids = videoIds.join(',');
    var url = youtubeAPIUrl+ids
    $.get(url, (json)=> {
        //parse out the array of items and add a timestamp in raw seconds
        //since that is what's needed by the player and sync algorithm
        playlistDetails = json.items.map(item => {
            item.durationInSeconds = parseYoutubeTimestamp(item.contentDetails.duration)
            return item
        })

        console.log("Got playlist details: "+JSON.stringify(playlistDetails, null, 2))
        callback(playlistDetails)
    })
}

//Accepts: a video duration as returned by the youtube data api
//Returns: the value in seconds, as an integer (expected by the youtube player api)
const parseYoutubeTimestamp = (duration) => {
    var a = duration.match(/\d+/g);

    if (duration.indexOf('M') >= 0 && duration.indexOf('H') == -1 && duration.indexOf('S') == -1) {
        a = [0, a[0], 0];
    }

    if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1) {
        a = [a[0], 0, a[1]];
    }
    if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1 && duration.indexOf('S') == -1) {
        a = [a[0], 0, 0];
    }

    duration = 0;

    if (a.length == 3) {
        duration = duration + parseInt(a[0]) * 3600;
        duration = duration + parseInt(a[1]) * 60;
        duration = duration + parseInt(a[2]);
    }

    if (a.length == 2) {
        duration = duration + parseInt(a[0]) * 60;
        duration = duration + parseInt(a[1]);
    }

    if (a.length == 1) {
        duration = duration + parseInt(a[0]);
    }
    return duration
}

//the above, in reverse. Seconds to hh:mm:ss string
const toHHMMSS = (secs) => {
    var sec_num = parseInt(secs, 10)
    var hours   = Math.floor(sec_num / 3600)
    var minutes = Math.floor(sec_num / 60) % 60
    var seconds = sec_num % 60

    return [hours,minutes,seconds]
        .map(v => v < 10 ? "0" + v : v)
        .filter((v,i) => v !== "00" || i > 0)
        .join(":")
}


const calculateSync = (items, totalElapsedTime) => {
    totalPlaylistDuration = items.map(item => item.durationInSeconds).reduce((a,b) => a+b, 0)
    var currentElapsedTime = parseInt(totalElapsedTime) % parseInt(totalPlaylistDuration)

    //Iterate through the items
    //Each time: 
    //if the remaining time is less than the item duration, we are done. Return the index and the remaining time
    //otherwise reduce currentElapsedTime by item duration, and go to the next item
    for(var i=0; i<items.length; i++) {
        if (currentElapsedTime < items[i].durationInSeconds) {
            return [i, currentElapsedTime]
        } 
        currentElapsedTime -= items[i].durationInSeconds
    }
}
const resync = () => {
    location.reload() //because we're running in an iframe ;)
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
        //console.log("Broadcast restarted. New channel data: "+JSON.stringify(channelData, null, 2));
        
        callback(channelData)
    })
}

     