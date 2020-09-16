//jshint esversion:6


// require dotenv asap, no variable needs to be assigned to it
require('dotenv').config();


const express = require('express'),
  bodyParser = require('body-parser'),
  ejs = require('ejs'),
  mongoose = require('mongoose'),
  session = require('express-session'),
  passport = require('passport'),
  passportLocalMongoose = require('passport-local-mongoose'),
  findOrCreate = require('mongoose-findorcreate'),
  GoogleStrategy = require('passport-google-oauth20').Strategy;




// create new app instant using express
const app = express();

// set template engine to ejs
app.set('view engine', 'ejs');

// use bodyParser to pass the requests
app.use(bodyParser.urlencoded({
  extended: true
}));

// use public directory to store static files like images
app.use(express.static('public'));

app.use(session({
  secret: 'Our little secret',
  resave: false,
  saveUninitialized: false
}));

// init passport
app.use(passport.initialize());
// use passport for managing the session
app.use(passport.session());

// if no DB of name already exist, create DB & connect to it
// if exist connect to the DB
mongoose.connect('mongodb://localhost:27017/userDB', {
  // to prevent warnings
  useNewUrlParser: true,
  useUnifiedTopology: true
});
// to fix -> DeprecationWarning: collection.ensureIndex is deprecated.
mongoose.set('useCreateIndex', true);

// create schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

// use to hash & salt Pwd's and save users into mongoDB
userSchema.plugin(passportLocalMongoose);
// set up findOrCreate module, need to add it as plugin to schema
userSchema.plugin(findOrCreate);

// create mongoose model/collection based on the schema
const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());

// serialize and deserialize users
// copied from passportjs.org documentation/General/Config
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// set up for Google using passport
// findOrCreate is a module that allows us to use the function
// it is not built in to mongoose vanilla
// this is needed for Google+ deprecation
// userProfileURL: 'http://www.googleapis.com/oauth2/v3/userinfo'
passport.use(new GoogleStrategy({
    // client id & client secret from Google developer console
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/secrets',
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(accessToken, refreshToken, profile, cb) {

    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));


app.post('/register', function(req, res) {
  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect('register');
    } else {
      // use passport to authenticate user
      // check to see if user is logged in
      passport.authenticate('local')(req, res, function() {
        res.redirect('/secrets');
      });

    }

  });

});

app.post('/login', function(req, res) {

  // create new user
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
      // if user found
    } else {
      // authenticate user
      passport.authenticate('local')(req, res, function() {
        res.redirect('/secrets');
      });
    }
  });


});

app.post('/submit', function(req, res){
  const submmitedSecret = req.body.secret;
  // find user by their id
  User.findById(req.user.id, function(err, foundUser){
    if(err){
      console.log(err);
    } else {
      // if foundUser then create secret for that user in DB
      if (foundUser){
        foundUser.secret = submmitedSecret;
        foundUser.save(function(){
          res.redirect('/secrets');
        });
      }
    }
  });


});


app.get('/', function(req, res) {
  res.render('home');
});

// allows google login and authentication check
app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile']
  })

);

app.get('/auth/google/secrets',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get('/login', function(req, res) {
  res.render('login');
});


app.get('/register', function(req, res) {
  res.render('register');
});

// show users secrets on secrets page 
app.get('/secrets', function(req, res){
  // finds secrets that are not equal to null
  User.find({'secret': {$ne: null}}, function(err, foundUsers){
    if(err){
      console.log(err);
    } else {
      if (foundUsers){
        res.render('secrets', {usersWithSecrets: foundUsers});
      }
    }
  });
});


app.get('/secrets', function(req, res) {
  // check if user is authenticated (logged in)
  // if true then we can safely render secrets page
  if (req.isAuthenticated()) {
    res.render('secrets');
    // redirect user to register page as user was not authenticated
  } else {
    res.redirect('login');
  }
});

app.get('/submit', function(req, res){
  // check if user is authenticated (logged in)
  // if true then we can safely render secrets page
  if (req.isAuthenticated()) {
    res.render('submit');
    // redirect user to register page as user was not authenticated
  } else {
    res.redirect('login');
  }
});

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});


// connect to port 3000
app.listen(3000, function() {
  console.log('Server started on port 3000');
});
