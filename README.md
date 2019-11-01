# truelife

Quickstart (development)

cd server && npm i && node app.js

Test / Production Use as Service

pm2 start app.js

Environment:

server/app.js has paths to SSL certificates for the samrahimi.com domain, pointing to where letsencrypt ended up saving the files. If running this on a different domain, or on localhost, change this yourself.

server/client/video.js has a youtube data API key (line 3)... this key only works for requests originating from samrahimi.com. If running this on another domain, get your own key from google cloud api console. 
