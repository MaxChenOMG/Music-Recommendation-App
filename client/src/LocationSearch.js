import React, { useEffect, useState } from "react";

import TextField from '@mui/material/TextField';
import { Button} from "@material-ui/core";


const LocationSearch = () => {
    const[textValue, setTextValue] = useState("");
    const handleSubmit = (event) => {
        event.preventDefault();
        alert('submitted')
    }
    return(
    <div>
    <h2> Enter Location: </h2>
    <form action="/" method="get">
        <TextField
                required
                fullWidth
                onChange={(e) => setTextValue(e.target.value)}
                value ={textValue}
                type="text"
            />
        
        <Button variant = "contained" onClick = {handleSubmit}>Generate Weather Playlist</Button>
    </form>
    </div>
    )
};


export default LocationSearch;