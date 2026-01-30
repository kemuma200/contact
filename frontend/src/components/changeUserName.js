import React, {useState} from "react";




export default  function ChangeDetails(){
    const [deets, setDeets] = useState(email)

    return(
        <div>
            <p>{response}</p>
            <form>
                <div>
                    <label>{deets}</label>
                    <input type={deets === 'email' ? 'email' : 'text'}/>
                </div>
                <input type="submit"/>
            </form>
            <span>
                <a href="/login">Login</a>
                <a href='/'>Leave a message</a>
            </span>
        </div>

    )
}