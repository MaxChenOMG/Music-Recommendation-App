import React, { useEffect, useState } from "react";
import ReactDOM from 'react-dom';
import useAuth from "./useAuth";
import SpotifyWebApi from "spotify-web-api-node";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { Button, Paper } from "@material-ui/core";
import LocationSearch from "./LocationSearch";



// Setting the spotifyApi, so that we can use it's functions
// const spotifyApi = new SpotifyWebApi({
//   clientId: "321a38c5ee4e42b29d5407bbb9e44c88",
// });

const Dashboard = ({ code }) => {

    const playlists = [
        {name: 'PartyHits', owner: 'Jack', url: 'google.com'},
        {name: 'CafeVibes', owner: 'Amy', url: '123.com'},
        {name: 'LateNight', owner: 'Dan', url: 'xyz.com'}
    ]
  return (
    <div>
        <LocationSearch/>
        
        <table>
            <thead>
                <th>Playlist Name</th>
                <th>Owner</th>
                <th>Link</th>
            </thead>
            <tbody>
                {
                    playlists.map((playlist, index) =>
                        <tr key={index}>
                            <td>{playlist.name}</td>
                            <td>{playlist.owner}</td>
                            <td>{playlist.url}</td>
                        </tr>
                )}
            </tbody>
        </table>
    </div>
    
  );
};

export default Dashboard;