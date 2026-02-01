import React, {useState, useEffect, useRef} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import '../css/fpwd.css';
import "../css/changeDeets.css";


export default function ChangeDetails(){
    const location = useLocation()
    const navigate = useNavigate()
    const {field, user} = location.state || ''
    const [deets, setDeets] = useState(field)
    const [name, setName] = useState()
    const [message, setMessage] = useState()
    let p, response

    const formRef = useRef(null);

    // useEffect(()=>{
    //     if(!user){
    //         navigate('/')
    //     }
    // })
    const getUserDetails = (e) =>{
        e.preventDefault()
        setName(e.target.value)
    }
    const submissions = async(route, data) =>{
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
    const sendDeets = async () =>{
        if (field === 'email'){
            p = await submissions(`${process.env.REACT_APP_BASE}/changeUserDetails`, {field: field, user: user})
        }
        else{
            p = await submissions(`${process.env.REACT_APP_BASE}/changeUserDetails`, {field: field, user: user})
        }
        console.log(p)
        setMessage(p.message)
        if (p.status === 200) formRef.current.reset();
       
    }

    return(
        <div className="changeDetails">
            <p className="title">Alter {field}</p>
            <p>{message}</p>
            <form onClick={sendDeets}>
                <div className="encloseDetailsInput">
                    <label>Username</label>
                    <input type={deets === 'email' ? 'email' : 'text'} onChange={getUserDetails}/>
                </div>
                <input className="encloseDetailsButton" type="submit"/>
            </form>
            <span className="buttons">
                <a className="_login" href="/login">Login</a>
                <a href='/'>Leave a message</a>
            </span>
           
        </div>

    )
}