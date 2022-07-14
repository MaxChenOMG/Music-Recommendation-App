// ---------------- Import libraries ---------------- 
const express = require('express');
const morgan = require('morgan');
const SpotifyWebApi = require('spotify-web-api-node');
const request = require('request');
const mongoose = require('mongoose');
const fetch = require('node-fetch');

// ---------------- Express app setup ---------------- 
const app = express();

// register view engine
app.set('view engine', 'ejs');

// middleware & static files
app.use(express.static('public'));
app.use(express.urlencoded());
app.use(morgan('dev'));

app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

// ---------------- Database setup ---------------- 
// Mongoose set up
const dbURI = 'mongodb+srv://hongwang:dbpassword@cluster0.itka7.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => {
    console.log('connected to db')
    // listen for requests
    app.listen(3000);
  });

// Creating a schema
var userProfileSchema = new mongoose.Schema({
  name: String,
  email: String,
  gender: String,
  location: String
});
const Profile = mongoose.model("Profile", userProfileSchema)

// ---------------- Spotify API setup ---------------- 
var clientId = 'c15012c390844d33b110be5be7424d81';
var clientSecret = '1e7e774fc72e4ad29b2b7ede7ef47326';
var redirectUri = 'http://localhost:3000/callback';

// Spotify API Wrapper
var spotifyApi = new SpotifyWebApi({
  clientId,
  clientSecret,
  redirectUri
});

// Request for new access token
var authOptions = {
  url: 'https://accounts.spotify.com/api/token',
  headers: {
    'Authorization': 'Basic ' + (new Buffer(clientId + ':' + clientSecret).toString('base64'))
  },
  form: {
    grant_type: 'client_credentials'
  },
  json: true
};

request.post(authOptions, function(error, response, body) {
  if (!error && response.statusCode === 200) {
    // Set the Spotify API access token
    var accessToken = body.access_token;
    spotifyApi.setAccessToken(accessToken);
    // console.log("New token:" + accessToken);
  } else {
    console.log('Cannot get an access token. Something is wrong!')
  }
});

// ---------------- Handle HTTP requests ---------------- 
// Home page
app.get('/', (req, res) => {
  const news = [
    {title: 'Mitski announces new album \'Laurel Hell\', shares single \'The Only Heartbreaker\'',
    snippet: 'Mitski has shared details of her sixth album, ‘Laurel Hell’, alongside a music video for her new single ‘The Only Heartbreaker’.'},
    {title: 'Diana Ross to play legends slot at Glastonbury',
    snippet: 'The 77-year-old singer will take to the stage at the world-famous music festival on Sunday, June 26, as part of her Thank You UK Tour.'},
    {title: 'Alicia Keys: \'I never felt comfortable crying in front ...',
    snippet: '15-time GRAMMY® Award-winning artist and worldwide-celebrated music icon Alicia Keys has been unveiled as Marie Claire’s November cover star.'},
  ];
  res.render('index', { title: 'Home', news });
});

// Recommend page
app.get('/recommend', (req, res) => {
  res.render('recommend', { title: 'Recommend' });
});

// Handling user's input of location
app.post('/recommend', (req, res) => {
  var city = req.body.location;
  var units = "f";

  fetch("http://api.weatherstack.com/current?access_key=835f4e42f96b1669c25b3be47e41fddd&query="+city+"&units="+units)
    .then(res => res.json())
    .then(results => {
      var temperature = results.current.temperature;
      var humidity = results.current.humidity;
      var latitude = results.location.lat;

      var genre = 'unknown';
      if (temperature < 32) {
        genre = 'freezing';
      } else if (temperature >= 32 && temperature < 50) {
        genre = 'chill';
      } else if (temperature >= 50 && temperature < 70) {
        genre = 'cool';
      } else if (temperature >= 70 && temperature < 100) {
        genre = 'warm';
      } else {
        genre = 'hot';
      }
      
      if (latitude > 0) {
        genre += ' pop';
      } else {
        genre += ' rock';
      }
    
      // Search playlists with client's data
      spotifyApi.searchPlaylists(genre, {limit: 10})
        .then(function(data) {
          found_playlists = data.body['playlists']['items'];
    
          let playlist_data = []
          for (const playlist of found_playlists) {
            playlist_name = playlist.name
            playlist_owner = playlist.owner.display_name
            playlist_url = playlist.external_urls.spotify
            playlist_data.push([playlist_name, playlist_owner, playlist_url])
          }
          
          res.render('recommend-success', { title: 'Recommend', results, spotify_data: playlist_data });
        
        }, function(err) {
          console.log('Something went wrong!', err);
        });
  })
});

// About page
app.get('/about', (req, res) => {
  res.render('about', { title: 'About' });
});

// Spotify login page
app.get('/login', (req, res) => {
  scopes = [
    'user-library-read',
  ];
  res.redirect(spotifyApi.createAuthorizeURL(scopes))
});

// Spotify user authentication callback
app.get('/callback', (req, res) => {
  const error = req.query.error;
  const code = req.query.code;

  if (error) {
    console.error('Callback Error:', error);
    res.send(`Callback Error: ${error}`);
    return;
  }

  spotifyApi
    .authorizationCodeGrant(code)
    .then(data => {
      const access_token = data.body['access_token'];
      const refresh_token = data.body['refresh_token'];
      const expires_in = data.body['expires_in'];

      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);

      console.log('access_token:', access_token);
      console.log('refresh_token:', refresh_token);

      console.log(
        `Sucessfully retreived access token. Expires in ${expires_in} s.`
      );
      res.render('login', { title: 'Login' });

      setInterval(async () => {
        const data = await spotifyApi.refreshAccessToken();
        const access_token = data.body['access_token'];

        console.log('The access token has been refreshed!');
        console.log('access_token:', access_token);
        spotifyApi.setAccessToken(access_token);
      }, expires_in / 2 * 1000);
    })
    .catch(error => {
      console.error('Error getting Tokens:', error);
      res.send(`Error getting Tokens: ${error}`);
    });
});

// Profile fill-out page
app.get('/new-profile', (req, res) => {
  res.render('new-profile', { title : 'New Profile'});
});

// Handling post request for new profile
app.post('/new-profile', (req, res) => {
  let newProfile = new Profile({
    name: req.body.name,
    email: req.body.email,
    gender: req.body.gender,
    location: req.body.location
  });
  newProfile.save();
  res.redirect('/profile');
});

// Profile page
app.get('/profile', (req, res) => {
  Profile.find()
  .then((result) => {
    res.render('profile', { title: 'Profile', profiles: result });
  })
  .catch((error) => {
    console.log(error);
  })
});

// // Handle delete profile requests
// app.delete('/profile', (req, res) => {
//   res.redirect('/profile');
// });

//info page
app.get('/info', (req, res) => {
  res.render('info', { title: 'info' });
});

// Playlist page: POST request
app.post('/playlist', (req, res) => {
  genre = req.body.genre
  // console.log('information sent from the client: ', genre);

  // Search playlists with client's data
  spotifyApi.searchPlaylists(genre, {limit: 10})
    .then(function(data) {
      found_playlists = data.body['playlists']['items'];

      let playlist_data = []
      for (const playlist of found_playlists) {
        playlist_name = playlist.name
        playlist_owner = playlist.owner.display_name
        playlist_url = playlist.external_urls.spotify
        playlist_data.push([playlist_name, playlist_owner, playlist_url])
      }
      // console.log(found_playlists)
      
      res.render('playlist', { title: 'Playlist', genre, spotify_data: playlist_data});
    
    }, function(err) {
      console.log('Something went wrong!', err);
    });
});

// 404 page: has to be at the bottom of the file, as a catch-all 
app.use((req, res) => {
  res.status(404).render('404', { title: '404' });
});
