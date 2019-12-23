
var SERVER_BASE_URL = 'https://video.svn.im/'
const setOnAir=() => {
    $(".on-air").show()
    $(".off-air").hide()
  }
  const setOffAir=() => {
    $(".on-air").hide()
    $(".off-air").show()
  }
  const isOnAir = () => {
    return (typeof channelJson.playlistId !== 'undefined' && channelJson.playlistId.length > 0)
  }
  const updateBroadcastStatus = () => {
    if (isOnAir()) {
      setOnAir()
    } else {
      setOffAir()
    }

    $("input, button").removeAttr("disabled")
  }
  const disableAfterSubmit=() => {
    $(".results").removeClass("success").removeClass("error").html("").hide()
    $("input").val("")
    $("input, button").attr("disabled", "disabled")
  }

  
  $(() => {

    /*
    if (query["layout"]=="embedded") {
      $(".embed").show()
      $(".no-embed").hide()
    } else {
      $(".embed").hide()
      $(".no-embed").show()
    } */
    
    getChannelData(selectedChannel, (json) => {
      window.channelJson = json
      updateBroadcastStatus()
      //$("#channelJson").html(JSON.stringify(json, null, 2))
    })

    $("#updatePlaylist").on("click", () => {
        let listId = getUrlVars($("#newPlaylistId").val())["list"]
        if (typeof listId === 'undefined' || listId.length == 0) {
            console.log("Invalid Playlist Url: "+$("#newPlaylistId").val())
            $(".results").addClass("error").html("ERROR").show()
            updateBroadcastStatus()
            return
        }

        disableAfterSubmit();

        listId = listId.replace('#', '') //kill any trailing hashes
        setNewPlaylistForChannel(listId, selectedChannel, 
        (json) => {
            window.channelJson = json

            //tell all currently tuned in players to this channel 
            //to resync with the server...
            window.dispatcher.Dispatch("SYNC", {force:true},selectedChannel, "socvid.player")
            //$("#channelJson").html(JSON.stringify(json, null, 2))
            $(".results").addClass("success").html("Playlist Updated! Now streaming...").show()

            updateBroadcastStatus()
        });
    })


    $("#restartBroadcast").on("click", () => {
        disableAfterSubmit();

        restartPlaylist(selectedChannel, (json) => {
            window.channelJson = json
            window.dispatcher.Dispatch("SYNC", {force:true},selectedChannel, "socvid.player")

            //$("#channelJson").html(JSON.stringify(json, null, 2))
            updateBroadcastStatus()
        })
    })

    $("#stopBroadcast").on("click", () => {
      setNewPlaylistForChannel('', selectedChannel, 
        (json) => {
            window.channelJson = json
            //$("#channelJson").html(JSON.stringify(json, null, 2))
            $(".results").addClass("success").html("Streaming Stopped.").show()
            window.dispatcher.Dispatch("SYNC", {force:true},selectedChannel, "socvid.player")

            updateBroadcastStatus()
        });
    })

    $("ch").html(selectedChannel)
    $("#channelLink").attr("href", $("#channelLink").attr("href")+selectedChannel)
    $("#channelLink").html(selectedChannel)
  })
