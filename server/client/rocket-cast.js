//window level UI functions that are used by rocket-cast to generate HTML widgets, etc.
//should not manipulate the DOM, and should DEFINITELY not manipulate the Meteor data content of rocket-cast.

window["__RC"] = {
    getChannelSurferViewerString: (channel) => {
                                                var html = ''
                                                channel.currentViewers.forEach((viewer) => { 
                                                    html += 
                                            `<img data-name="${viewer.username}" alt="${viewer.display_name}" class="channel_surfer_minithumb" src="${viewer.avatar_url}"  /> &nbsp;`})

                                            return html;
                                            },
    getChannelSurferHtml: (channels) => {
       var html = ""

       channels.forEach(channel => 
           {
               html+= `
       <li class="sidebar-item js-sidebar-type-c" data-id="" style="height:64px">
               <a class="sidebar-item__link" href="/channel/${channel.channel_name}" aria-label="${channel.channel_name}" style="align-items: start; -webkit-box-align: start">
           
           
                   <div class="sidebar-item__picture" style="flex: 0 0 48px; width:48px; height:48px">
           
                       <div class="sidebar-item__user-thumb" style="width:48px; height:48px">
           
                           <div class="avatar">
           
                               <img src="https://samrahimi.com/avatars/${channel.channel_name}.png" class="avatar-image">
           
                           </div>
           
                       </div>
           
                   </div>
           
                   <div class="sidebar-item__body">
                       <div class="sidebar-item__message" style="height:48px">



                           <div class="sidebar-item__message-top">
                               <div class="sidebar-item__name">
                                   <div class="sidebar-item__room-type">
                                       <svg class="rc-icon rc-icon--default-size sidebar-item__icon sidebar-item__icon--hashtag"
                                           aria-hidden="true">
                                           <use xlink:href="#icon-hashtag"></use>
                                       </svg>
                                   </div>
           
                                   <div class="sidebar-item__ellipsis">
                                       ${channel.channel_name}
                                   </div>
           
                               </div>
                               <span class="sidebar-item__time"></span>
                           </div>

                           <div class="sidebar-item__message-bottom" style="width:100%">
                           ${window.__RC.getChannelSurferViewerString(channel)}
                       </div>



                       </div>	
                   </div>


               </a>
           </li>
           `})

       return html
    },
   
    getRecentViewerHtml: (viewers, roomInstance) => {
    viewers.reverse() //truelife server is sorting backwards, TODO fix presenceController
    let maxAge = 86400 * 1000
    let thumbs = ``

    viewers.forEach(viewer => {
        thumbs += 
        `<a class="recentViewer" title="${viewer.display_name}" href="${viewer.profile_url}" target="_blank">
            <img alt="Picture of ${viewer.display_name}" src="${viewer.avatar_url}" />
            ${Date.now() - viewer.last_activity < maxAge ? '<div class="status-bullet-online"></div>': ''}
        </a>`
    })

    let onlineNow = viewers.filter(x => Date.now() - x.last_activity < maxAge).length
    roomInstance.activeViewerCount.set(onlineNow)

    return thumbs;
    },

    getAllChannelsHtml: (channels, showViewers = true) => {
        var html = ""
 
        channels.forEach(channel => 
            {
                html+= `
        <li class="sidebar-item js-sidebar-type-c" data-id="" style="height:64px">
                <a class="sidebar-item__link" href="/channel/${channel.channel_name}" aria-label="${channel.channel_name}" style="align-items: start; -webkit-box-align: start">
            
            
                    <div class="sidebar-item__picture" style="flex: 0 0 48px; width:48px; height:48px">
            
                        <div class="sidebar-item__user-thumb" style="width:48px; height:48px">
            
                            <div class="avatar">
            
                                <img src="https://samrahimi.com/avatars/${channel.channel_name}.png" class="avatar-image">
            
                            </div>
            
                        </div>
            
                    </div>
            
                    <div class="sidebar-item__body">
                        <div class="sidebar-item__message" style="height:52px !important; justify-content: flex-start">
                            <div class="sidebar-item__message-top">
                                <div class="sidebar-item__name">
                                    <div class="sidebar-item__room-type">
                                        <svg class="rc-icon rc-icon--default-size sidebar-item__icon sidebar-item__icon--hashtag"
                                            aria-hidden="true">
                                            <use xlink:href="#icon-hashtag"></use>
                                        </svg>
                                    </div>
            
                                    <div class="sidebar-item__ellipsis">
                                        ${channel.channel_name}
                                    </div>
            
                                </div>
                                <span class="sidebar-item__time"></span>
                            </div>
 
                            <div class="sidebar-item__message-bottom large-thumb-second-line" style="align-items:flex-start">
                             ${channel.topic ? channel.topic : 'Another great channel on the Social Video Network'}
                               </div>
                        </div>	
                    </div>
 
 
                </a>
            </li>
            `})
 
        return html
    }
 
}
