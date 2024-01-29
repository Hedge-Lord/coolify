import { initiateAuth, handleAuthRedirect } from './spotifyAuth';
import {useEffect} from 'react'
import './Login.css'

function Login({ onLoginSuccess }) {  
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        console.log(code, urlParams);

        if (code) {
            handleAuthRedirect()
                .then(() => {
                  onLoginSuccess();
                })
                .catch(error => {
                    console.error('Error during authentication:', error);
                });
        } else {
            console.log("error")
        }
    }, []);

    const handleLogin = async () => {
      try {
          await initiateAuth();
          // No need to reload the page here
      } catch (error) {
          console.error('Error during authentication:', error);
      }
  };

    return (
      <div className="main-container">
        <div className="content">
          <h1> rate my spotify. </h1>
          <button onClick={handleLogin} className="login-button">
            Login with Spotify
          </button>
        </div>
      </div>
    );
  }
  
  export default Login;