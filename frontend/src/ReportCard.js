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
        <> Analyzing your taste... </>
    )
}

function Card({ grades }) {
    return (
        <div className="report-card-container">
            <GradeRow category="Uniqueness" grade={grades.uniqueRating} />
            <GradeRow category="Based on Critic Ratings" grade={grades.basedRating} />
            <GradeRow category="Taste Diversity" grade={grades.expansiveRating} />
            <div className="grade-row">
                <div className="grade-info">
                    <h2>Final Rating</h2>
                    <p>{grades.finalRating}%</p>
                </div>
                <div className="grade-bar-container">
                    <div className="grade-bar" style={{ width: `${grades.finalRating}%` }}></div>
                </div>
            </div>
        </div>
    );
}

  function GradeRow({ category, grade }) {
    const { letter, percent } = {letter: "S+", percent: grade.finalScore};

    return (
        <div className="grade-row">
            <div className="grade-info">
                <h2>{category}</h2>
                <p>{percent}%</p>
            </div>
            <div className="grade-bar-container">
                <div className="grade-bar" style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    );
}