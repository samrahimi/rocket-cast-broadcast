// 1. Define some variables. Wish this was Angular!
var startLoad = 0,      //Timestamped when the YouTube player is loaded and the server has given us the playlist id and elapsedTime value
    endLoad=0,          //Timestamped when the YouTube player has cued the playlist... endLoad - startLoad is the MINIMUM additional offset beyond that calculated by the server
    playbackStarted=0,  //Timestamped when the player starts playing. Used for profiling only - by looking at the difference between this and endLoad in a variety of environments, we can come up with an average additional offset for the sync. 
    playerState=0,      //Timestamped when the player
    isMuted = false
var hideControlBarTimeout=0  //For hiding the control bar after n seconds
var playerStateTimeout=0     //For polling current video time, duration, title, etc

// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    playerVars: {
        enablejsapi: 1,
        playsinline: 1, 
        autoplay: 1,
        controls: 0,
        allowfullscreen: 0,
        fs: 1,
        showinfo:1,
        modestbranding: 1
    },
    //videoId: 'M7lc1UVf-VE',
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function updatePlayerState() {
    var state = {}

    if (player == null) {
      state = {powerOff:true}
    }
    else {
     state= {
          currentTime: player.getCurrentTime(),
          duration: player.getDuration(),
          videoUrl: player.getVideoUrl(),
          //playlistUrl: player.getPlaylistUrl(),
          playerState: player.getPlayerState(),
          title: player.getVideoData().title 
      }
   }

    
    if (state.duration && state.duration != 0) {
        $(".progress-elapsed-time").html(toHHMMSS(state.currentTime))
        $(".progress-total-time").html(toHHMMSS(state.duration))
    } else {
        $(".progress-elapsed-time").html('--:--')
        $(".progress-total-time").html('--:--')
    }

    if (state.videoUrl) {
        $(".youtube-link").attr("href", state.videoUrl)
        $(".youtube-title").html(state.title)
    }

    if (state.powerOff) {
      $(".youtube-link").attr("href", "#")
      $(".youtube-title").html("Press the Power Button to resume...")
  }
}

function pollPlayerState(timeout) {
    if(playerStateTimeout != 0) {
        clearInterval(playerStateTimeout);
        playerStateTimeout = 0;
      }
      playerStateTimeout = setInterval(updatePlayerState, timeout)
}


function updateMuteUI(isMuted) {
  if (isMuted) 
    $("#mute-unmute-icon").attr("name", "volume-off")
  else
    $("#mute-unmute-icon").attr("name", "volume-high")
}

//mute or unmute the video player
function setMuteState(playerObj, muteState) {
  window.isMuted = muteState
  window.isMuted ? window.player.mute() : window.player.unMute()
  updateMuteUI(isMuted)
}

function toggleMuteState(playerObj) {
  setMuteState(playerObj, !window.isMuted)
}

// 4. The API will call this function when the video player is ready.
//    We get the latest playlist and global offset data from the server, then start playing at the correct track + time
function onPlayerReady(event) {
  setMuteState(event.target, true)
  getChannelData(window['selectedChannel'], (json) => {
    if (json.startTime == 0) {
      $("#wrapper").hide()
      $("#offline").show()
      console.log(`channel id ${window['selectedChannel']} is offline. Waiting for SYNC...`)
    }
    startLoad = Date.now()
    //cue the playlist. This gets the video IDs without costing me an API call to gdata
    var pl =  {
                list:json.playlistId,
                listType:'playlist',
                //index:0,
                //startSeconds:parseInt(json.elapsedTime/1000),
                //suggestedQuality:'medium'
              }
    if (query("4K") == "true") {
      pl['suggestedQuality'] = 'highres'
    }

    console.log("before cue playlist")
    event.target.cuePlaylist(pl)
  })
}

// The player fires events here when asynchronous operations complete, or there is a 
// change in playback state (caused by user or otherwise). 
var initialLoadComplete = false;

function onPlayerStateChange(event) {
  //This is called when cuePlaylist is done... we get the playlist metadata and calculate the
  //index and offset to sync into the stream
  if (event.data == 5 && !initialLoadComplete) {
    console.log("cued")
    initialLoadComplete = true;
    var details = getPlaylistDetails()
    endLoad = Date.now()
    //add the player load time to the elapsed time retrieved from the server 
    var elapsed = channelData.elapsedTime + (endLoad - startLoad); 

    //make the calculation of playlist index and start time based on playlist duration and elapsed time
    [index, offset] = calculateSync(details, Math.round(elapsed/1000))

    //load the playlist and start playing appropriately. 
    player.setLoop(true)
    player.setShuffle(false)
    player.playVideoAt(index)
    player.seekTo(offset, true)
  }

  if (event.data == YT.PlayerState.PLAYING && initialLoadComplete) {
    //player.unMute();
    //initialLoadComplete = true;
    playbackStarted = Date.now()

    //profiling info - todo: store in DB
    console.log(`startLoad: ${startLoad}
                 endLoad: ${endLoad}
                 start/end difference: ${endLoad - startLoad}

                 playbackStarted: ${playbackStarted}
                 buffering time (playBackStarted - endload): ${playbackStarted - endLoad}`)

    $("#loading-overlay").hide()
    $("#controls-overlay").css("display", "flex")

    hideControlBarAfter(3000) //autohide controls after 3s
    pollPlayerState(1000) //check every 1s and update the progress bar in the UI
  }
}
function stopVideo() {
  player.stopVideo();
}
function hideControlBarAfter(timeout) {
  if (hideControlBarTimeout != 0) {
    clearTimeout(hideControlBarTimeout);
    hideControlBarTimeout = 0;
  }
  hideControlBarTimeout = setTimeout(() => {
    $("#controls-overlay").css("display", "none")
    $("#title-overlay").css("display", "none")
  }, timeout)
}

$(() => {
  
  $("#resync-button").on("click", (e) => {
    resync()
    e.preventDefault()
  })

  $("#mute-unmute-button").on("click", () => {
    toggleMuteState(player)
  })

  	/* Social Fullscreen Hook */
	document.fullscreenEnabled =
	document.fullscreenEnabled ||
	document.mozFullScreenEnabled ||
	document.documentElement.webkitRequestFullScreen;

	/* globally available fullscreen */
	window["FS"] = {
		requestFullscreen: (element) => {
			if (element.requestFullscreen) {
			element.requestFullscreen();
			} else if (element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
			} else if (element.webkitRequestFullScreen) {
			element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
			}
    },
    toggleFullscreen: (el) => {
      {
        if (document.fullscreenEnabled && document.fullscreenElement) {
          console.log("Player.js: quit fullscreen")
          document.exitFullscreen();
          return true;
        } 
        else {
          if (document.fullscreenEnabled)
          {
            window.FS.requestFullscreen(el)
            console.log("Player.js: start fullscreen")
            return true;
          }
          else
          {
            console.log("Player.js: fullscreen not available on this browser or device")
            return true;
          }
        }
      }
    }
  }

  $("#fullscreen-button").on("click", () => {
    if (document.fullscreenEnabled) {
      var el = document.documentElement
      window.FS.toggleFullscreen(el)    
    } else {
      alert("To watch in full screen mode, please view with Chrome or Firefox")
    }
  })

  $("#power-button").on("click", () => {
    if (player && player != null) {
      player.destroy()
      player = null
      updatePlayerState() //puts prompt text in the top bar telling you how to turn it on again
    } else {
      resync()            //refreshes the page, therefore turning the tv back on lol
    }
    e.preventDefault();
  })

  //A transparent overlay on top of the video
  //Gives us a surface to capture user interaction
  //while preventing them from triggering the 3rd party UI on tap
  $("#clearcoat").on("click", (e) => {
    console.log("clearcoat clicked"); 
    $("#controls-overlay").css("display", "flex")
    $("#title-overlay").css("display", "block")

    setTimeout(() => {hideControlBarAfter(5000)}, 0)
    //hideControlBarAfter(5000)
    e.preventDefault()

  })

  window.dispatcher = new Dispatcher('socvid.player', window['selectedChannel'], (dispatch => {
    switch (dispatch.type) {
        case "SYNC":
            location.reload()
    }
  }))
})
