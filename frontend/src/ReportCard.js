import './ReportCard.css';
import { useEffect, useState } from 'react';
import generateRatings from './generateRatings'

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

    const handleLogout = () => {
        if (window.localStorage.access_token) window.localStorage.removeItem('access_token');
        window.location.reload();
    }

    return ratings ? (
        <>
            <button 
            className='logout-button'
            onClick={handleLogout}>
                Log Out
            </button>
            <Card grades={ratings ? ratings : {}}/>
        </>
    ) : (
        <div className="spinner-container">
            <div className="spinner"></div>
            <p>Analyzing your taste...</p>
        </div>
    )
}

function Card({ grades }) {
    return (
        <div className="report-card-container">
            <GradeRow category="Uniqueness" grade={grades.uniqueRating} animationClass="fade-in-1" index={1} />
            <GradeRow category="Based on Critic Ratings" grade={grades.basedRating} animationClass="fade-in-2" index={2}/>
            <GradeRow category="Taste Diversity" grade={grades.expansiveRating} animationClass="fade-in-3" index={3}/>
            <div className="grade-row fade-in-4">
                <div className="grade-info">
                    <h2>Final Rating</h2>
                    <p>{useCountUpAnimation(grades.finalRating, 2000, 4).toFixed(1)}%</p>
                </div>
                <div className="grade-bar-container">
                    <div 
                        className="grade-bar" 
                        style={{ 
                            '--width': `${grades.finalRating}%`,
                            animationDelay: `${3 * 0.8}s` 
                                }}
                    ></div>
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
                <p>{animatedValue.toFixed(1)}%</p>
            </div>
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