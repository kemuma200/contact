const con = require("./conn");
const express = require("express");
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require("nodemailer");
const port = 4000;


app.use(bodyParser.json());
const corsOptions = {
    origin: 'http://localhost:3000'
  };
  
app.use(cors(corsOptions));
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: process.env.email,
        pass: process.env.pwd
    }
});

async function sendMail(item) {
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: '" Naila" <xorewon641@cohodl.com>', 
      to: item,
      subject: "CONTACT STATUS", 
      text: "Your contact information has been received",
      html: "<b>Thank you for submitting.</b>", 
    });
  }

//create database
app.get('/', (req,res)=>{
    try{
        con.promise().query("CREATE DATABASE IF NOT EXISTS contacts");
        res.send("Database created");
      } catch (e){
        console.log(e);
      } 
})

app.get('/createTable', (req,res)=>{
    try{
        con.promise().query("CREATE TABLE IF NOT EXISTS users (pos INT NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL,  subject VARCHAR(255) NOT NULL, message TEXT)");
        res.send("Table created");
      } catch (e){
        console.log(e);
      } 
})

app.post('/contactSubmission', (req,res)=>{
    console.log(req.body);
    const data = req.body;
    if (data.name && data.name === ""){
      res.status(500).send("Please submit a name")
    }
    else if (data.email && data.email === ""){
      res.status(500).send("Please submit an email")
    }
    else if (data.subject && data.subject === ""){
      res.status(500).send("Please submit a subject")
    }
    else if (data.message && data.message === ""){
      res.status(500).send("Please submit a message")
    }
    else{
      //populate database
      con.promise().query("INSERT INTO users (name, email, subject, message) VALUES (?,?,?,?)", [data.name, data.email, data.subject, data.message]);
      //send mail
      sendMail(data.email);
      res.status(200).send("The information has been received")

    }

})
app.get('/getSubmissions', (req,res)=>{
    try{
        con.promise().query("SELECT name, email, subject, message FROM users");
        res.status(200).send("The information has been received")
    }
    catch (e){
      res.status(500).send("An error has occured. Kindly retry.")
      console.log(e);
    } 

})


app.listen(port, (req,res)=>{
    console.log(`Running at port ${port}`)
})