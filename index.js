// --- IMPORTS ---
const express = require('express');
const session = require('express-session');
const mysql = require('mysql');
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
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- RENDER ---
// Login page
app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname,'./views/index.html'));
});

// Management page
app.get('/management', (req,res) => {
	if (req.session.loggedin) {
		console.log('******************');
		console.log('Login successfully');
		return res.sendFile(path.join(__dirname,'./views/management.html'));
	}
	else {
		res.send('Please login to enter the management page.');
		console.log('****************************');
		console.log('-- Non authorized request --');
	}
	res.end();
});

// Set the 'public' folder as default render
app.use(express.static(path.join(__dirname, 'public')));

// --- DB CONNECTION ---
// Set the MySQL connection with the credentials
const cxn = mysql.createConnection({
    host: process.env.DB_HOST,
	database: process.env.DB_SCHEMA,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

// Test the connection
cxn.connect(function(err) {
    if (err) throw err;
	console.log('**************************');
    console.log("Connected to the Database");
});

// --- LOGIN ROUTE ---
app.post('/login', (req, res) => {
	console.log(req.body);
	let username = req.body.username;
	let password = req.body.password;
	if (username && password) {
		cxn.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (error, results) => {
			if (error) throw error;

			if (results.length == 1) {
				req.session.loggedin = true;
				req.session.username = username;
				res.redirect('/management');
            }
            else {
				res.send('Login failed');
				console.log('***************');
				console.log('Login failed')
			}			
			res.end();
		});
	}
    else {
		res.send('Please enter the Username and Password');
		res.end();
	}
});

// --- CREATE ROUTE ---
app.post('/create', (req, res) => {
	console.log(req.body);
	let username = req.body.username;
	let password = req.body.password;
	if (username && password) {
		cxn.query('INSERT INTO users(username, password) VALUES(?, ?)', [username, password], (error, results) => {
			if (error) throw error;

			if (results) {
				req.session.loggedin = true;
				req.session.username = username;
				res.redirect('/management');
				console.log('User created successfully');
            }
            else {
				res.send('Failed to create, something happened in DB');
				console.log('***************');
				console.log('Failed to create');
			}			
			res.end();
		});
	}
    else {
		res.send('Please enter the Username and Password for the new user');
		res.end();
	}
});

// --- RESET ROUTE ---
app.post('/reset', (req, res) => {
	console.log(req.body);
	let username = req.body.username;
	let password = req.body.password;
	if (username && password) {
		cxn.query('UPDATE users SET password = ? WHERE username = ?', [password, username], (error, results) => {
			if (error) throw error;

			if (results) {
				req.session.loggedin = true;
				req.session.username = username;
				res.redirect('/management');
				console.log('Password reset successfully');
            }
            else {
				res.send('Failed to reset, something happened in DB');
				console.log('***************');
				console.log('Failed to reset');
			}			
			res.end();
		});
	}
    else {
		res.send('Please enter the Username and the new Password');
		res.end();
	}
});

// --- DELETE ROUTE ---
app.post('/delete', (req, res) => {
	console.log(req.body);
	let username = req.body.username;
	if (username) {
		cxn.query('DELETE FROM users WHERE username = ?', [username], (error, results) => {
			if (error) throw error;

			if (results) {
				req.session.loggedin = true;
				req.session.username = username;
				res.redirect('/management');
				console.log('User deleted successfully');
            }
            else {
				res.send('Failed to delete, something happened in DB');
				console.log('***************');
				console.log('Failed to delete');
			}			
			res.end();
		});
	}
    else {
		res.send('Please enter the user to delete');
		res.end();
	}
});