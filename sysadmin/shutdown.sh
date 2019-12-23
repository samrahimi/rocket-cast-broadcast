#!/bin/bash
#orderly shutdown of SVN services
#run this prior to rebooting or terminating the server to avoid data loss

echo 'Stopping load balancer' 
sudo systemctl stop nginx

echo 'Stopping chat server'
cd ~/rocket-cast && pm2 stop 0

echo 'Stopping broadcast services' 
cd ~/rocket-cast-broadcast/truelife/server && sudo pm2 stop 0

echo 'All done. Enjoy'
