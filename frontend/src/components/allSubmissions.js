import React, {useState, useEffect} from "react";
import { Link } from "react-router-dom";
import Cookies from 'js-cookie';
import "../css/allSubmissions.css";


export default function AllSubmissions(){
    const [validate, setValidate] = useState(false)
    const [subs, setSubs] = useState([])
    const [authenticate, setAuthenticated] = useState(false)
    const [loading, setLoading] = useState()
    const [user, setUser] = useState();
    const username = Cookies.get('username');
    let response, p;


    console.log(user)

    useEffect(() => {
        (async()=>{
            const res = await fetch(`${process.env.REACT_APP_BASE}/auth`, {
                credentials: 'include'
            })
            if (res.ok){
                 const data = await res.json()
                setAuthenticated(data.authenticated)
                setUser(data.user.username)
                setLoading(false)
            }

        })()
       
      }, []);

    useEffect(()=>{
        confirmationStatus(user);
       getSubs()

    }, [])

    function formatDate(isoDate) {
        const date = new Date(isoDate);

        const day = date.getDate();
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();

        // add ordinal suffix to day
        const ordinal = (n) => {
            if (n > 3 && n < 21) return n + "th";
            switch (n % 10) {
            case 1: return n + "st";
            case 2: return n + "nd";
            case 3: return n + "rd";
            default: return n + "th";
            }
        };

        return `${ordinal(day)} ${month} ${year}`;
    }


    const readD = async (route, data) =>{
        response = await fetch(route, {
            credentials: 'include',
            method:"POST",
            mode: 'cors',
            redirect:"error",
             headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({data})
        })
        return await response.json()
    }
    const confirmationStatus = async (user) =>{
        p = await readD(`${process.env.REACT_APP_BASE}/areYouActive`, user)
        if (p.message === 1){
            setValidate(true)
        }
        return;

    }

    const getSubs = async() =>{
        p = await readD(`${process.env.REACT_APP_BASE}/getAllSubmissions`, 'hulu')
        console.log(p)
        for (let i in p.message){
            const unique = subs.some(item => item.id === p.message[i].id)
                
            if (!unique){
                setSubs(prev =>  [...prev, p.message[i]])    
            }
        }
        
    }
    return(
        <div className="allSubmissions">
            <p className='title'>User Submissions</p>
            {subs.length > 0 ?
                <table>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Message</th>
                        <th>Date</th>
                    </tr>
                    
                    {
                        subs.map(item => (
                            <tr key={item.id}>
                                <td className="name">{item.name}</td>
                                <td className="email">{item.email}</td>
                                <td className="message">{item.message}</td>
                                <td className="date">{formatDate(item.date)}</td>  
                            </tr>
                        ))
                    }
                </table>
                :
                <div>
                    <p>No submissions yet</p>
                    <Link to='/'>Submit your message</Link>
                </div>
            }
        </div>
    )
}