//jshint esversion:6


// require dotenv asap, no variable needs to be assigned to it
require('dotenv').config();

// modules
// bcrypt encryption module
// saltrounds is the amount of times to salt pwd
const express = require('express'),
      bodyParser = require('body-parser'),
      ejs = require('ejs'),
      mongoose = require('mongoose'),
      bcrypt = require('bcrypt');
      saltRounds = 10;



// create new app instant using express
const app = express();

// set template engine to ejs
app.set( 'view engine', 'ejs' );

// use bodyParser to pass the requests
app.use(bodyParser.urlencoded({
  extended: true
}));

// use public directory to store static files like images
app.use(express.static( 'public' ));

// if no DB of name already exist, create DB & connect to it
// if exist connect to the DB
mongoose.connect( 'mongodb://localhost:27017/userDB', {
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
// userSchema.plugin( encrypt, {secret: process.env.SECRET, encryptedFields: ['password']} );





// create mongoose model/collection based on the schema
const User = new mongoose.model( 'User', userSchema );


app.post('/register', function( req, res ){

  // bcrypt hash function, cb function hash is the pwd hashed
  bcrypt.hash(req.body.password, saltRounds, function( err, hash ){
    const newUser = new User({
      email: req.body.username,
      password: hash
    });

    newUser.save(function( err ){
      if( err ){
        console.log( err );
      } else {
        res.render( 'secrets' );
      }
    });
  });


});

app.post( '/login', function( req, res ){
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email:username}, function( err, foundUser ){

    if( err ){
      console.log( err );
    } else {

      if(foundUser){
        // use bcrypt compare function to compare hash with plain text pwd
        bcrypt.compare( password, foundUser.password, function( err, result ){
          // if result is true render secrets page 
          if( result ){
            res.render( 'secrets' );
          }

        });


      }
    }
  });
});






app.get( '/', function( req, res ){
  res.render( 'home' );
});

app.get( '/login', function( req, res ){
  res.render( 'login' );
});


app.get( '/register', function( req, res ){
  res.render( 'register' );
});






// connect to port 3000
app.listen(3000, function() {
  console.log('Server started on port 3000');
});
