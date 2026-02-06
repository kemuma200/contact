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
const now = new Date()
// const port = process.env.PORT || 4000;
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
  origin: process.env.FRONTEND,
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
    connectionTimeout: 10000,
    
});
async function receptionMail(recipient, subject, text, message, link){
    mailDetails = {
        from: process.env.MAIL_EMAIL,
        to: recipient,
        subject: subject, 
        text: text,
        html: `<p>${text}<p><br/><br/><p>${message}</p> <br/><br/> <a href=${link}>Back to submission page</a>`
    };
    transporter.sendMail(mailDetails, function (err, info) {
      if (err) {
          console.log(err);
      } else {
          console.log('Message sent: ' + info.response);
      }
    });
}
async function infoReceived(item, subject, text, digits, link, field, name) {
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: '" Naila" process.env.MAIL_EMAIL', 
      to: item,
      subject: subject, 
      text: text,
      html: `<div>
      <p>Hi ${name}</p>
      <p>${text}</p>
      <br/>
      <p>Please find your verification code below</p><br/> <br/>
      <p>Your verification code is: <b>${digits}<b></p><br/><br/>
      <a href=${link}>Change your ${field} <a></div>`, 
    });
  }

  function sendVerification(item, hashToken, name){
    const mailOptions = {
        from: `Naila ${process.env.MAIL_EMAIL}`, 
        to: item,
        subject: 'ACCOUNT ACTIVATION',
        text: `Hi ${name},\n\n kindly click on the link below to verify your email: ${process.env.FRONTEND}/verify?token=${hashToken}&username=${name}`,
        html: `
            <div>
                <p>Hi ${name},</p><br/>
                <p>Kindly click on the link below to verify your email</p>
                <a href="${process.env.FRONTEND}/verify?token=${hashToken}&username=${item}">Verify Account</a>
                <br/><br/>
                <p>Kind regards</p>
            </div>
        `
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
    con.run(`CREATE TABLE IF NOT EXISTS reset (email TEXT NOT NULL, field TEXT NOT NULL, link TEXT NOT NULL, code TEXT NOT NULL DEFAULT 0, expiry TEXT NOT NULL )`)
    res.send("Table created") 
  }
  catch(e){
    console.log(e);
  }
})

app.post('/contactSubmission', (req,res)=>{
  if (!req.body.data.name || !req.body.data.email || !req.body.data.subject || !req.body.data.message) return;
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
      receptionMail(data.email, 'CONTACT STATUS', 'Your response has been received. Thank you for taking the time to reach out', 'We will respond as soon as we can.', `${process.env.FRONTEND}/`)
      res.json({status: 200, message:"Sent"})
    });

    

  }
})
app.post('/checkIfEmailExists', (req,res)=>{
  console.log(req.body)
  if (!req.body.data) return;
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
  if (!req.body.data) return;
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
        return res.json({status:400, message : 'Username not available'})
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
  if (!req.body.data.email || !req.body.data.username || !req.body.data.pwd || !req.body.data.ip) return;
  console.log(req.body.data)
  const token = crypto.randomBytes(32).toString('hex')
  const id = 'USR' + uuidv4()
  const email = req.body.data.email.toLowerCase()
  const name = req.body.data.username.toLowerCase()
  const password = await bcrypt.hash(req.body.data.pwd.toLowerCase(), saltRounds);
  const inThreeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  console.log("Here")
  try{
    con.run("INSERT INTO users (id, username, email, password, ip) VALUES (?,?,?,?,?)", [id, name, email, password, req.body.data.ip], (err, rows)=>{
      if (err){
        console.log(err)
        return res.json({status: 202, message:"Please try again"})
      }
      else{
        //save details to database
        console.log('registration')
        console.log(token)
        //check if alternative link exists and delete it
        con.run("DELETE FROM reset WHERE email = ? AND field = ?", [req.body.data.email.toLowerCase(), 'emailValidation'], (err, row)=>{
          if (err) return err;
        })
        con.run("INSERT INTO reset (email, field, link, expiry) VALUES (?,?,?,?)", [req.body.data.email.toLowerCase(), 'emailValidation', token, inThreeHours], (err, row)=>{
        if (err) return err;
        console.log(row)
        sendVerification(email, token, name)
        return res.json({status:200, message:"Account created"})
       })
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
  if (!req.body.email) return;
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
  if (!data) return;
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


app.post('/activate', (req,res)=>{
  //check if details match and link hasnt expired
  console.log(req.body)
  if (!req.body.email) return;
  con.get('SELECT link AS link, expiry AS expiry FROM reset WHERE email = ? AND field = ?', [req.body.email.toLowerCase(), 'emailValidation'], (err, row)=>{
    if (err) return err;
    if (!row) return res.json({status:500, message: 'Invalid'})
    if (!row.link || (row.expiry < Date.now())) return res.json({status:400, message:'Link expired'})
    if (row.link !== req.body.token) return res.json({status: 500, message:"Page does not exist"});
    con.run("UPDATE users SET status = ? WHERE email = ?", [1, req.body.email.toLowerCase()], (err, rows)=>{
      if (err) return err;
      console.log(this)
      return res.json({status: 200, message:'Activated'})
    
    })
  })
 

})
app.post("/requestForEmailValidationLink", authenticate, (req,res)=>{
  if (!req.body.email || !req.body.name) return;
  const token = crypto.randomBytes(32).toString('hex')
  const inThreeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const email = req.body.email.toLowerCase()
  const name = req.body.name.toLowerCase()

  con.run("DELETE FROM reset WHERE email = ? AND field = ?", [email, 'emailValidation'], (err, row)=>{
    if (err) return err;
    //update reset table
    con.run("INSERT INTO reset (email, field, link, expiry) VALUES (?,?,?,?)", [email, 'emailValidation', token, inThreeHours], (err, row)=>{
      if (err) return err;
      console.log(row)
      sendVerification(email, token, name)
      return res.json({status:200, message:"A validation link has been sent to your email"})
      })
  })

})

app.post('/areYouActive', authenticate, (req,res)=>{
  if (!req.body.data) return;
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
app.post('/changeUserDetails', authenticate, (req,res)=>{
  if (!req.body.data.user) return;
  const digits = Math.floor(100000 + Math.random() * 900000).toString()
  const inThreeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const tokenT = crypto.randomBytes(32).toString("hex");
  console.log(380, req.body)
  if (req.body.data.field === 'username'){
    con.get('SELECT username as username  FROM users WHERE email = ?', [req.body.data.user.toLowerCase()], (err, row)=>{
      if (err){
        console.log(err)
        return;
      }
      if (!row) return res.json({status: 404, message:"Non-existent user"})
      const userName = row.username
      //save to db
      con.run("INSERT INTO reset (email, field, link, code, expiry) VALUES (?,?,?,?,?)", [req.body.data.user.toLowerCase(), req.body.data.field.toLowerCase(), tokenT, digits.toString(), inThreeHours], (err, row)=>{
        if (err){
          console.log(err)
          return;
        }
        //send reset email
        infoReceived(req.body.data.user.toLowerCase(), 'CHANGE USER DETAILS', `We have received a request to change your ${req.body.data.field}. If you did not send the request, kindly ignore.`, digits, `${process.env.FRONTEND}/changeUserDetails?token=${tokenT}&field=${req.body.data.field.toLowerCase()}&username=${encodeURIComponent(req.body.data.user.toLowerCase())}`, req.body.data.field, userName)
        res.json({status:200, message:"Please refer to the email sent to continue."})
      })
      
    })
  }
  else{
    con.get('SELECT email as email FROM users WHERE username = ?', [req.body.data.user.toLowerCase()], (err, row)=>{
      if (err){
        console.log(err)
        return;
      }
      if (!row) return res.json({status: 400, message:"Please enter a valid username"})
      console.log(row?.email)
      const userEmail = row?.email
      //save to db
      con.run("INSERT INTO reset (email, field, link, code, expiry) VALUES (?,?,?,?,?)", [userEmail, req.body.data.field.toLowerCase(), tokenT, digits.toString(), inThreeHours], (err, row)=>{
        if (err){
          console.log(err)
          return;
        }
       //send reset email
        infoReceived(userEmail, 'CHANGE USER DETAILS', `We have received a request to change your ${req.body.data.field}. If you did not send the request, kindly ignore.`, digits, `${process.env.FRONTEND}/changeUserDetails?field=${req.body.data.field.toLowerCase()}&token=${tokenT}&username=${encodeURIComponent(userEmail)}`, req.body.data.field, req.body.data.user.toLowerCase())
        res.json({status:200, message:"Please check your email"})
      })
      

    })
  }

})
app.post('/resetPwdMail', (req, res)=>{
  console.log(req.body)
  if (!req.body.email) return;
  const tokenT = crypto.randomBytes(32).toString("hex");
  const field = 'password';
  //check if either username or email provided is registered
  con.get("SELECT email AS email, username as name FROM users WHERE email = ?", [req.body.email.toLowerCase()], (err, rows)=>{
    if (err){
      console.log(err)
      return;
    }
    if (!rows) return res.json({status: 404, message:"User not found"})
    console.log(rows)
    const _user = rows?.name
    if (!rows?.email){
      return res.json({status: 400, message:'Email not registered'})
    }
    else{
      const digits = Math.floor(100000 + Math.random() * 900000).toString()
      const inThreeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      //save to db
      con.run("INSERT INTO reset (email, field, link, code, expiry) VALUES (?,?,?,?,?)", [rows.email, field, tokenT, digits.toString(), inThreeHours], (err, row)=>{
        if (err){return err;}
        console.log(row)
        infoReceived(req.body.email.toLowerCase(), 'PASSWORD RESET', 'We have received a request to change your password. If you did not send the request, kindly ignore.', digits, `${process.env.FRONTEND}/changeUserDetails?token=${tokenT}&field=${field.toLowerCase()}&username=${encodeURIComponent(req.body.email.toLowerCase())}`, field, _user)
        return res.json({status: 200, message:"If an account with this email exists, a reset email has been sent."})
        
      })
      
    }
    
  })
  
})
app.post('/verifyLink', (req,res)=>{
  console.log('verifyLink', req.body)
  if (!req.body.email || !req.body.field || !req.body.token) return;
  con.get("SELECT link AS link, expiry as expiry FROM reset WHERE (email = ? AND field = ?)", [req.body.email.toLowerCase(), req.body.field.toLowerCase()], (err, row)=>{
    if (err) return err;
    console.log("Here")
    console.log(row)
    if (!row) return res.json({status: 400, message:'Page does not exist'})
    console.log(row.link)
    console.log(req.body.token === row.link)
    console.log(Date.now() >  row.expiry)
    if (req.body.token.toLowerCase() === row.link && Date.now() >  row.expiry){
      return res.json({status:202, message:'Expired link.' })
    }
    console.log(req.body.token === row.link)
    console.log(Date.now() <  row.expiry)
    if (req.body.token.toLowerCase() === row.link && Date.now() <  row.expiry){
      console.log("Good")
      return res.json({status:200, message:'Valid' })
    }
  } )
})
app.post('/verifyCode', (req,res)=>{
  console.log('verifyCode', req.body)
  if (!req.body.data.email || !req.body.data.field || !req.body.data.code) return;
  con.get("SELECT code AS code, expiry as expiry FROM reset  WHERE (email = ? AND field = ?)", [req.body.data.email.toLowerCase(), req.body.data.field.toLowerCase()], (err, row)=>{
    if (err) return err;
    if (!row) return res.json({status: 400, message:'Invalid code'})
    if (req.body.data. code.toString() === row.code && Date.now() >  row.expiry){
      return res.json({status:202, message:'Expired link. Request for a new one' })
    }
    if (req.body.data.code.toString() === row.code && Date.now() <  row.expiry){
      return res.json({status:200, message:'Valid' })
    }
  } )
})

app.post('/resetPwd', async (req,res)=>{
  console.log(req.body)
  if (!req.body.data.username || !req.body.data.email || !req.body.data.code || !req.body.data.field) return;
  console.log(1)
  const pwd = await bcrypt.hash(req.body.data.username.toLowerCase(), saltRounds);
  try{
    console.log(2)
    //check Code match
    con.get("SELECT code AS code FROM reset WHERE email = ? AND field = ?", [req.body.data.email.toLowerCase(), req.body.data.field.toLowerCase()], (err, row)=>{
      if (err) return err;
      console.log(row)
      console.log(3)
      if (!row || row.code !== req.body.data.code.toString()) return res.json({status:202, message:"Code mismatch"});

      //check if new pwd is equal to old pwd
      con.get('SELECT password AS pwd FROM users WHERE email = ?', [req.body.data.email.toLowerCase()], (err, row)=>{
        if (err){
          console.log(err)
          return res.json({status: 404, message:"Please try again"})
        }
        if (row.pwd === pwd) return res.json({status: 400, message:'The new password must be different from the old password'})
        con.run("UPDATE users SET password = ? WHERE email = ?", [pwd, req.body.data.email.toLowerCase()], (err, rows)=>{
      if (err) {
      console.error("Error updating data:", err)
      return res.json({status:202, message: 'Please try again'});
      }
      console.log(4)
      console.log(`Record updated: ${this}`)
      con.run("DELETE FROM reset WHERE email = ? AND field = ?", [req.body.data.email.toLowerCase(), 'password'], (rows, err)=>{
        if (err){
          console.log(err)
          return;
        }
        console.log(5)
       
        console.log(rows)
        //password reset mail
        receptionMail(req.body.data.email.toLowerCase(), 'SUCCESSFUL PASSWORD RESET', 'You have successfully changed your password', 'Kind Regards', `${process.env.FRONTEND}/`)
        return res.json({status: 200, message:"Password successfully changed"})
        
      })
       

        })
      })
     

    })
    
  }
  catch(e){
    console.log(e);
    return res.json({status:500, message:"Please try again"})
  }
})

app.post("/getUserEmail", authenticate, (req,res)=>{
  if (!req.body.data) return;
  con.get("SELECT email as email FROM users WHERE username = ?", [req.body.data.toLowerCase()], (err, row)=>{
    if (err) return err;
    console.log(row)
    return res.json({status: 200, message: row?.email})
  })
})
app.post('/getUserSubmissions', authenticate, (req,res)=>{
  console.log('408', req.body.data)
  if (!req.body.data) return;
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
  con.run('DELETE FROM responses WHERE id = ? AND name = ?', [req.body.id, req.body.name.toLowerCase()], (rows, err)=>{
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
app.post('/resetEmail', (req, res)=>{
  console.log('resetEmail', req.body)
  if (!req.body.data.email || !req.body.data.username) return;
  //confirm code matches
  con.get("SELECT code AS code FROM reset WHERE email = ? AND field = ?", [req.body.data.email.toLowerCase(), req.body.data.field.toLowerCase()], (err, row)=>{
    if (err) return err;
    if (!row || row.code !== req.body.data.code.toString()) return res.json({status:500, message:'The code does not exist'});
    if (req.body.data.email.toLowerCase() === req.body.data.username.toLowerCase()) return res.json({status: 400, message:'The new email must be different from the old email'})
    con.run('UPDATE users SET email = ?, status = ? WHERE email = ?', [req.body.data.username.toLowerCase(), 0, req.body.data.email.toLowerCase()], (err)=>{
    if (err){
      console.log(err)
      return res.json({status: 400, message: 'Update failed'})
    };
    
    console.log('Rows changed:', this.changes);
    con.run('DELETE FROM reset WHERE email = ? AND field = ?', [req.body.data.email.toLowerCase(), req.body.data.field.toLowerCase()], (err)=>{
      if (err) return err;
      //send informative email
      receptionMail(req.body.data.email.toLowerCase(), 'SUCCESSFUL EMAIL RESET', 'This email has successfully been removed from your account', 'Kind Regards.', `${process.env.FRONTEND}/`)
      receptionMail(req.body.data.username.toLowerCase(), 'KARIBU',  `Email changed from ${req.body.data.email} to ${req.body.data.username}. We're happy to have you`, 'Kind Regards.', `${process.env.FRONTEND}/`)
      //send email verification mail and add to db
      const token = crypto.randomBytes(32).toString('hex')
      const name = req.body.data.username.toLowerCase()
      const inThreeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      con.run("INSERT INTO reset (email, field, link, expiry) VALUES (?,?,?,?)", [req.body.data.username.toLowerCase(), 'emailValidation', token, inThreeHours], (err, row)=>{
      if (err) return err;
      sendVerification(req.body.data.username.toLowerCase(), token, req.body.data.username.toLowerCase())
      return res.json({status:200, message:"Email reset successfully. A validation link has been sent to your new email"})
      })
    })
    
    })
  })    
  })
  
app.post('/resetUsername', (req, res)=>{
  console.log("ResetUserName", req.body.data)
  if (!req.body.data.email || !req.body.data.username) return;
  con.get("SELECT code AS code FROM reset WHERE email = ? AND field = ?", [req.body.data.email.toLowerCase(), req.body.data.field.toLowerCase()], (err, row)=>{
    if (err) return err;
    if (!row || row.code !== req.body.data.code.toString()) return res.json({status: 500, message:"Code does not exist"});
    //check if prev username is equal to current username
    con.run('SELECT username as username FROM users WHERE email = ?', [req.body.data.email.toLowerCase()], (err)=>{
      if (err) {
        console.log(err)
        return res.json({status: 400, message:'Please try again'})
      }
      const _username = row.username
      if (_username === req.body.data.username.toLowerCase()) return res.json({status: 400, message:'The new username must be different from the old username'});
      con.run('UPDATE users SET username = ? WHERE email = ?', [req.body.data.username.toLowerCase(), req.body.data.email.toLowerCase()], (err)=>{
      if (err) return err;
      console.log('Rows changed:', this.changes);
    
      //delete record from reset table
      con.run('DELETE FROM reset WHERE email = ? AND field = ?', [req.body.data.email.toLowerCase(), 'email'], (err, rows)=>{
        if (err) return err;
        //send informative email
        receptionMail(req.body.data.email.toLowerCase(), 'SUCCESSFUL USERNAME RESET', 'Your have successfully changed your username', 'Kind Regards', `${process.env.FRONTEND}/`)
        return res.json({status:200, message:"Username reset successfully"})
      })
    
    })
    })
    
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


//module.exports = app 

app.listen(port, (req,res)=>{
    console.log(`Running at port ${port}`)
})