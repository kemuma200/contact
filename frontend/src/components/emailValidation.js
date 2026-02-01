import React, {useState, useEffect} from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom';
import "../css/emailValidation.css";

export default function EmailValidation(){
    const navigate = useNavigate()
    const [status, setStatus] = useState();
    const [errorMessage, setErrorMessage] = useState()
    const [searchParams] = useSearchParams()


    useEffect(() => {
    const token = searchParams.get("token");
    const username = searchParams.get("username");

    if (token) {
      console.log("Token:", token);
      console.log("Username:", username);

      // Call backend to validate email
      fetch(`${process.env.REACT_APP_BASE}/activate`,{
        method: 'POST',
        mode:"cors",
        redirect:"error",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({token:token, email:username})
      })
        .then(res => res.json())
        .then(data => {
          console.log("Validation response:", data);
          if (data.status !== 200) {setStatus(false); setErrorMessage(data.message)}
          if (data.status === 200) {setStatus(true);}
        });
    }
  }, [searchParams]);

    return(
        <div className="validationPage">
            <p className='title'>Email Validation</p>
            {status ?
            <div className="encloseValidationContents">
                <p>Email verification was successful.</p>
                <button onClick={(()=> navigate('/login'))}>Login</button>
                <button onClick={(()=> navigate('/'))}>Submit a message</button>
            </div>
           
            :
            <div className="encloseValidationContents">
                <p>Ooops🙁, {errorMessage}</p>
                <p>Kindly request for another one on your submissions page</p>
            </div>
            }
        </div>
    )
}