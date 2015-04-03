/**
 * Created by Abhisek on 10/30/13.
 */

//var config = require('./config.js').config(),
//var mongodb = require('mongodb'),
var mongoose = require('mongoose'),
    passport = require('passport'),
    debug = require('debug')('express:application'),
    LocalStrategy = require('passport-local').Strategy,
    bcrypt = require('bcrypt-nodejs');

//var User = require('../app/models/User');

exports.saveUser=saveUser;

var config =
{
    "app": {
        "port": 9080,

        "auth": {
            "SALT_WORK_FACTOR": 10,

            "db": {
                "host": "localhost",
                "port": 27017,
                "name": "PET"
            }
        }
    },
    "db": {
        "host": "localhost",
        "port": 27017,
        "name": "PET"
    }

};

var SALT_WORK_FACTOR = config.app.auth.SALT_WORK_FACTOR;

//Connection already opened in server js and hence commenting this....
/*mongoose.connect('mongodb://' + config.app.auth.db.host + ':' + config.app.auth.db.port + '/' + config.app.auth.db.name);
 var db = mongoose.connection;

 db.on('error', console.error.bind(console, 'connection error:'));
 db.once('open', function callback() {
 debug('Connected to DB');
 });*/

// User Schema
var userSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true},
    accessToken: { type: String }, // Used for Remember Me
    type:{type: String,required: true},
    display_name:{type: String,required: true},
    status:{type: Boolean},
    encrypt:{type: Boolean}
});


// Bcrypt middleware
userSchema.pre('save', function (next) {
    var user = this;

    if (!user.isModified('password')) return next();

    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, null, function (err, hash) {
            if (err) return next(err);
            user.password = hash;
            next();
        });
    });
});

// Password verification
userSchema.methods.comparePassword = function (candidatePassword, cb) {
    //console.log("Hi comparePassword - "+candidatePassword);
    //Remove this to compare password...
    if(typeof this.encrypt == "undefined" || this.encrypt == null){
        if(candidatePassword == this.password){
            cb(null, true);
        }else{
            cb(null, false);
        }
    }else{
        console.log("Encrypted Password validation - "+candidatePassword);
        bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
            if (err){
                console.log("Encrypted Password validation failed - "+err);
                //return cb(err);
                cb(null, false);
            }
            cb(null, isMatch);
        });
    }

    //console.log("comparePassword"+comparePassword);
    /*bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
     if (err) return cb(err);
     cb(null, isMatch);
     });*/
};

// Remember Me implementation helper method
userSchema.methods.generateRandomToken = function () {
    var user = this,
        chars = "_!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
        token = new Date().getTime() + '_';
    for (var x = 0; x < 16; x++) {
        var i = Math.floor(Math.random() * 62);
        token += chars.charAt(i);
    }
    return token;
};

var User = mongoose.model('User', userSchema, 'User');

function saveUser(document,res) {
    debug("document : "+ JSON.stringify(document));
    //var usr = new User({ username: 'bob', email: 'bob@example.com', password: 'secret' });
    var usr = new User(document);
    usr.save(function (err) {
        if (err) {
            debug(err);
            return {error:{msg:err}};
        } else {
            console.log("User Added");
            res.send({response:"User Added"});
        }
        res.send({response:"User Added"});

    });

}

passport.serializeUser(function (user, done) {
    var createAccessToken = function () {
        var token = user.generateRandomToken();
        User.findOne({ accessToken: token }, function (err, existingUser) {
            if (err) {
                return done(err);
            }
            if (existingUser) {
                createAccessToken(); // Run the function again - the token has to be unique!
            } else {
                user.set('accessToken', token);
                user.save(function (err) {
                    if (err) return done(err);
                    return done(null, user.get('accessToken'));
                })
            }
        });
    };

    if (user._id) {
        createAccessToken();
    }
});

passport.deserializeUser(function (token, done) {
    User.findOne({accessToken: token }, function (err, user) {
        done(err, user);
    });
});


// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(function (username, password, done) {
    //var test = {username: "Santhosh",password:"password1",email:"san@san.com",display_name:"Santhosh K"};
    //User.insert({username:"test",password:"test",email:"test",accessToken:"test",type:"Test",display_name:"test"})
    //var user1 = User.find({username:"Santhosh"}).where('username').equals('Santhosh');
    //User.findOne({ username: 'arif@test.com' }, function (err, user) {
    User.findOne({ username: username }, function (err, user) {
        if (err) {
            console.log("Error querying User - "+err);
            return done(err);
        }
        //console.log("Passport Use "+ username + " " + password+" "+user);
        if (!user) {
            console.log("---Passport Use "+ username + " " + password+" "+user);
            /*if(typeof user == "undefined" || user == null){
                user = new User({
                    "accessToken" : "1425464484001_EG!sd2DYcTZ_saRM",
                    "display_name" : "TEST",
                    "email" : "test@test1.com",
                    "password" : "test",
                    "type" : "test",
                    "username" : "test",
                    "encrypt" : true
                });
                user.save(function saveUser(err1){
                    if (!err1){
                        console.log('USER Successfully inserted');
                        //return done(null, false, { message: 'USER Successfully inserted'});
                    }else{
                        console.log('USER Insert Errored out: '+err1);
                        //res.json(500, {'statusMsg' : ' Errored out - '+err1});
                        //return done(null, false, { message: 'USER Insert Errored out: '+err1 });
                    }
                });
                return done(null, false, { message: 'Unknown user ' + username });
            }*/
            //user.save();
            return done(null, false, { message: 'Unknown user ' + username });
        }

        console.log("Passport Use "+ username + " " + password+" "+user);
        user.comparePassword(password, function (err, isMatch) {
            if (err) return done(err);
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Invalid password' });
            }
        });
    });
}));
