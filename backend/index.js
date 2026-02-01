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
const port = process.env.PORT || 4000;
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
async function receptionMail(recipient, subject, text, message){
    mailDetails = {
        from: process.env.MAIL_EMAIL,
        to: recipient,
        subject: subject, 
        text: text,
        html: `<p>${message}</p>`
    };
    transporter.sendMail(mailDetails, function (err, info) {
      if (err) {
          console.log(err);
      } else {
          console.log('Message sent: ' + info.response);
      }
    });
}
async function infoReceived(item, subject, text, digits, link) {
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: '" Naila" process.env.MAIL_EMAIL', 
      to: item,
      subject: subject, 
      text: text,
      html: `<div><p>Please find your verification code below</p><br/> <br/><p>Your verification code is: <b>${digits}<b></p><br/><br/><a href=${link}>Change your ${req.body.data.field}<a></div>`, 
    });
  }

  function sendVerification(item, hashToken, name){
    const mailOptions = {
        from: '" Naila" process.env.MAIL_EMAIL', 
        to: item,
        subject: 'ACCOUNT ACTIVATION',
        text: 'Kindly click on the link below to verify your email',
        html: `<div><br/><br/> <a href= http://localhost:3000/verify?token=${hashToken}&username=${name}></a> <br/><br/> <p>Kind regards</p></div>`
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
      receptionMail(data.email, 'CONTACT STATUS', 'Your response has been received. Thank you for taking the time to reach out', 'We will respond as soon as we can.')
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
  const inThreeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  try{
    con.run("INSERT INTO users (id, username, email, password, ip) VALUES (?,?,?,?,?)", [id, name, email, password, req.body.data.ip], (err, rows)=>{
      if (err){
        console.log(err)
        return res.json({status: 202, message:"Please try again"})
      }
      else{
        //save details to database
        con.run("INSERT INTO reset (email, field, link, expiry) VALUES (?,?,?,?)", [req.body.data.user.toLowerCase(), 'emailValidation', token, inThreeHours], (err, row)=>{
        if (err) return err;
        console.log(row)
        sendVerification(email, token, email)
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


app.post('/activate', (req,res)=>{
  //check if details match and link hasnt expired
  con.get('SELECT link AS link, expiry AS expiry FROM reset WHERE email = ? AND field = ?', [req.body.email.toLowerCase(), 'emailValidation'], (err, row)=>{
    if (err) return err;
    if (!row.link || (row.expiry < new Date().toISOString())) return res.json({status:400, message:'Link expired'})
    if (row.link !== req.body.link) return res.json({status: 500, message:"Page does not exist"});
    con.run("UPDATE users SET verified = ? WHERE email = ?", [0, "Done", req.body.email], (err, rows)=>{
      if (err) return err;
      console.log(rows)
      return res.json({status: 200, message:'Activated'})
    
  })
  })
 

})
app.post("/requestForEmailValidationLink", authenticate, (req,res)=>{
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
  const digits = Math.floor(100000 + Math.random() * 900000).toString()
  const inThreeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const tokenT = crypto.randomBytes(32).toString("hex");
  if (req.body.data.field === 'email'){
    con.get('SELECT email as email FROM users WHERE email = ?', [req.body.data.user.toLowerCase()], (err, row)=>{
      if (err){
        console.log(err)
        return;
      }
      console.log(row.email)
      //save to db
      con.run("INSERT INTO reset (email, field, link, code, expiry) VALUES (?,?,?,?,?)", [req.body.data.user.toLowerCase(), req.body.data.field.toLowerCase(), tokenT, digits.toString(), inThreeHours], (err, row)=>{
        if (err){
          console.log(err)
          return;
        }
        console.log(row)
        //send reset email
        infoReceived(row.email, 'CHANGE USER DETAILS', `We have received a request to change your ${req.body.data.field}. If you did not send the request, kindly ignore.`, digits, `http://localhost:3000/changeUserDetails?token=?${tokenT}&username=${encodeURIComponent(req.body.data.user.toLowerCase())}`)
        res.json({status:200, message:"Please refer to the email sent to continue."})
      })
      
    })
  }
  else{
    con.get('SELECT username as username FROM users WHERE username = ?', [req.body.data.user.toLowerCase()], (err, row)=>{
      if (err){
        console.log(err)
        return;
      }
      console.log(row.username)
      //save to db
      con.run("INSERT INTO reset (email, field, link, code, expiry) VALUES (?,?,?,?,?)", [req.body.data.user.toLowerCase(), req.body.data.field.toLowerCase(), tokenT, digits.toString(), inThreeHours], (err, row)=>{
        if (err){
          console.log(err)
          return;
        }
        console.log(row)
       //send reset email
        infoReceived(row.email, 'CHANGE USER DETAILS', `We have received a request to change your ${req.body.data.field}. If you did not send the request, kindly ignore.`, digits, `http://localhost:3000/changePassword?token=?${tokenT}&username=${encodeURIComponent(req.body.data.user.toLowerCase())}`)
        res.json({status:200, message:"Please check your email"})
      })
      

    })
  }

})
app.post('/resetPwdMail', (req, res)=>{
  const tokenT = crypto.randomBytes(32).toString("hex");
  //check if either username or email provided is registered
  con.get("SELECT email AS email FROM users WHERE email = ?", [req.body.email.toLowerCase()], (err, rows)=>{
    if (err){
      console.log(err)
      return;
    }
    
    console.log(rows)
    if (!rows.email){
      return res.json({status: 400, message:'Email not registered'})
    }
    else{
      const digits = Math.floor(100000 + Math.random() * 900000).toString()
      const inThreeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      //save to db
      con.run("INSERT INTO reset (email, field, link, code, expiry) VALUES (?,?,?,?,?)", [rows.email, 'password', tokenT, digits.toString(), inThreeHours], (err, row)=>{
        if (err){return err;}
        console.log(row)
        infoReceived(req.body.email.toLowerCase(), 'PASSWORD RESET', 'We have received a request to change your password. If you did not send the request, kindly ignore.', digits, `http://localhost:3000/changePassword?token=?${tokenT}&username=${encodeURIComponent(req.body.email.toLowerCase())}`)
        return res.json({status: 200, message:"If an account with this email exists, an reset email has been sent."})
        
      })
      
    }
    
  })
  
})
app.post('/verifyLink', (req,res)=>{
  console.log('verifyLink', req.body)
  con.get("SELECT link AS link, expiry as expiry FROM reset WHERE (username = ? AND field = ?)", [req.body.email.toLowerCase(), req.body.field.toLowerCase()], (err, row)=>{
    if (err) return err;
    if (!row){ return res.json({status: 400, message:'Page does not exist'})}
    console.log(row.link)
    if (req.body.link === row.link && new Date.now().toISOString() >  row.expiry){
      return res.json({status:202, message:'Expired link.' })
    }
    if (req.body.link === row.link && new Date.now().toISOString() <  row.expiry){
      return res.json({status:200, message:'Valid' })
    }
  } )
})
app.post('/verifyCode', (req,res)=>{
  console.log('verifyCode', req.body)
  con.get("SELECT code AS code, expiry as expiry FROM reset  WHERE (email = ? AND field = ?)", [req.body.email.toLowerCase(), req.body.field.toLowerCase()], (err, row)=>{
    if (err) return err;
    console.log(row.link)
    if (req.body.code.toString() === row.code && new Date.now().toISOString() >  row.expiry){
      return res.json({status:202, message:'Expired link. Request for a new one' })
    }
    if (req.body.code.toString() === row.code && new Date.now().toISOString() <  row.expiry){
      return res.json({status:200, message:'Valid' })
    }
  } )
})

app.post('/resetPwd', async (req,res)=>{
  const pwd = await bcrypt.hash(req.body.password.toLowerCase(), saltRounds);
  try{
    //check Code match
    con.get("SELECT code AS code FROM users WHERE email = ?", [req.body.email.toLowerCase()], (err, row)=>{
      if (err) return err;
      console.log(row)
      if (row.code !== req.body.code.toString()) return res.json({status:202, message:"Code mismatch"})
      con.run("UPDATE users SET password = ? WHERE email = ?", [pwd, req.body.email], (err, rows)=>{
      if (err) {
      console.error("Error updating data:", err)
      return;
      }
      else {
        console.log(`Record updated: ${rows} rows affected`)
        con.run("DELETE FROM reset WHERE email = ? && field = ?", [req.body.email.toLowerCase(), 'password'], (rows, err)=>{
          if (err){
            console.log(err)
            return;
          }
          else{
            console.log(rows)
            //password reset mail
            receptionMail(req.body.email.toLowerCase(), 'SUCCESSFUL PASSWORD RESET', 'Your have successfully changed your password', 'Kind Regards')
            return res.json({status: 200, message:"Password successfully changed"})
          }
        })
       
      }
    })

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
  //confirm code matches
  con.get("SELECT code AS code FROM users WHERE username = ?", [req.body.email.toLowerCase()], (err, row)=>{
    if (err) return err;
    if (!row) return res.json({status:500, message:'The code does not exist'});
    con.run('UPDATE users SET email = ?, status = ? WHERE username = ?', [req.body.email.toLowerCase(), 0, req.body.username.toLowerCase()], (err,rows)=>{
    if (err) return err;
    console.log(rows)
    con.run('DELETE FROM reset WHERE email = ? AND field = ?', [req.body.email.toLowerCase(), 'username'], (err, rows)=>{
      if (err) return err;
      //send informative email
      receptionMail(req.body.email.toLowerCase(), 'SUCCESSFUL EMAIL RESET', 'Your have successfully changed your email', 'Kind Regards.')
      return res.json({status:200, message:"Email reset successfully"})
    })
    
    })
  })    
  })
  
app.post('/resetUsername', (req, res)=>{
  con.get("SELECT code AS code FROM reset WHERE email = ?", [req.body.email.toLowerCase()], (err, row)=>{
    if (err) return err;
    if (!row) return res.json({status: 500, message:"Code does not exist"});
    con.run('UPDATE users SET username = ? WHERE email = ?', [req.body.email.toLowerCase(), req.body.username.toLowerCase()], (rows, err)=>{
    if (err) return err;
    console.log(rows)
    //delete record from reset table
    con.run('DELETE FROM reset WHERE email = ? AND field = ?', [req.body.email.toLowerCase(), 'email'], (err, rows)=>{
      if (err) return err;
      //send informative email
      receptionMail(req.body.email.toLowerCase(), 'SUCCESSFUL USERNAME RESET', 'Your have successfully changed your username', 'Kind Regards')
      return res.json({status:200, message:"Email reset successfully"})
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