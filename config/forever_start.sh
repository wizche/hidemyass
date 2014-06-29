#!/bin/sh

echo "Starting PiSky" >> /tmp/pisky.log
cd /opt/pisky
echo "Changed current directory" >> /tmp/pisky.log
/opt/node-v0.10.20-linux-arm-pi/bin/forever start -a -l /tmp/pisky-app.log app.js > /tmp/pisky.log  2>&1
echo "Forever started!" >> /tmp/pisky.log



