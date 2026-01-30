import React, {useEffect} from "react";
import './App.css';
import { Routes, Route} from 'react-router-dom';
import Login from "./components/login";
import Register from "./components/signup";
import MySubmissions from "./components/submissions";
import AllSubmissions from "./components/allSubmissions";
import ContactForm from "./components/contact";
import RequireAuth from "./components/requireAuth";


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
       
        
      </Routes>
    </div>
  );
}

export default App;
