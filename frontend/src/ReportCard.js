import './ReportCard.css';
import { useEffect, useState } from 'react';
import generateRatings from './generateRatings';
import spotifyLogo from './spotify_logo.png';

export default function ReportCard() {
    const [ratings, setRatings] = useState(null);

    const getRatings = async () => {
        const ratings = await generateRatings();
        console.log(ratings);
        setRatings(ratings);
    }

    useEffect(() => {
        getRatings();
    }, []);

    return ratings ? (
        <>
            <Card grades={ratings ? ratings : {}}/>
            <div className='ratings-breakdown'> 
                <RatingsBreakdown ratings={ratings ? ratings : {}} />
                <img src={spotifyLogo} className="spotify-logo" alt="Spotify Logo"/>
            </div>
        </>
    ) : (
        <div className="spinner-container">
            <div className="spinner"></div>
            <p>Analyzing your taste...</p>
        </div>
    )
}

function Card({ grades }) {
    const handleLogout = () => {
      if (window.localStorage.access_token) window.localStorage.removeItem('access_token');
      window.location.reload();
    }
    return (
        <div className="report-card-container">
            <button 
            className='logout-button'
            onClick={handleLogout}>
                Log Out
            </button>
            <div className="header">
                <h1 className="card-header"> rate my spotify. </h1>
                <h2 className="plug-link"> at coolify.app </h2>
            </div>
            <GradeRow category="Uniqueness" grade={grades.uniqueRating} animationClass="fade-in-1" index={1} />
            <GradeRow category="Critical Acclaim" grade={grades.basedRating} animationClass="fade-in-2" index={2}/>
            <GradeRow category="Versatility" grade={grades.expansiveRating} animationClass="fade-in-3" index={3}/>
            <div className="grade-row fade-in-4 final">
                <div className="grade-info">
                    <h2 className="final-title">Final Rating</h2>
                </div>
                <div className="grade-bar-section">
                <p className="score final final-num">{useCountUpAnimation(grades.finalRating, 2000, 4).toFixed(0)}</p>
                <div className="grade-bar-container">
                    <div 
                        className="grade-bar-final" 
                        style={{ 
                            '--width': `${grades.finalRating}%`,
                            animationDelay: `${(3) * 0.8}s` 
                                }}
                    ></div>
                </div>
            </div>
            </div>
        </div>
    );
}

  function GradeRow({ category, grade, animationClass, index }) {
    const { letter, percent } = {letter: "S+", percent: grade.finalScore};
    const animatedValue = useCountUpAnimation(grade.finalScore, 2000, index);

    return (
        <div className={"grade-row " + animationClass}>
            <div className="grade-info">
                <h2>{category}</h2>
            </div>
            <div className="grade-bar-section">
                <p className="score">{animatedValue.toFixed(0)}</p>
                <div className="grade-bar-container">
                    <div 
                        className="grade-bar" 
                        style={{ 
                            '--width': `${percent}%`,
                            animationDelay: `${(index - 1) * 0.8}s` 
                                }}
                    ></div>
                </div>
            </div>
        </div>
    );
}

function useCountUpAnimation(targetValue, duration, index) {
    const [value, setValue] = useState(0);
  
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        let start = null;
        let animationFrameId;
  
        const step = (timestamp) => {
          if (!start) start = timestamp;
          const progress = timestamp - start;
          const currentValue = Math.min((progress / duration) * targetValue, targetValue);
          setValue(currentValue);
          if (progress < duration) {
            animationFrameId = window.requestAnimationFrame(step);
          }
        };
  
        animationFrameId = window.requestAnimationFrame(step);
  
        return () => {
          window.cancelAnimationFrame(animationFrameId);
        };
      }, (index - 1)* 800); 
  

      return () => {
        clearTimeout(timeoutId);
      };
    }, [targetValue, duration, index]);
  
    return value;
  }

  const RatingsBreakdown = ({ ratings }) => {
    const { acclaim, uniqueness, versatility } = { acclaim: ratings.basedRating, uniqueness: ratings.uniqueRating, versatility: ratings.expansiveRating }
    return (
      <div className="ratings-breakdown">
        <h2 className="rating-breakdown">Your Rating Breakdown</h2>

        <section className="uniqueness-section">
          <h3>Uniqueness</h3>
          <p>
            We believe a unique music taste incorporates a variety from unknown/underground to popular artists.
            Your range of artist popularities spans from <strong>{uniqueness.artistRange.obscure.name}</strong> with a popularity score of <strong>{uniqueness.artistRange.obscure.popularity}</strong>
            , to <strong>{uniqueness.artistRange.popular.name}</strong> with a popularity score of <strong>{uniqueness.artistRange.popular.popularity}</strong>. 
            Popularity scores are based on Spotify's own data.
          </p>
        </section>
        
        <section className="acclaim-section">
          <h3>Critical Acclaim</h3>
          <p>
            This rating is influenced by the critical reception of your top artists' albums according to <a href="https://rateyourmusic.com">rateyourmusic.com</a>.
            Your highest rated artist is <strong>{acclaim.bestArtist.name}</strong> with a maximum album rating of <strong>{acclaim.bestArtist.maxRating}</strong>.
          </p>
        </section>
  
        <section className="versatility-section">
          <h3>Versatility</h3>
          <p>
            A versatile music taste incorporates a wide range of genres, time periods, and cultural backgrounds.
            Your top artists come from countries such as <strong>{versatility.countries.join(", ")}</strong>. 
            The year range of your top tracks is <strong> {versatility.yearsInfo.range}</strong>, with your average listened year being <strong> {versatility.yearsInfo.avg} </strong>
            and your genre score is <strong>{versatility.genreScore.toFixed(2)}</strong>, which is calculated based on the variety of genres of your top artists and tracks.
          </p>
        </section>
  
      </div>
    );
  };