import React, {useState} from "react";
import './App.css';

function App() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [click, setClick] = useState(false);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState(false);
  let r;
 
  function handleName(event){
    event.preventDefault();
    setName(event.target.value);
  }
  function handleEmail(event){
    event.preventDefault();
    setEmail(event.target.value);
  }
  function handleSubject(event){
    event.preventDefault();
    setSubject(event.target.value);
  }
  function handleMessage(event){
    event.preventDefault();
    setMessage(event.target.value);
  }
  function getData(event){
    event.preventDefault();
    setView(!view);
    fetch('/checkSubmissions', 
    {
      method: 'GET',
      mode: "cors",
    }).
    then(response=> response.json()).then( (data) => {
      if (data.status === 200){
        console.log(data.txt.rows);
        r = data.txt.rows;
        console.log(typeof(r));
        console.log(r);
      }
      else{
        alert(data.txt);
      }
      console.log(data.status);
      console.log(data.message);
  })

  }
  function handleSubmit(event){
    event.preventDefault();
    setClick(true);
    if (name !== "" && name !== null && name.trim().length >=1 && email !== "" && email !== null && email.trim().length >= 1  && subject !== "" && subject !== null && subject.trim().length >= 1 && message !== "" && message !== null && message.trim().length >= 1 ){
      event.target.reset();
      setReady(true);
      fetch('/contactSubmission/', {
        method: 'POST',
        mode: "cors",
        redirect:"error",
        headers:{
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
          "name": name,
          "email":email,
          "subject":subject,
          "message": message
    }),
    }).then(response=> response.json()).then( (data) => {
        console.log(data);
        console.log(Response.json());
        if (data.status === 200){
          alert("Succesfully submitted")
        }
        else{
          alert("We have experienced a slight error. Please try again")
        }
        console.log(data.status);
        console.log(data.message);
    })

    }
  }


  return (
    <div className="App">
      <div className="contactFormApp">
        <div className="header">
        <p>Contact For App</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <span>
            <label>Name</label>
            <div>
              <input type="text" onChange={handleName} />
              { click === true && (name === "" || name === null) && <p className="error">Name should not be blank</p>}
              
            </div>
           
          </span>
           <span>
            <label>Email</label>
            <div>
              <input type="text" onChange={handleEmail}/>
              { click === true && (email === "" || email === null ) && <p className="error">Email should not be blank</p>}
            </div>
           
          </span>
           <span>
            <label>Subject</label>
            <div>
              <input type="text" onChange={handleSubject}/>
              {click === true && (subject === "" || subject === null) && <p className="error">Subject should not be blank</p>}
            </div>
            
          </span>
           <span>
            <label>Message</label>
            <div className="messageDiv">
              <textarea type="text" className="messageInput" onChange={handleMessage}></textarea>
              {ready !== true && click === true && (message === "" || message === null) && <p className="error">Message should not be blank</p>}
            </div>
            
          </span>
          <input type="submit" value="submit" className="submit"/>
        </form>
      </div>
      <button className="viewData" onClick={getData}> View database submissions</button>
      <div>
      {( r !== undefined && view === true) ? 
      <div>
        <p>Finesse</p>
        <div>
          <p>Name</p>
          <p>Email</p>
          <p>Subject</p>
          <p>Message</p>
        </div>   
        {Object.values(r)[0].map((key)=>{
          return(
            <tr key={key}>
              <div>{Object.values(r)[key]}</div>
              <div>{Object.values(r)[key]}</div>
              <div>{Object.values(r)[key]}</div>
              <div>{Object.values(r)[key]}</div>
          </tr>
          )
        
        })}
        </div>
        :
        <p></p>
    }
        
      </div>
    </div>
  );
}

export default App;
