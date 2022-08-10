// --- IMPORTS ---
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

// --- SERVER ---
// Start the server running with port as env variable
const app = express();
const port = process.env.PORT || 4040;
app.listen(port, () => {
  console.log('****************************');
  console.log(`Server running on port: ${port}`);
});

// --- MIDDLEWARE SESSION ---
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- RENDER ---
// Login page
app.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname, './views/index.html'));
});

// Management page
app.get('/management', async (req, res) => {
  if (req.session.loggedin) {
    return res.sendFile(path.join(__dirname, './views/management.html'));
  } else {
    res.send('Please login to enter the management page.');
    console.log('****************************');
    console.log('-- Non authorized request --');
  }
  res.end();
});

// Set the 'public' folder as default render
app.use(express.static(path.join(__dirname, 'public')));

// --- DB CONNECTION ---
// Set the MongoDB credentials
var db_user = process.env.DB_USER;
var db_password = process.env.DB_PASSWORD;
var db_cluster = process.env.DB_CLUSTER;
var db_schema = process.env.DB_SCHEMA;

// Use the credentials to connect to the DB
mongoose.connect(
  `mongodb+srv://${db_user}:${db_password}@${db_cluster}.lbzvr.mongodb.net/${db_schema}?retryWrites=true&w=majority`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

// Check the connection status
const cxn = mongoose.connection;
cxn.on(
  'error',
  console.error.bind(console, 'There was an error connecting to the DB: ')
);
cxn.once('open', () => {
  console.log('**************************');
  console.log('Connected to the Database');
});

// Creation of Mongoose Schema and Model for users
var userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

var userModel = mongoose.model('User', userSchema);

// --- LOGIN ROUTE ---
app.post('/login', async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  if (username && password) {
    userModel.findOne(
      { username: username, password: password },
      (error, data) => {
        if (error) throw error;
        data = data || 0;
        if (data != 0) {
          req.session.loggedin = true;
          req.session.username = username;
          res.redirect('/management');
          console.log('******************');
          console.log('Login successfully');
          console.log('------------------');
        } else {
          res.send('The username or the password is wrong');
          console.log('***************');
          console.log('Login failed');
          console.log('---------------');
        }
        res.end();
      }
    );
  } else {
    res.send('Please enter the username and password');
    res.end();
  }
});

// --- CREATE ROUTE ---
app.post('/create', async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  if (username && password) {
    let user = new userModel({
      username: username,
      password: password
    });
    user.save((error, data) => {
      if (error) throw error;
      req.session.loggedin = true;
      req.session.username = username;
      res.redirect('/management');
      console.log('User created successfully');
      console.log(data);
      console.log('-------------------------');
      res.end();
    });
  } else {
    res.send('Please enter the username and password for the new user');
    res.end();
  }
});

// --- RESET ROUTE ---
app.post('/reset', async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  if (username && password) {
    userModel.updateMany(
      { username: username },
      { $set: { password: password } },
      (error, data) => {
        if (error) throw error;
        let { modifiedCount } = data;
        req.session.loggedin = true;
        req.session.username = username;
        res.redirect('/management');
        console.log(`${modifiedCount} users updated`);
        console.log('------------------');
        res.end();
      }
    );
  } else {
    res.send('Please enter the username and the new password');
    res.end();
  }
});

// --- DELETE ROUTE ---
app.post('/delete', async (req, res) => {
  let username = req.body.username;
  if (username) {
    userModel.deleteMany({ username: username }, (error, data) => {
      if (error) throw error;
      let { deletedCount } = data;
      req.session.loggedin = true;
      req.session.username = username;
      res.redirect('/management');
      console.log(`${deletedCount} users deleted`);
      console.log('------------------');
      res.end();
    });
  } else {
    res.send('Please enter the user to delete');
    res.end();
  }
});
