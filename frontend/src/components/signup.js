import React, {useState, useRef, useEffect} from 'react';
import { MdVisibility } from "react-icons/md";
import { MdVisibilityOff } from "react-icons/md";
import { ToastContainer, toast } from 'react-toastify';
import {useNavigate} from "react-router-dom";
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
    const [length, setLength] = useState()
    const [ip, setIP] = useState()
    const notify = (message) => toast(message)
    let response, p;

    const formRef = useRef()

    useEffect(()=>{
        getIp()
    }, [])
    const getIp = async () =>{
        const res = await axios.get(process.env.REACT_APP_PI);
        setIP(res.data.ip);
    }
    const sendingResponses = async(route, data) =>{
        response = await fetch(route, {
            method:'POST',
            mode:'cors',
            redirect:"error",
            headers:{
                "Content-Type":"application/json"
            },
            body: JSON.stringify({data: data})
        })
        return await response.json();

    }

    const checkIfEmailExists = async() =>{
        const item = await sendingResponses(`${process.env.REACT_APP_BASE}/checkIfEmailExists`, email)
        setEmailMessage(item.message)
        console.log(item)
        if (item.status !== 200){
            setEmail(null)
        }
    }
    const checkIfUserNameExists = async() =>{
        const item = await sendingResponses(`${process.env.REACT_APP_BASE}/checkIfUsernameExists`, username)
        setNameMessage(item.message)
        console.log(item)
        if (item.status !== 200){
            setUserName(null)
        }

    }
    const sendDeets = async(e) =>{
        e.preventDefault()
        setIsReady(true)
        console.log(ip)
        console.log(email)
        console.log(username)
        console.log(password)
        if (email && password && username && ip){
            const item = await sendingResponses(`${process.env.REACT_APP_BASE}/register`, {username: username, email: email, pwd: password, ip: ip})
            if (item.status === 200){
                notify(item.message)
                formRef.current.reset()
                navigate('/login')
            }
            else{
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
        if (/\d/.test(e.target.value)){
            setDigit(true)
        }else{setDigit(false)}
        if (/[a-z]/.test(e.target.value)){
            setLowerCase(true)
        }else{setLowerCase(false)}
        if (/[A-Z]/.test(e.target.value)){
            setUpperCase(true)
        }else{setUpperCase(false)}
        if (/[!@#$%^&*(),.?":{}|<>]/.test(e.target.value)){
            setSpecial(true)
        }else{setSpecial(false)}
        if (e.target.value.length >= 8 && e.target.value.length <= 12){
            setLength(true)
        }else{setLength(false)}
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
        console.log(uppercase)
        console.log(lowercase)
        console.log(digit)
        console.log(length)
        console.log(password)
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
        <div className="register">
            <p className="title">Register here</p>
            <form ref={formRef} onSubmit={sendDeets} className="form">
                <ToastContainer/>
                {errorMessage && <p>{errorMessage}</p>}
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
                    <a href="/login">Already have an account?</a>
                    <input type="submit" className="smBtns"/>
                </div>
            </form>

        </div>
    )
}