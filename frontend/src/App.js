import React, { useEffect, useState } from 'react';
import Login from './Login';
import ReportCard from './ReportCard';


function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = window.localStorage.getItem('access_token');
        if (token) {
          setIsLoggedIn(true);
        } 
        else setIsLoggedIn(false);
      }, []);

      const handleLoginSuccess = () => {
        setIsLoggedIn(true);
      };

    return isLoggedIn ? (
        <>
            <ReportCard />
        </>
    ) : (
        <>
            <Login onLoginSuccess={handleLoginSuccess}/>
        </>
    );
}


export default App;