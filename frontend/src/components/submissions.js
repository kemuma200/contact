import React, {useState, useEffect} from "react";
import "../css/allSubmissions.css";
import "../css/submissions.css";
import { useParams, useNavigate } from "react-router-dom";



export default function MySubmissions(){
    const [activate, setActivate] = useState()
    const [email, setEmail] = useState()
    const [subs, setSubs] = useState([])
    const { user } = useParams();
    const navigate = useNavigate()
    let p;

    useEffect(()=>{
        checkIfValidated(user)
    }, [])
    useEffect(()=>{
        getMySubmissions(user)
    }, [])
    


    const readD = async (route, data) =>{
        try{
        const response = await fetch(route, {
            credentials: 'include',
            method:'POST',
            mode:'cors',
            redirect:"error",
            headers:{
                "Content-Type":"application/json"
            },
            body: JSON.stringify({data})

        })
        return await response.json()
        }
        catch(e){
            console.error("Fetch error:", e);
            return { ok: false, error: e.message };
        }
    }
    const checkIfValidated = async(user) =>{
        p = await readD(`${process.env.REACT_APP_BASE}/areYouActive`, user)
        if (p.ok === false){navigate('/signup')}
        if (p.message === 1) setActivate(true)
        return;

    }
    const getMySubmissions = async(user) =>{
        p = await readD(`${process.env.REACT_APP_BASE}/getUserSubmissions`, user)
        console.log(p)
        for (let i in p.message){
            const unique = subs.some(item => item.id === p.message[i].id)

            if (!unique){
                setSubs(prev => [...prev, p.message[i]])
            }
        }

    }
    const getUserEmail = async () =>{
        p = await readD(`${process.env.REACT_APP_BASE}/getUserEmail`, user)
        console.log(p)
        setEmail(p.message)
        return;
    }


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
    

    return(
        <div className="mySubs">
            <p className="title">{user}'s  submissions</p>
        {!activate && <a href="#" className="confirmation">Email verification is required to view your submissions</a>}
        <div className="header">
            <span>
                <p className="nameLabel">Username</p>
                <p className="usName">{user}</p>
            </span>
            <span>
                <p className="nameLabel">Email</p>
                <p className="usName">{email}</p>
            </span>
            
        </div>
        {activate && <div className="encloseTable">
            <table>
                <thead>
                <tr>
                    <th>Message</th>
                    <th>Date</th>
                </tr>
                </thead>
                <tbody>
                {subs && 
                    subs.map(item => (
                        <tr key={item.id}>
                            <td className="message">{item.message}</td>
                            <td className="date">{formatDate(item.date)}</td>  
                        </tr>
                    ))
                }
                </tbody>
            </table>
        </div>}
            
        </div>
    )
}