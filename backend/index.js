const con = require("./conn");
const crypto = require("crypto-js");
const express = require("express");
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require("nodemailer");
const port = 4000;
let p, q;


function closing(){
  // close the database connection
    con.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Close the database connection.');
  });
}

app.use(bodyParser.json());
const corsOptions = {
    origin: 'http://localhost:3001'
  };
  
app.use(cors(corsOptions));
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
        user: process.env.email,
        pass: process.env.pwd
    }
});

async function infoReceived(item) {
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: '" Naila" <xorewon641@cohodl.com>', 
      to: item,
      subject: "CONTACT STATUS", 
      text: "Your message has been received",
      html: "<b>We will get back to you as soon as we can.</b>", 
    });
  }

  function sendVerification(item, hashToken){
    const mailOptions = {
        from: '" Naila" <xorewon641@cohodl.com>', 
        to: item,
        subject: 'Kindly confirm your email address',
        text: `Click on this link to verify your email: http://<website.com>/verify?token=${hashToken}`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          console.log(error);
          // res.status(500).send('Error sending verification email.');
      } else {
          console.log('Email sent: ' + info.response);
          // res.send('Verification email sent.');
      }
  });
}


app.get('/', (req,res)=>{
  try{
    con.all(`CREATE TABLE IF NOT EXISTS users (NAME TEXT, EMAIL TEXT UNIQUE PRIMARY KEY, SUBJECT TEXT, MESSAGE TEXT, STATUS INTEGER, VERLINK TEXT)`);
    res.send("Table created") 
  }
  catch(e){
    console.log(e);
  }
})

app.post('/contactSubmission', (req,res)=>{
  const data = req.body;
  console.log(req.body);
  const token = crypto.lib.WordArray.random(128);
  const hashToken = String(crypto.MD5(token));
  // const hashToken = crypto.pbkdf2Sync(token, salt,  
  //     1000, 64, `sha512`).toString(`hex`); 
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
    con.all("INSERT INTO users (name, email, subject, message, status, verlink) VALUES (?, ?, ?, ?, ?, ?)", [data.name, data.email, data.subject, data.message, 0, hashToken]);
    //send mail
    // sendVerification(data.email, token);
  //   res.status(200).send({message: "Verify your account by visiting your email",
  // token: token})
    res.send({status: 200, message:"Success"})

  }
})
app.get('/checkIfPresent', (req,res)=>{
  try{
    con.all('SELECT COUNT(email) FROM users WHERE email = ?', [data], (err, rows)=>{
      if (rows.length > 0){
        res.send({message: "It seems like we have your submission already"})
      }
      else{
        res.send({message: "Success"})
      }
    })
  }
  catch(e){
    console.log(e);
  }

})
function checkIfActive(){
  try{
    p = con.get("SELECT status FROM users WHERE email = ?", [req.email], (err, rows)=>{
      console.log(rows);
    })
    return p;
  }
  catch(e){
    console.log(e);
  }
}

app.post('/resetPwd', (req,res)=>{
  try{
    con.all("UPDATE users SET email = ? WHERE id = ?", [req.data, 2], (err)=>{
      if (err) {
      console.error("Error updating data:", err)
      }
      else {
        console.log(`Record updated: ${this.changes} rows affected`)
      }
    })
  }
  catch(e){
    console.log(e);
  }
})
app.post('/informingMail', (req,res)=>{
  console.log(req.body)
  infoReceived(req.body.email)

})

function changeStatus(req){
  con.all(`UPDATE users SET status = ?, verlink = ?, WHERE email = ?`, [true, "Done", req.email], (err)=>{
    if (err){
      console.log(err);
    }
  })
}

app.get('/checkSubmissions', (req,res)=>{
  con.all("SELECT * FROM users", (err, rows)=>{
    if (err){
      res.status(200).send({txt:"Ooops, there seems to be an error"});
      console.log(error)
    }
    else {
        q = rows.length;
        res.send({status:200, txt:{rows}, size: q})
    }
  })

})



app.listen(port, (req,res)=>{
    console.log(`Running at port ${port}`)
})