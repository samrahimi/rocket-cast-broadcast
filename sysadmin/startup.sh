#!/bin/bash
#starts the SVN server... if your configuration is different, adjust accordingly
echo 'Firing up the load balancer…' 
sudo systemctl start nginx
echo 'Starting secure broadcast services over TRIP-WSS and HTTPS…' 
cd ~/rocket-cast-broadcast/truelife/server && sudo pm2 start app.js
echo 'Firing rockets and loading SVN.im webapp'
cd ~/rocket-cast && pm2 start 'meteor npm start'
echo 'All done. Enjoy'
