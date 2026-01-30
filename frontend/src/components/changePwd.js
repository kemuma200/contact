import React from "react";




export default  function ChangePwd(){

    return(
        <div>
            <p>{response}</p>
            <form>
                <div>
                    <label>Password sent in email</label>
                    <input type="text"/>
                </div>
                <div>
                    <label>New Password</label>
                    <input type="text"/>
                </div>
                <div>
                    <label>Confirm Password</label>
                    <input type="text"/>
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