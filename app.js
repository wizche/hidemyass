var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var os = require('os');
var proc = require('node-proc');
var routes = require('./routes/index');
var api = require('./routes/api');
var network = require('network');
var sys = require('sys')
var exec = require('child_process').exec;
var http = require('http');
var https = require('https');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* SOCKET IO */
var server = http.Server(app);
var io = require('socket.io')(server);

app.use('/', routes);
// Define /api endpoints
api(app, io);

/// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});


var cronJob = require('cron').CronJob;

var interfaceStatistics = function (ifname, callback) {
    proc.netdev(function (err, data) {
        if (err) {
            console.error(err);
            return;
        }

        for (var i in data) {
            var int = data[i];
            if (int && int.device && int.device == ifname) {
                console.log("Interface TX: " + int["Tx"].bytes + " bytes");
                console.log("Interface RX: " + int["Rx"].bytes + " bytes");
                var data = {
                    tx: int["Tx"].bytes,
                    rx: int["Rx"].bytes
                };
                callback(null, data);
            }
        }
    });
};

var gatherData = function (socket) {
    var interfaces = os.networkInterfaces();

    var results = {};
    var tunName = "";
    console.log(interfaces);

    for (var name in interfaces) {
        if (name.match(/^tun/)) {
            console.log("Found interface " + name);
            results.tunnelEnabled = true;
            results.tunnelName = name;
        } else {
            console.log("Interface skipped " + name);
        }
    }

    if (results.tunnelEnabled) {

        interfaceStatistics(name, function (err, tempData) {
            var oldRx = tempData.rx, oldTx = tempData.tx;
            var start = new Date().getTime();
            setTimeout(function () {
                interfaceStatistics(name, function (err, data) {
                    var execTime = (new Date().getTime()) - start; // ms
                    var txSpeed = (((data.tx - oldTx) * 8 / 1024.0) / execTime) * 1000;
                    var rxSpeed = (((data.rx - oldRx) * 8 / 1024.0) / execTime) * 1000;
                    console.log("Elapsed " + execTime + " ms");
                    console.log("Tx " + txSpeed + " kbyte/sec");
                    console.log("Rx " + rxSpeed + " kbyte/sec");
                    results.tunnelRx = rxSpeed.toFixed(0);
                    results.tunnelTx = txSpeed.toFixed(0);
                    socket.emit('data', results);
                })
            }, 1000);
        });

        network.get_public_ip(function (err, ip) {
            if (err) {
                socket.emit('internet', { available: false });
            } else {
                https.get('https://freegeoip.net/json/' + ip, function (res) {
                    var body = '';
                    res.on('data', function (chunk) {
                        body += chunk;
                    });
                    res.on('end', function () {
                        socket.emit('internet', { available: true, publicIP: ip, location: body });
                    });
                }).on('error', function (e) {
                    console.log("Got error: " + e.message);
                });
            }
        })

    } else {
        results.tunnelEnabled = false;
        socket.emit('data', results);
    }
}

var collectServerData = function (socket) {
    https.get("https://securenetconnection.com/vpnconfig/servers-cli.php", function (res) {
        var body = '';
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            if (res.statusCode == 200) {
                var lines = body.split('\n');
                var serverList = [];
                for (var l in lines) {
                    var line = lines[l];
                    var fields = line.split('|');
                    serverList.push({
                        ip: fields[0],
                        name: fields[1],
                        country: fields[2]
                    });
                }
                socket.emit('servers', serverList);
            } else {
                console.log("Got bad response: " + res.statusCode);
            }
        });
    }).on('error', function (e) {
        console.log("Got error: " + e.message);
    });
};

io.on('connection', function (socket) {
    console.log('a user connected');

    var job = new cronJob('* * * * * *', function () {
        gatherData(socket);
    }, null, true);

    collectServerData(socket);

    /*
     function puts(error, stdout, stderr) {
     var serverList = stdout;
     socket.emit('servers', serverList);
     }

     exec("hma-vpn.sh -l Italy", puts);
     */

    socket.on('disconnect', function () {
        console.log("User disconnected");
        if (cronJob) {
            job.stop();
        }
    });
})
;

server.listen(80);

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
