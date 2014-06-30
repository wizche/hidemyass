Use Raspberry Pi as gateway for Hide My Ass VPN
===============================================

![Overview](https://raw.githubusercontent.com/wizche/hidemyass/master/doc/overview.png "HMA overview")

This project contains some bash scripts and a monitoring node.js application that allows the Raspberry Pi to act as a gateway and permit traffic from the wired interface (eth0, where you may connect your media-box) to the wireless interface (wlan0 -> Internet) **only** through a HideMyAss VPN tunnel.

The hma-vpn script in the `config\` directory is based on the official script provided by [HMA](https://support.hidemyass.com/entries/24970862-Recommended-Linux-CLI-OpenVPN-Client) with a small modification to inject user/password through an authentication file.

The hma-service script in the `config\` directory is used to start the VPN connection on startup (init.d service script). 
It also add the NAT rules to translate traffic from eth0 to tun0 (vpn interface) and vice-versa.
This scripts also implement a `switch [ip]` command that is used from the node.js application to switch the VPN server.

The forever_start.sh script in the `config\` directory uses [forever](https://github.com/nodejitsu/forever) to start the monitoring application at boot. (add it to `rc.local`)

Management Application
----------------------

Through the management application you can have a glance on the current VPN tunnel with network usage statistics. 
Furthermore you can change the VPN server directly from the application just by clicking on the desired server from the list.

*Remark:* The list of available server is filtered, client-side, to display only HMA servers in **Italy**.

![Management Web-App](https://raw.githubusercontent.com/wizche/hidemyass/master/doc/node-app.png "Management Web-App")

Setup
-----

* Download the repository somewhere on the Raspberry Pi
* Copy `config\hma-service` to the `/etc/init.d/` directory (add the executable permission `#chmod +x hma-service` if needed)
* Adjust the default gateway IP in the `hma-service` file to match yours
* Copy `config\hma-vpn` somewhere and add it to the PATH (or create a symbolic link to it `#ln -s /bin/hma-vpn config\hma-vpn`)
* Add the `forever_start.sh` script to `/etc/rc.local` 
* Add you HMA credentials to the `config\auth.txt` file 
* Adjust the path to the `auth.txt` file in `hma-vpn` script by replacing the sed pattern with the correct one (in this case was `/opt/pisky/config/auth.txt`)
* Install node.js dependencies with `#npm install`
* Adjust the web-socket URL in the `index.ejs` file (`io.connect('http://localhost');`) to match your Raspberry IP address
* Start the VPN connection with `#/etc/init.d/hma-service start`
* Start the node.js application with the `#config\forever_start.sh` command
* Open the browser and navigate to `http://rasberry-ip/`

Demo (Video)
------------

[![Demo Video](http://img.youtube.com/vi/Kuayu57K2nM/0.jpg)](http://www.youtube.com/watch?v=Kuayu57K2nM)