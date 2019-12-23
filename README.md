# rocket-cast-broadcast

player, broadcast server, and socket connector for rocket-cast user presence and data sync(alpha live on https://svn.im)


Quickstart (development)

cd server && npm i && node app.js


Test / Production Use as Service

pm2 start app.js


Environment:

Uses HTTP port 8080 by default; set the PORT variable to use a custom port. In production this is designed to be hosted behind a reverse proxy like Nginx, and served over SSL handled by the proxy.

Quirks:

The server uses an undocumented, open YouTube API to gather playlist data for lists <= 200 items in length. There is no way to page beyond that. 

You can choose to call the official YouTube data API if you wish, and page through to the end of the list, but it is an annoying multi-step process, and the quota is tiny: 10,000 units per month, per API key (issued in the Google Cloud console). Each 50-item "page" will cost you 7 units. 

My suggestions: if the unofficial endpoint stops working, it is suggested that you forgo the use a web scraper such as youtube-dl (in info-only mode) to gather the data, and use the appropriate strategies to avoid rate limiting. Or create your own playlist editor and database of video metadata. If dealing with only individual videos, the player API itself can be used creatively (but without breaking any rules) and will provide you with the data you need to capture when videos are added to the syste (just cue up the video in an invisible player, get the data, and then don't play it)

Or go P2P and build a helpful CLI workflow for users to liberate videos from YouTube: youtube-dl -> video file -> seed on webtorrent. In that case, you store the torrent's hash in your DB or on a permaweb like Arweave, and modify the player to use webtorrent and an ordinary video tag. 

Updates to come!
