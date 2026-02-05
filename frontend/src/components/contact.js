import React, {useState, useEffect, useRef} from "react";
import {useNavigate} from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import "../css/signup.css"
import '../css/forms.css';
import { Link } from "react-router-dom";


export default function ContactForm() {
  const navigate = useNavigate()
  const guestRef = useRef()
  const formRef = useRef()

  const [errorMessage, setErrorMessage] = useState()
  const [authenticated, setAuthenticated] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [click, setClick] = useState(false);
  const [ready, setReady] = useState(false);
  const [typing, setTyping] = useState(false)
  const [myType, setMyType] = useState(
  guestRef?.current?.textContent?.toLowerCase().trim() === 'guest' ? 'guest' : guestRef?.current?.textContent?.toLowerCase().trim() === 'user' ? 'member' : 'other account')
  const [user, setUser] = useState(null)
  const [alternativeUser, setAlternativeUser] = useState(false)
  const [diffUser, setDiffUser] = useState(false);

  useEffect(() => {
  const checkAuth = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BASE}/auth`, {
        credentials: 'include',
      });

      if (!res.ok) {
        setAuthenticated(false);
        setUser(null)
        setAlternativeUser(false)
        return;
      }

      const data = await res.json(); 
      setAuthenticated(true);
      setUser(data.user.username)
      setAlternativeUser(true)
    } catch (err) {
      //console.log(err)
      setAuthenticated(false);
    } 
  };

  checkAuth();
}, []);



  useEffect(()=>{
    (!authenticated && typing && (myType === 'member' || myType === 'other account')) ? navigate('/login') : void(0)
  }, [typing, myType, authenticated, navigate])

  useEffect(()=>{
    //console.log(guestRef?.current?.textContent?.toLowerCase())
    setMyType(guestRef?.current?.textContent?.toLowerCase().trim() === 'user' ? 'member' : guestRef?.current?.textContent?.toLowerCase().trim() === 'guest' ? 'guest' : 'other account')

  }, [alternativeUser])
      
  async function handleName(event){
    event.preventDefault();
    setTyping(true)
    setName(event.target.value)
  }
  function handleEmail(event){
    event.preventDefault();
    setTyping(true)
    setEmail(event.target.value);
  }
  function handleSubject(event){
    event.preventDefault();
    setTyping(true)
    setSubject(event.target.value);
  }
  function handleMessage(event){
    event.preventDefault();
    setTyping(true)
    setMessage(event.target.value);
  }
  function viewSubs(){
    navigate('/allSubmissions')
  }
  
  function handleSubmit(event){
    event.preventDefault();
    setClick(true);
    
    if (((user !== null ) || (name !== "" && name !== null && name.trim().length >=1)) && email !== "" && email !== null && email.trim().length >= 1  && subject !== "" && subject !== null && subject.trim().length >= 1 && message !== "" && message !== null && message.trim().length >= 1 ){
      event.target.reset();
      setReady(true);
      fetch(`${process.env.REACT_APP_BASE}/contactSubmission`, {
        credentials: 'include',
        method: 'POST',
        mode: "cors",
        redirect:"error",
        headers:{
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
          "name": name || user || "",
          "email":email,
          "subject":subject,
          "message": message
    }),
    }).then(response=> response.json()).then( (data) => {
        //console.log(data);
        if (data.status === 200){
          setName('')
          setClick(false)
          setAlternativeUser(false)
          setDiffUser(false)
          formRef.current.reset()
          toast('Successfully submitted')
            
            
        }
        else{
          toast.error('We have experienced a slight error. Please try again')
        }
       
    })

    }
  }
  const switchUser = (e) =>{
    e.preventDefault()
    
    if (!alternativeUser && !diffUser){
      setAlternativeUser(true)
      setDiffUser(false)
    }
    else if (alternativeUser && !diffUser){
      setAlternativeUser(false)
      setDiffUser(true)
    }
    else{
      setAlternativeUser(false)
      setDiffUser(false)
    }
  }
  
  const checkIfNameExists = async() =>{
    const response = await fetch(`${process.env.REACT_APP_BASE}/checkIfUsernameExists`, {
      method:'POST',
      mode:'cors',
      redirect:"error",
      headers:{
          "Content-Type":"application/json"
      },
      body: JSON.stringify({data: name})
        })
      const p = await response.json()
      //console.log(p)
      if (p.status !== 200){
        setName('')
        setErrorMessage(p.message)
      } else{setErrorMessage(null)}

  }


  return (
    <div className="Contact">
      <div className="contactFormApp">
        <div className="header">
        <p className="title">Drop a note😊</p>
        <p className="informative">Kindly sign in to send a note.</p>
        </div>
        <ToastContainer/>
        
        <form onSubmit={handleSubmit} ref={formRef}>
          <span>
            <label>Name</label>
            <div className="inputSpan">
              <input type="text" onChange={handleName} disabled={!!user} value={user ?? name} onBlur={user === null ? checkIfNameExists : void(0)}/>
              {errorMessage && <p className="error">{errorMessage}</p>}
              { click === true && (( user === null) && (name === "" || name === null)) && <p className="error">Name should not be blank</p>}
              
            </div>
           
          </span>
           <span>
            <label>Email</label>
            <div className="inputSpan">
              <input type="email" onChange={handleEmail}/>
              { click === true && (email === "" || email === null ) && <p className="error">Email should not be blank</p>}
            </div>
           
          </span>
           <span>
            <label>Subject</label>
            <div className="inputSpan">
              <input type="text" onChange={handleSubject}/>
              {click === true && (subject === "" || subject === null) && <p className="error">Subject should not be blank</p>}
            </div>
            
          </span>
           <span>
            <label>Message</label>
            <div className="messageDiv inputSpan">
              <textarea type="text" className="messageInput" onChange={handleMessage}></textarea>
              {ready !== true && click === true && (message === "" || message === null) && <p className="error">Message should not be blank</p>}
            </div>
            
          </span>
          <input type="submit" value="submit" className="submit smBtns"/>
        </form>
      </div>
      {!diffUser}
      <Link className="guest" onClick={switchUser} ref={guestRef}> {(alternativeUser && !diffUser) ? 'guest' : (!alternativeUser && diffUser) ? 'other account' : 'user'} </Link>
    
      <div className="buttons contactBtnSection">
          <a href={`/submissions/${user}`}>View my submissions</a>
          <input type="button" onClick={viewSubs} className="viewData myBtns" value="View database submissions"/> 
      </div>
    </div>
  );
}

