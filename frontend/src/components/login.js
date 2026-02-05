import React, {useState, useRef} from 'react';
import { MdVisibility } from "react-icons/md";
import { MdVisibilityOff } from "react-icons/md";
import { ToastContainer, toast } from 'react-toastify';
import {useNavigate} from "react-router-dom";
import '../css/signup.css';
import '../css/login.css';



export default function Login(){
    const navigate = useNavigate();

    const [email, setEmail] = useState();
    const [pwd, setPwd] = useState()
    const [isReady, setIsReady] = useState()
    const [errorMessage, setErrorMessage] = useState()
    const [visibility, setVisibility] = useState(false)
    const notify = (message) => toast(message)
    let response, p;

    const formRef = useRef()

    const getEmail = (e) =>{
        e.preventDefault()
        setEmail(e.target.value)

    }
    const getPassword = (e) =>{
        e.preventDefault()
        setPwd(e.target.value)

    }
    const changeVisibility = () =>{
        setVisibility(!visibility)
    }
    const proceed = async(e) =>{
        e.preventDefault()
        setIsReady(true)
        response = await fetch(`${process.env.REACT_APP_BASE}/login`, {
            method:"POST",
            mode:"cors",
            redirect:"error",
            headers:{
                'Content-Type':"application/json"
            },
            body:JSON.stringify({
                email: email,
                pwd: pwd
            }),
            credentials: "include", 
        })
        p = await response.json();
        if(p.status === 200){
            notify(p.message)
            formRef.current.reset()
            navigate('/')
        }
        else{
            setErrorMessage(p.message)
        }

    }
    return(
        <div className="login">
            <p className='title'>Login</p>
            <form onSubmit={proceed} ref={formRef}>
                {errorMessage && <p>{errorMessage}</p>}
                <ToastContainer/>
                <a className="account" href="/signup">Create an account</a>
                <fieldset>
                    <legend>Email or Username</legend>
                    <input type="text" onChange={getEmail}/>
                </fieldset>
                {isReady && !email && <p>Input required</p>}
                <fieldset>
                    <legend>Password</legend>
                    <div>
                        <input type={visibility ? 'text' : 'password'} onChange={getPassword}/>
                        {visibility ? <MdVisibility onClick={changeVisibility}/> : <MdVisibilityOff onClick={changeVisibility}/>}
                    </div>
                    
                </fieldset>
                {isReady && !pwd && <p>InputRequired</p>}
                <div className="buttons">
                    <a href='/forgotpassword'>Forgot password</a>
                    <input type="submit" className="smBtns"/>
                </div>
                
            </form>

        </div>
    )
}