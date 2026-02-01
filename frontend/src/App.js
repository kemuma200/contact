import React, {useEffect} from "react";
import './App.css';
import { Routes, Route} from 'react-router-dom';
import Login from "./components/login";
import Register from "./components/signup";
import MySubmissions from "./components/submissions";
import AllSubmissions from "./components/allSubmissions";
import ContactForm from "./components/contact";
import RequireAuth from "./components/requireAuth";
import ChangeUserName from "./components/changeUserName";
import ChangeDetails from "./components/changeDeets";
import EmailValidation from "./components/emailValidation";
import ForgotPwd from "./components/fpwd";


function App() {
  const isAuthenticated = '';
 
  useEffect(()=>{
    fetch('http://localhost:4000/',{
      method: 'POST',
      mode: "cors",
      redirect:"error",
      headers:{
          "Content-Type":"application/json"
      }
    })
  }, [])
  
  

  return (
    <div className="App">
      <Routes >
        <Route path='/' element={<ContactForm/>}/>
        <Route path='/signup' element={<Register/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route element={<RequireAuth isAuthenticated={isAuthenticated} />}>
          <Route path='/submissions/:user' element={<MySubmissions/>}/>
          <Route path='/allSubmissions' element={<AllSubmissions/>}/>
        </Route>
        <Route path='forgotpassword' element={<ForgotPwd/>}/>
        <Route path="/changeUserDetails" element={<ChangeUserName/>}/>
        <Route path="/changeDeets" element={<ChangeDetails/>}/>
        <Route path='/verify' element={<EmailValidation/>}/>
        <Route path="*" element={<ContactForm/>}/>
       
        
      </Routes>
    </div>
  );
}

export default App;
