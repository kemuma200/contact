import React, {useState, useRef, useEffect} from 'react';
import { MdVisibility } from "react-icons/md";
import { MdVisibilityOff } from "react-icons/md";
import { ToastContainer, toast } from 'react-toastify';
import {useNavigate, Link} from "react-router-dom";
import axios from "axios";
import "../css/signup.css";



export default function Register(){
    const navigate = useNavigate()
    const [email, setEmail] = useState(null)
    const [username, setUserName] = useState(null)
    const [password, setPassword] = useState(null)
    const [isReady, setIsReady] = useState(false)
    const [emailMessage, setEmailMessage] = useState(null)
    const [nameMessage, setNameMessage] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)
    const [visibility, setVisibility] = useState(false)
    const [uppercase, setUpperCase] = useState()
    const [lowercase, setLowerCase] = useState()
    const [special, setSpecial] = useState()
    const [digit, setDigit] = useState()
    const [key, setKey] = useState(0)
    const [length, setLength] = useState()
    const [ip, setIP] = useState()
    const notify = (message) => toast(message)
    let response;

    const formRef = useRef()

   useEffect(() => {
    const fetchIp = async () => {
        try {
            const res = await axios.get("https://api.ipify.org?format=json");
            setIP(res.data.ip);
            sessionStorage.setItem("ip", res.data.ip); // cache for this session
        } catch (err) {
            console.error("Failed to fetch IP", err);
        }
    };

    const cachedIp = sessionStorage.getItem("ip");
    if (cachedIp) setIP(cachedIp);
    else fetchIp();
}, []);
    
    function softReload() {
        setKey(prev => prev + 1); 
    }
    const sendingResponses = async(route, data) =>{
        try{
                response = await fetch(route, {
                method:'POST',
                mode:'cors',
                redirect:"error",
                headers:{
                    "Content-Type":"application/json"
                },
                body: JSON.stringify({data: data})
            })
            if (!response.ok) {
            // handle non-2xx status
            console.log("Failed request")
    }
        return await response.json();

        }
        catch(e)
        {
            console.log('Fetch error', e)
        }
    }

    const checkIfEmailExists = async() =>{
        if (email){
            const item = await sendingResponses(`${process.env.REACT_APP_BASE}/checkIfEmailExists`, email)
            setEmailMessage(item?.message)
            //console.log(item)
            if (item?.status !== 200){
                setEmail(null)
            }
        }
        
    }
    const checkIfUserNameExists = async() =>{
        if (username){
            const item = await sendingResponses(`${process.env.REACT_APP_BASE}/checkIfUsernameExists`, username)
            setNameMessage(item?.message)
            //console.log(item)
            if (item?.status !== 200){
                setUserName(null)
            }
        }

    }
    const sendDeets = async(e) =>{
        e.preventDefault()
        setIsReady(true)
        
        if (email && password && username ){
            const item = await sendingResponses(`${process.env.REACT_APP_BASE}/register`, {username: username, email: email, pwd: password, ip})
            console.log(item)
            if (item?.status === 200){
                notify(item.message)
                formRef.current.reset()
                softReload()
                navigate('/login')
            }
            else{
                formRef.current.reset()
                softReload()
                setErrorMessage(item.message)
            }
        }
        
    }
    const updateEmail = (e) =>{
        e.preventDefault()
        setEmail(e.target.value)
    }
    const updatePassword = (e) =>{
        e.preventDefault()
        setDigit(/\d/.test(e.target.value));
        setLowerCase(/[a-z]/.test(e.target.value));
        setUpperCase(/[A-Z]/.test(e.target.value));
        setSpecial(/[!@#$%^&*(),.?":{}|<>]/.test(e.target.value));
        const pwdLength = e.target.value.length >= 8 && e.target.value.length <= 12;
        setLength(pwdLength);
        
        function hasNoRepeatedSequence(str) {
            const n = str.length;

            // Check all substrings of length 2 up to half the string length
            for (let len = 2; len <= Math.floor(n / 2); len++) {
                const seen = new Set();
                for (let i = 0; i <= n - len; i++) {
                const sub = str.substring(i, i + len);
                if (seen.has(sub)) return false; 
                seen.add(sub);
                }
            }
            return true;
        }
        
        if (/[A-Z]/.test(e.target.value) && /[a-z]/.test(e.target.value) && /\d/.test(e.target.value) && length && hasNoRepeatedSequence(e.target.value)){
            setPassword(e.target.value)
        }
    }
    
    const updateUsername = (e) =>{
        e.preventDefault()
        setUserName(e.target.value)
        
    }
    const changeVisibility = () =>{
        setVisibility(!visibility)
    }
    const handleKeyDown = (e) =>{
        const allowedKeys = [
            "Backspace",
            "Delete",
            "ArrowLeft",
            "ArrowRight",
            "Tab",
        ];
        if (!/^[a-zA-Z0-9]$/.test(e.key) && !allowedKeys.includes(e.key)) {
            e.preventDefault();
        }
    }

    return(
        <div className="register" key={key}>
            <p className="title">Register here</p>
            {<p>{sp}</p>}
            <form ref={formRef} onSubmit={sendDeets} className="form">
                <ToastContainer/>
                {errorMessage && <p className="responseMessages">{errorMessage}</p>}
                <div className="formInput">
                    <label>Email</label>
                    <input type="email" onChange={updateEmail}  onBlur={() => checkIfEmailExists(email)}/>
                </div>
                {isReady && !email && <p className='error'>Input required</p>}
                {emailMessage && <p className='error'>{emailMessage}</p>}
                <div className="formInput">
                    <label>Username</label>
                    <input type="text" inputMode="text" autoComplete="off" onKeyDown={handleKeyDown} onChange={updateUsername}  onBlur={() => checkIfUserNameExists(email)}/>
                </div>
                {isReady && !email && <p className='error'>Input required</p>}
                {nameMessage && <p className='error'>{nameMessage}</p>}
                <div className="formInput">
                    <label>Password</label>
                    <div className="inputTextArea">
                    <span className="enclosePasswordField">
                        <input type={visibility ? 'text' : 'password'} onInput={updatePassword} minLength={8} maxLength={12}/>
                        {visibility ? <MdVisibility onClick={changeVisibility} className="viewIcon"/> : <MdVisibilityOff onClick={changeVisibility} className="viewIcon"/>}
                    </span>
                    {(!uppercase || !lowercase || !special || !digit || !length) && <div className="encloseRegulations">
                        <p>Password should contain</p>
                        {!uppercase && <p>Atleast 1 uppercase letter</p>}
                        {!lowercase && <p>Atleast 1 lowercase letter</p>}
                        {!special && <p>Atleast 1 special character</p>}
                        {!digit && <p>Atleast 1 numeric digit</p>}
                        {!length && <p>Length between 8-12 characters</p>}
                    </div>}
                    </div>
                </div>
                {isReady && !email && <p className='error'>Input required</p>}
                <div className="buttons">
                    <Link to="/login">Already have an account?</Link>
                    <input type="submit" className="smBtns"/>
                </div>
               
            </form>

        </div>
    )
}