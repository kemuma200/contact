import React from "react";




export default  function ForgotPwd(){

    return(
        <div>
            <p>{response}</p>
            <form>
                <div>
                    <label>Email</label>
                    <input type="email"/>
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