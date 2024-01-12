import React from "react";



export default function Tables(data){
    return(
        {Object.keys(data).length > 0} ?
        <table>
            <tr>
                <td>{data[key].name}</td>
                <td>{data[key].email}</td>
                <td>{data[key].subject}</td>
                <td>{data[key].message}</td>
            </tr>
            Object.values(data).map((key, idx)=>{
                return(
                    <div key={idx}>
                        <tr>
                            <td>{data[key].name}</td>
                            <td>{data[key].email}</td>
                            <td>{data[key].subject}</td>
                            <td>{data[key].message}</td>
                        </tr>
                    </div>
                )
            
            })
        </table>
        :
        <p>The database contains 0 entries. Please submit your remarks</p>
      
    )
}