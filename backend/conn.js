//const mysql = require('mysql2');
const sqlite3 = require('sqlite3').verbose();
const dotenv = require("dotenv");
dotenv.config();
let con = new sqlite3.Database('Submissions', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
});



// const con = mysql.createConnection({
//   host: process.env.HOST,
//   user: process.env.USER,
//   database: process.env.DATABASE,
//   password: process.env.PASSWORD
// });

module.exports = con;