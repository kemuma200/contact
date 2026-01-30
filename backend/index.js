require('dotenv').config();
const con = require("./conn");
const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcrypt')
const saltRounds = 12;
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const express = require("express");
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require("nodemailer");
const cookieParser = require('cookie-parser');
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
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_EMAIL,
      pass: process.env.MAIL_PASS
    },
    
});
async function receptionMail(recipient){
    mailDetails = {
        from: process.env.MAIL_EMAIL,
        to: recipient,
        subject: "CONTACT STATUS", 
        text: "Your message has been received",
        html: "<p>We will get back to you as soon as we can.</p>"
    };
    transporter.sendMail(mailDetails, function (err, info) {
      if (err) {
          console.log(err);
      } else {
          console.log('Message sent: ' + info.response);
      }
    });
}
async function infoReceived(item, subject, digits) {
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: '" Naila" process.env.MAIL_EMAIL', 
      to: item,
      subject: subject, 
      text: "Please find your verification code below",
      html: `<p>Your verification code is: <b>${digits}<b></p>`, 
    });
  }

  function sendVerification(item, hashToken){
    const mailOptions = {
        from: '" Naila" process.env.MAIL_EMAIL', 
        to: item,
        subject: 'Kindly confirm your email address',
        text: `Click on this link to verify your email: http://localhost:3000/verify?token=${hashToken}`,
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

function authenticate(req, res, next) {
  const token = req.cookies.token; 

  if (!token) {
    console.log("No token found");
    return res.sendStatus(401);
  }

  try {
    const user = jwt.verify(token, process.env.JWT);
    req.user = user;
    next();
  } catch (err) {
    console.log("JWT error:", err.message);
    return res.sendStatus(403);
  }
}

app.post('/', (req,res)=>{
  try{
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });
    con.run(`CREATE TABLE IF NOT EXISTS responses (id TEXT NOT NULL UNIQUE , name TEXT NOT NULL, email TEXT PRIMARY KEY, subject TEXT NOT NULL, message TEXT NOT NULL, date TEXT NOT NULL)`);
    con.run(`CREATE TABLE IF NOT EXISTS users (id TEXT NOT NULL UNIQUE, username TEXT NOT NULL UNIQUE, ip TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, status INTEGER NOT NULL DEFAULT 0)`)
    con.run(`CREATE TABLE IF NOT EXISTS reset (email TEXT NOT NULL UNIQUE, link TEXT NOT NULL, expiry TEXT NOT NULL )`)
    res.send("Table created") 
  }
  catch(e){
    console.log(e);
  }
})

app.post('/contactSubmission', (req,res)=>{
  const data = req.body;
  const id = 'RS' + uuidv4();
  if (data.name && data.name.replace(/\s+/g, '') === ""){
    res.status(500).send("Please submit a name")
  }
  else if (data.email && data.email.replace(/\s+/g, '') === ""){
    res.status(500).send("Please submit an email")
  }
  else if (data.subject && data.subject.replace(/\s+/g, '') === ""){
    res.status(500).send("Please submit a subject")
  }
  else if (data.message && data.message.replace(/\s+/g, '') === ""){
    res.status(500).send("Please submit a message")
  }
  else{
    //populate database
    con.run("INSERT INTO responses (id, name, email, subject, message, date) VALUES (?, ?, ?, ?, ?, ?)", [id, data.name.toLowerCase(), data.email.toLowerCase(), data.subject.toLowerCase(), data.message.toLowerCase(), new Date().toISOString()], (err,rows)=>{
      if (err) {
        console.log(err)
        return err;
      }
      console.log(rows)
      //send mail
      receptionMail(data.email)
      res.json({status: 200, message:"Sent"})
    });

    

  }
})
app.post('/checkIfEmailExists', (req,res)=>{
  console.log(req.body)
  try{
    con.get('SELECT COUNT(email) AS count FROM users WHERE email = ?', [req.body.data.toLowerCase()], function (err, row){
      if (err){
        console.log(err)
        return res.json({status:202, message:"Please try again"})
      }
      if (row.count > 0) {
        return res.json({status:400, message : 'Email exists'})
      } else {
        return res.json({status:200, message:"Available"})
      }
    })

    

  }
  catch(e){
    console.log(e)
    return res.json({status:500, message:"Please try again"})
  }

})
app.post('/checkIfUserNameExists', (req,res)=>{
  console.log(req.body)
  const data = req.body.data.toLowerCase();
  if (/[^a-zA-Z0-9]/.test(data)){
    return res.json({status: 400, message: 'Special characters are not permitted'})
  }
  try{
    con.get('SELECT COUNT(username) AS count FROM users WHERE username = ?', [data], (err, rows)=>{
      if (err){
        console.log(err)
        return res.json({status:202, message:"Please try again"})
      }
      if (rows.count > 0) {
        return res.json({status:400, message : 'Username exists'})
      } else {
        return res.json({status:200, message:"Available"})
      }
    })
  }
  catch(e){
    console.log(e)
    return res.json({status:500, message:"Please try again"})
  }
  
})
app.post('/register', async (req,res)=>{
  console.log(req.body.data)
  const token = crypto.randomBytes(32).toString('hex')
  const id = 'USR' + uuidv4()
  const email = req.body.data.email.toLowerCase()
  const name = req.body.data.username.toLowerCase()
  const password = await bcrypt.hash(req.body.data.pwd.toLowerCase(), saltRounds);
  try{
    con.run("INSERT INTO users (id, username, email, password, ip) VALUES (?,?,?,?,?)", [id, name, email, password, req.body.data.ip], (err, rows)=>{
      if (err){
        console.log(err)
        return res.json({status: 202, message:"Please try again"})
      }
      else{
        sendVerification(email, token)
        return res.json({status:200, message:"Account created"})
      }
    })
    
  }
  catch(e){
    console.log(e)
    return res.json({status: 500, message: 'Please try again'})
  }
 
})

app.post('/login', (req,res)=>{
  console.log(req.body)
  try{
    con.get("SELECT username, email, password, ip FROM users WHERE (username = ? OR email = ?)", [req.body.email.toLowerCase(), req.body.email.toLowerCase()], async (err, rows)=>{
      if (err){
        console.log(err)
        return res.json({status:200, message:"Please try again"})
      }
      if (!rows) {
        return res.json({ status: 400, message: "Invalid username or email" });
      }

      console.log('rows', rows)
      const p = await bcrypt.compare(req.body.pwd.toLowerCase(), rows.password);
      console.log(p)
      if (p){
          //json web token
        const token = jwt.sign({ ip: rows.ip, username: rows.username }, process.env.JWT,{ expiresIn: '1h' });
        res.cookie('token', token, {
          httpOnly: true,    
          secure: false,      
          sameSite: "lax",
          maxAge: 60 * 60 * 1000 ,
          path:'/'
        });
        return res.json({status:200, message:'Successful login'})
        }
        else{
          return res.json({status:400, message: 'Invalid username or email'})
        }

      
    })
    
    

  }
  catch(e){
    console.log(e)
    return res.json({status:500, message:"Please try again"})

  }

})

function checkIfActive(data){
  try{
    con.get("SELECT status as status FROM users WHERE (email = ? OR username = ?)", [data, data],
    (err, rows) => {
      if (err) {
        console.log(err);
        return;
      }
      console.log('rows', rows); 
    });
   
  }
  catch(e){
    console.log(e);
    return res.json({status:500, message:"Please try again"})
  }
}


app.post('/activate', authenticate, (req,res)=>{
  //check if details match and link hasnt expired
  con.run("UPDATE users SET verified = ? WHERE email = ?", [0, "Done", req.body.email], (err, rows)=>{
    if (err){
      console.log(err);
      return;
    }
    else{
      console.log(rows)
      return res.json({status: 200, message:'Activated'})
    }
  })

})

app.post('/areYouActive', authenticate, (req,res)=>{
  const data = req.body.data.toLowerCase()
  con.get("SELECT status as status FROM users WHERE (email = ? OR username = ?)", [data, data],
    (err, row) => {
      if (err) {
        console.log(err);
        return;
      }
      if (!row){
        res.clearCookie("token", {
          httpOnly: true,
          sameSite: "lax",
          path: "/"
        });
        return res.status(404).json({ ok: false, message: "User not found" });
      }
      console.log('rows', row); 
      res.json({message:row.status})
    });

})
app.post('/resetPwdMail', (req, res)=>{
  //check if either username or email provided is registered
  con.get("SELECT username, email WHERE (username = ? OR email = ?)", [req.body.email.toLowerCase(), req.body.email.toLowerCase()], (err, rows)=>{
    if (err){
      console.log(err)
      return;
    }
    else{
      console.log(rows)
      if (!rows.username || !rows.email){
        return res.json({status: 400, message:''})
      }
      else{
        const digits = Math.floor(100000 + Math.random() * 900000).toString()
        const inThreeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000);
        //should include link too
        infoReceived(rows.email, 'PASSWORD RESET', digits)
        //save to db
        con.run("INSERT INTO reset (email, link, expiry) VALUES (?,?,?)", [rows.email, digits.toString(), inThreeHours], (rows, err)=>{
          if (err){return err;}
          else{
            console.log(rows)
            return res.json({status: 200, message:"If an account with this email exists, a message has been sent."})
          }
        })
       
      }
    }
  })
  
})

app.post('/checkIfResetDetailsMatch', (res, req)=>{
  //check if digits and expiry match the ones stored
  const p = con.get("SELECT link FROM reset WHERE (username = ? OR email = ?)", [req.body.email.toLowerCase(), req.body.email.tolowerCase()], (rows, err)=>{
    if (err){
      console.log(err)
      return;}
    else{
      console.log(rows)
      if (Number(p.link) === req.body.verification){
        return res.json({status: 200})
      }

    }
  })
  
})

app.post('/resetPwd', async (req,res)=>{
  try{
    const pwd = await bcrypt.hash(req.body.password.toLowerCase(), saltRounds);
    con.run("UPDATE users SET password = ? WHERE email = ?", [pwd, req.body.email], (err, rows)=>{
      if (err) {
      console.error("Error updating data:", err)
      return;
      }
      else {
        console.log(`Record updated: ${this.changes} rows affected`)
        con.run("DELETE FROM reset WHERE email = ?", [req.body.email], (rows, err)=>{
          if (err){
            console.log(err)
            return;
          }
          else{
            console.log(rows)
            return res.json({status: 200, message:"Password successfully changed"})
          }
        })
       
      }
    })
  }
  catch(e){
    console.log(e);
    return res.json({status:500, message:"Please try again"})
  }
})

app.post("/getUserEmail", authenticate, (req,res)=>{
  con.get("SELECT email as email FROM users WHERE username = ?", [req.body.data.toLowerCase()], (err, row)=>{
    if (err) return err;
    console.log(row)
    return res.json({status: 200, message: row.email})
  })
})
app.post('/getUserSubmissions', authenticate, (req,res)=>{
  console.log('408', req.body.data)
  try{
  con.all("SELECT id, email, name, subject, message, date FROM responses WHERE name = ?", [req.body.data.toLowerCase()], (err, rows)=>{
    if (err){
      console.log(err)
      return;
    }
    console.log('userSubs', rows)
    return res.json({status:200, message: rows})
    
  })
  }
  catch(e){
    console.log(e)
    return res.json({status: 500, message: 'Please try again'})
  }
})
app.post('/getAllSubmissions', authenticate, (req,res)=>{
  con.all("SELECT id, email, name, subject, message, date FROM responses", (err, rows)=>{
    if (err){
      console.log(err)
      return res.status(200).send({txt:"Ooops, there seems to be an error"}); 
    }
    else {
        console.log(rows)
        return res.json({status:200, message:rows})
    }
  })

})

app.post('/deleteMyResponse', authenticate, (req, res)=>{
  con.run('DELETE FROM responses WHERE id = ? AND email = ?', [req.body.id, req.body.email], (rows, err)=>{
    if (err){
      console.log(err)
      return;
    }
    else{
      console.log(rows)
      return res.json({status: 200, message : 'Deleted successfully'})
    }
  })
})
app.post('/resetEmail', authenticate, (req, res)=>{
  con.run('UPDATE users SET email = ?, status = ? WHERE username = ?', [req.body.email, 0, req.body.username], (rows, err)=>{
    if (err){return err;}
    else{
      console.log(rows)
       //send Verification
      const token = crypto.randomBytes(32).toString('hex')
      sendVerification(req.body.email, token)
    }
  })
 

})
app.post('/resetUsername', authenticate, (req, res)=>{
  con.run('UPDATE users SET username = ? WHERE email = ?', [req.body.username, req.body.username], (err, rows)=>{
    if (err) return err;
    else{
      //sent confirmation mail
      console.log(rows)
      return res.json({status:200, message:"Username changed successfully."})
    }
  })
  
})
app.get('/auth', authenticate, (req, res) => {
  res.json({
    authenticated: true,
    user: {
      ip: req.user.ip,
      username: req.user.username
    }
  });
});




app.listen(port, (req,res)=>{
    console.log(`Running at port ${port}`)
})