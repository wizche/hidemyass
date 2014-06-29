var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');

/* GET home page. */
router.get('/', function (req, res) {

    fs.readFile('./config/auth.txt', 'utf8', function (err, data) {
        if (err) throw err;
        console.log('OK: auth.txt');
        var lines = data.split('\n');

        var credential = { username: '', password: ''};
        if (lines.length < 2) {
            console.error("Failed not valid")
        } else {
            credential.username = lines[0];
            credential.password = lines[1];
        }
        res.render('index', {
            credentials: credential,
            location: './config/auth.txt',
            updated: req.query.valid
        });
    });
});

router.post('/auth', function (req, res) {
    res.redirect('/?valid=true');
});

module.exports = router;
