import React, {useState} from "react";
import '../css/fpwd.css';



export default  function ForgotPwd(){
    const [response, setResponse] = useState()
    const [email, setEmail] = useState()

    const submitEmail = async(e) =>{
        e.preventDefault()
        if (!email) return;
        //console.log(email)
        const r = await fetch(`${process.env.REACT_APP_BASE}/resetPwdMail`,{
            method:'POST',
            mode:"cors",
            redirect:'error',
            headers:{
                'Content-Type': "application/json"
            },
            body:JSON.stringify({email: email})
        })
        const q = await r.json()
        setResponse(q.message);
    }
    const getEmail = (e) =>{
        e.preventDefault()
        setEmail(e.target.value)
    }


    return(
        <div className="forgotPwdSection">
            <p className="title">Seems like someone forgot their password</p>
            {response && <p className="responseMessages">{response}</p>}
            {!response &&
                <form onSubmit={submitEmail}>
                <div className="fpwdInput">
                    <label>Email</label>
                    <input type="email" onChange={getEmail} placeholder="Please submit your email"/>
                </div>
                <input className="submitFpwdEmail" type="submit"/>
                </form>}
                <span className="buttons">
                    <a className="_login" href="/login">Login</a>
                    <a href='/'>Leave a message</a>
                </span>
            
        </div>

    )
}