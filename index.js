// Libraries
const express = require('express');
const session = require('express-session');
const mysql = require('mysql');
const path = require('path');
const getenv = require('getenv');

// Start the server, running on port 2020
const app = express();
const port = process.env.PORT || 2020;
app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});

// Render HTML pages
app.get('/', function(req,res){
    console.log(req);
    res.sendFile(path.join(__dirname,'./views/index.html'));
});

app.get('/management', function(req,res){
    console.log(req);
    res.sendFile(path.join(__dirname,'./views/management.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

// Connection to the DB
var cxn = mysql.createConnection({
    host: getenv('DB_HOST'),
    user: getenv('DB_USER'),
    password: getenv('DB_PASSWORD')
});

app.post('/login', function(req, res) {
	let username = req.body.username;
	let password = req.body.password;
	if (username && password) {
		cxn.query('SELECT * FROM login.users WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (error) throw error;

			if (results.length == 1) {
				req.session.loggedin = true;
				req.session.username = username;
				res.redirect('/management');
            }
            else {
				res.send('Login failed');
			}			
			res.end();
		});
	}
    else {
		res.send('Please enter Username and Password');
		res.end();
	}
});
  
// cxn.connect(function(err) {
//     if (err) throw err;
//     console.log("Connected to the Database");
// });