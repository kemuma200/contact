import React, {useState, useEffect} from 'react'
import { useSearchParams} from 'react-router-dom';
import "../css/emailValidation.css";
import Confetti from 'react-confetti-boom';

export default function EmailValidation(){
    const [status, setStatus] = useState();
    const [errorMessage, setErrorMessage] = useState()
    const [searchParams] = useSearchParams()


    useEffect(() => {
    const token = searchParams.get("token");
    const username = searchParams.get("username");

    if (token) {
      //console.log("Token:", token);
      //console.log("Username:", username);

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
          //console.log("Validation response:", data);
          if (data.status !== 200) {setStatus(false); setErrorMessage(data.message)}
          if (data.status === 200) {setStatus(true);}
        });
    }
  }, [searchParams]);

    return(
        <div className="validationPage">
            <p className='title'>Email Validation</p>
           {status ?
            <>
              <Confetti mode="boom" particleCount={50} colors={['#ff577f', '#ff884b']}/>
              <div className="encloseValidationContents">
                <p className="responseMessages">Email verification was successful😃😃.</p>
                <span className="buttons">
                  <a className="_login" href="/login">Login</a>
                  <a className="_contact" href='/'>Submit a message</a>
                </span>
                
              </div>
              </>
            :
            <div className="encloseValidationContents">
                <p>Ooops🙁, {errorMessage}</p>
                <p>Kindly request for another one on your submissions page</p>
            </div>
            }
            
        </div>
    )
}