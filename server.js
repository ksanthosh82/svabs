/**
 * Module dependencies.
 */
var express = require('express');
var fs = require('fs');
var moment = require('moment');
var _ = require('lodash');
var validSessionDuration = 20 * 60 * 1000;

var http = require('http');
var https = require('https');
var RoutingProxy = require('http-proxy');
var path = require('path');
//var passjs = require('./public/pass.js');
var mongoose = require('mongoose');
var ejs = require('ejs');
var passport = require('passport');
//var authentication = require('./config/authentication');
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var config = require('./config/config');
//mongoose.set('debug', true);
//mongoose.connect(config.db);

var app = express();

app.configure(function(){
    // all environments
    app.set('developmentPort', process.env.PORT || 80);
    app.set('securedPort', process.env.SECURED || 443);
    app.set('localhostPort', process.env.SECURED || 8080);
    app.use(apiProxy());
    //app.set('views', path.join(__dirname, 'app/views'));
    //app.set('view engine', 'ejs');
    //app.set('view options', {layout:false, root: path.join(__dirname, 'views')});
    app.use(express.favicon());
    //app.use(express.logger({ immediate: true, format: 'dev', stream: logfile}));
    //app.use(express.logger({ format: 'tiny', stream: logfile}));
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.cookieParser());
    //app.use(express.session({secret: '1234567890QWERTY', cookie: {expires: new Date(Date.now() + 90000), maxAge: 90000}}));
    app.use(express.session({
        secret: '1234567890QWERTY',
        rolling: true,
        cookie: {maxAge : validSessionDuration}
    }));
    app.use(express.responseTime());
    // Initialize Passport
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(logErrors);
    app.use(errorHandler);
    // Remember Me function
    app.use(function (req, res, next) {
        //console.log('Request session Maxage - '+req.session.cookie.maxAge);
        //console.log('Requested URL - '+req.url+" and session Maxage - "+req.session.cookie.maxAge);
        if (req.method == 'POST' && req.url == '/login') {
            if (req.body.rememberme) {
                req.session.cookie.maxAge = 0; // 30*24*60*60*1000 Remember 'me' for 30 days
            } else {
                req.session.cookie.expires = false;
            }
        }
        next();
    });
});
//app.locals.dbConfig = config.db;
// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

//URL JSON
var urlJson = {
    "baseUrl" : "/"
};

//var sqlConfig = JSON.parse(fs.readFileSync('./config/sqlConfig.json', 'utf8')).config;
var sqlConfig = require('./config/sqlConfig.json');

//Error Page
function logErrors(err, req, res, next) {
    console.error(err.stack);
    next(err);
}
function errorHandler(err, req, res, next) {
    res.status(500);
    res.render('error', { error: err });
}

//Utilities URL
//Helper for ensuring authentication
function ensureAuthenticated(req, res, next) {
    //console.log("req.session.reportingMonthList:"+JSON.stringify(req.session.reportingMonthList));
    if (req.isAuthenticated()) {
        console.log(moment().utc().local().format("YYYY-MM-DD hh:mm:ss")+": Cookie MaxAge:"+req.session.cookie.maxAge+" Requested URL: "+req.url);
        req.session.cookie.maxAge = validSessionDuration;
        return next();
    }
    console.log("Authentication failed - Redirecting to Login...."+req.session.cookie.maxAge);
    res.redirect('/MMIS/login');
}

//Base URL
app.get('/', function (req, res) {
    //console.log("Redirect base URL to Login page");
    //res.redirect('/');
    clearSession(req);
    res.render('index');
});

function clearSession(req){
    if(typeof req.session != 'undefined' && req.session != null){
        //req.session.auth = null;
        req.session.user_profile = null;
    }
}

//
// Create Routing proxy server and set the target in the options.
//
var routingProxy = new RoutingProxy.RoutingProxy();
function apiProxy() {
    //console.log('Inside API proxy ');
    return function(req, res, next) {
        var pattern = /TEST/i;
        if(req.url.match(pattern)) {
            console.log('Routing for TEST- '+req.url);
            routingProxy.proxyRequest(req, res, {host: 'localhost', port: 8080});
        } else {
            next();
        }
    }
}

// Create an HTTP service.
var server = http.createServer(app);

server.listen(app.get('developmentPort'), function(){
    console.log('__dirname - ' + __dirname);
    console.log('process.env.NODE_ENV - ' + process.env.NODE_ENV);
    console.log('root - ' + config.root);
    console.log('Express server listening on port '+app.get('developmentPort'));
});
