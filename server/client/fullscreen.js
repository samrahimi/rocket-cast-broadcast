  	/* Social Fullscreen Hook */
      document.fullscreenEnabled =
      document.fullscreenEnabled ||
      document.mozFullScreenEnabled ||
      document.documentElement.webkitRequestFullScreen;
  
      /* globally available fullscreen */
      if (!window["FS"]) {
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
}
  