var exec = require('child_process').exec;

module.exports = function (app, io) {
    var self = this;
    self.io = io;
    app.get('/api/switch/:id', function (req, res) {
        var ip = req.param('id');
        io.sockets.emit('log', "Switch request for IP " + ip);
        exec('/etc/init.d/openvpn switch ' + ip,
            function (error, stdout, stderr) {
                console.log('stdout: ' + stdout);
                console.log('stderr: ' + stderr);
                if (error !== null) {
                    io.sockets.emit('log', "Error switching to IP " + ip + ": " + error.message);
                    console.log('exec error: ' + error);
                } else {
                    io.sockets.emit('log', "Switch script started!");
                }
            });
        res.json({
            ok: true
        });
    });
};
