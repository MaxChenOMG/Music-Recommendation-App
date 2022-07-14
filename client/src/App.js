import React from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Header from "./Header";

// 'URLSearchParams(window.location.search)' will get url string after the '?' & .get() will get the code value from the url
const code = new URLSearchParams(window.location.search).get('code')

function App() {
  return (
    <div className="app">
      <Header/>
      {code ? <Dashboard code={code} /> : <Login />}
      
    </div>
  );
}

export default App;