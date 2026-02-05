import React, {useState, useRef, useEffect, useLayoutEffect} from "react";
import "../css/fpwd.css";
import "../css/changeUserName.css";
import { useSearchParams } from "react-router-dom";




export default  function ChangeUserName(){
    const [response, setResponse] = useState()
    const [searchParams] = useSearchParams()
    const inputsRef = useRef([])
    const inputSpanRef = useRef()
    const [code, setCode] = useState(Array({length: 6}).fill(""))
    const [username, setUserName] = useState(null)
    const [cUsername, setCUsername] = useState(null)
    const [usernameError, setUserNameError] = useState()
    const [cUsernameError, setCUsernameError] = useState()
    const [codeMessage, setCodeMessage] = useState()
    const [errorMessage, setErrorMessage] = useState()
    const [status, setStatus] = useState()
    const [key, setKey] = useState(0)
    const cUserRef = useRef(null);
    const userRef = useRef(null)
    const formRef = useRef(null)
    const token = searchParams.get("token");
    const _username = searchParams.get("username");
    const field = searchParams.get("field")

    useLayoutEffect(()=>{
        inputsRef.current[0]?.focus()
    }, [])
  
     useEffect(() => {
        if (token && _username && field) {
          // Call backend to validate email
          fetch(`${process.env.REACT_APP_BASE}/verifyLink`,{
            method: 'POST',
            mode:"cors",
            redirect:"error",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({token:token, email:_username, field: field})
          })
            .then(res => {if (!res.ok) {
                throw new Error("Failed to fetch");
                } return res.json()})
            .then(data => {
              //console.log("Validation response:", data);
              if (data?.status !== 200) {setStatus(false); setErrorMessage(data?.message)}
              if (data?.status === 200) {setStatus(true); setErrorMessage(data?.message)}
            });
        }
      }, [searchParams, token, field, _username]);

    const handleKeyDown = async (e, index) =>{
        const allowedKeys = [
            "Backspace",
            "Delete",
            "ArrowLeft",
            "ArrowRight",
            "Tab",
        ];
        if (e.key === "Backspace") 
        {
            const newCode = [...code];
            newCode[index] = ""; 
            setCode(newCode);
        }
        if (!/^[0-9]$/.test(e.key) && !allowedKeys.includes(e.key)) {
            e.preventDefault();
        }
        if (e.key === "Backspace" && !e.target.value && inputsRef.current[index - 1]) {
            inputsRef.current[index - 1].focus();
        }
    }
     function softReload() {
        setKey(prev => prev + 1);
    }
    // Move focus if previous input is filled
    const handleInput = (e, index) => {
        const value = e.target.value.replace(/\D/g, ""); // digits only
        if (!value) return;

        // Update state
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        if (value && inputsRef.current[index + 1]) {
        inputsRef.current[index + 1].focus();
        }
    };

    const talkToBackend = async(route, data) =>{
        const res = await fetch(route, {
            method:"POST",
            mode:"cors",
            redirect:"error",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({data})
        })
        return await res.json()
    }
    const getUsername = async(e) =>{
        e.preventDefault();
        let item;
        if (field === 'password'){
            setUserName(e.target.value)
        }
        else{
            if (field === 'username') item = 'checkIfUserNameExists';
            if (field === 'email') item = 'checkIfEmailExists';
        }
        const p = await talkToBackend(`${process.env.REACT_APP_BASE}/${item}`, e.target.value)
        setUserNameError(p.message)
        if (p.status !== 200) setUserName(null)
        else setUserName(e.target.value)

    }
    const getCUsername = (e) =>{
        e.preventDefault()
        if (e.target.value) setUserNameError(null)
        setCUsername(e.target.value)
        if (!username) setCUsernameError('Username must exist');
        setCUsername(e.target.value)

    }
    const submitUserName = async(e) =>{
        e.preventDefault()
        if (username !== cUsername){
            setCUsernameError(`Confirmed ${field} and ${field} must match`)
            setCUsername(null)
            cUserRef.current.value='';
            userRef.current.value=''
        }
        
        if (code.join('').length === 6){
            const p = await talkToBackend(`${process.env.REACT_APP_BASE}/verifyCode`, {code: Number(code.join('')), email: _username, field: field})
            //console.log('code validation', p)
            setCodeMessage(p.message)
            if (p.status !== 200) setCode(null)
        }
        if (code.join('').length === 6 && username && cUsername){
           
            let reset;
            if (field === 'email') reset ='resetEmail';
            if (field === 'password') reset = 'resetPwd';
            if (field === 'username') reset = 'resetUsername';
            const resp = await talkToBackend(`${process.env.REACT_APP_BASE}/${reset}`, {code: Number(code.join('')), username:username, email:_username, field: field})
            //console.log("submission", resp)
            setResponse(resp.message)
            if (resp.status === 200) {
                softReload();
                //formRef.current.reset()
            }
        }

    }

    

    return(
        <div className="encloseChangeUserName">
            <p className="title">Change {field}</p>
            {status ? <>
            {response && <p className="responseMessages">{response}</p>}
            {!response && <form onSubmit={submitUserName} ref={formRef} key={key}>
                <div className="formInput">
                    <label>Code sent in email</label>
                    <div className="codeInput" ref={inputSpanRef}>
                        {Array.from({length:6}).map((_, index)=>(
                            <input onInput={((e)=>handleInput(e,index))} key={index} type={field === 'password' ? 'password' : 'text'} maxLength={1}  inputMode="numeric" onKeyDown={((e)=>{handleKeyDown(e, index)})} autoFocus ref={(k) => (inputsRef.current[index] = k)}/>
                        ))}
                    </div>  
                </div>
                {codeMessage && <p className=" error info">{codeMessage}</p>}
                <div className="formInput">
                    {field === 'username' && <label>New Username</label>}
                    {field === 'email' && <label>New Email</label>}
                    {field === 'password' && <label>New Password</label>}
                    
                    <input ref={userRef} className="inputField" type={field === 'email' ? 'email' : 'text'} onChange={getUsername}/>
                </div>
                {usernameError && <p className="error info">{usernameError}</p>}
                <div className="formInput">
                    {field === 'username' && <label>Confirm Username</label>}
                    {field === 'email' && <label>Confirm Email</label>}
                    {field === 'password' && <label>Confirm Password</label>}
                    <input ref={cUserRef} className="inputField" type={field === 'email' ? 'email' : 'text'} onChange={getCUsername} disabled={!username}/>
                </div>
                {cUsernameError && <p className="error info">{cUsernameError}</p>}
                <input className="userNameSubmit" type="submit" />
            </form>}
            <span className="buttons">
                <a className="_login" href="/login">Login</a>
                <a className='_contact' href='/'>Leave a message</a>
            </span>
            </> :
            <div className="notAvailable">
                <p>Ooops🙁, {errorMessage}</p>
                <p>Kindly request for another one on your submissions page</p>
            </div>
            }
        </div>

    )
}