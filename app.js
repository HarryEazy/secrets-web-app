//jshint esversion:6


// require dotenv asap, no variable needs to be assigned to it
require('dotenv').config();

// modules
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// encrypt module
const encrypt =require('mongoose-encryption');



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

// if no DB of name already exist, create DB & connect to it
// if exist connect to the DB
mongoose.connect('mongodb://localhost:27017/userDB', {
    // to prevent warnings
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// create schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// add encrypt functionality to our schema using plugin
userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});



// create mongoose model/collection based on the schema
const User = new mongoose.model('User', userSchema);


app.post('/register', function(req, res){

  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });

  newUser.save(function(err){
    if(err){
      console.log(err);
    } else {
      res.render('secrets');
    }
  });

});

app.post('/login', function(req, res){
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email:username}, function(err, foundUser){
    if(err){
      console.log(err);
    } else {
      if(foundUser){
        if(foundUser.password === password){
          console.log('success');
          res.render('secrets');
        }

      }
    }
  });
});






app.get('/', function(req, res){
  res.render('home');
});

app.get('/login', function(req, res){
  res.render('login');
});


app.get('/register', function(req, res){
  res.render('register');
});






// connect to port 3000
app.listen(3000, function() {
  console.log('Server started on port 3000');
});
