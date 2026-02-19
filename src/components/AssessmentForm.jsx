import React, { useState } from 'react';
import { questions, options } from '../data/questions';
import './AssessmentForm.css';

const AssessmentForm = () => {
    const [responses, setResponses] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [category, setCategory] = useState('');
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleOptionChange = (questionId, value) => {
        setResponses((prev) => ({
            ...prev,
            [questionId]: value,
        }));
    };

    const calculateResults = async () => {
        // 1. Calculate Score
        let totalScore = 0;
        const weakDomains = [];

        questions.forEach((q) => {
            const val = responses[q.id] || 0;
            totalScore += val;

            // Agent Logic: Value strictly less than 2 (i.e., 1 "Never")
            if (val < 2) {
                weakDomains.push(q.domain);
            }
        });

        setScore(totalScore);

        // 2. Determine Category
        let cat = '';
        if (totalScore < 13) cat = 'Poor';
        else if (totalScore <= 19) cat = 'Moderate';
        else if (totalScore <= 25) cat = 'Good';
        else cat = 'Excellent';
        setCategory(cat);

        setSubmitted(true);
        setLoading(true);
        setError(null);

        // 3. API Integration
        try {
            if (weakDomains.length > 0) {
                const response = await fetch('http://localhost:5000/api/recommendation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ domains: weakDomains }),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch recommendations');
                }

                const data = await response.json();
                // Assuming API returns { recommendations: [...] } or just an array
                setRecommendations(data.recommendations || data || []);
            } else {
                setRecommendations(['Keep up the great work! Your lifestyle habits are strong.']);
            }
        } catch (err) {
            console.error(err);
            setError('Could not load personalized recommendations. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const isFormComplete = questions.every((q) => responses[q.id]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isFormComplete) {
            calculateResults();
        }
    };

    const handleRetake = () => {
        setResponses({});
        setSubmitted(false);
        setScore(0);
        setCategory('');
        setRecommendations([]);
        setError(null);
    };

    if (submitted) {
        return (
            <div className="assessment-container results-container">
                <h2>Your Lifestyle Assessment Result</h2>
                <div className="score-display">{score} / {questions.length * 4}</div>
                <div className="category-display">Category: <strong>{category}</strong></div>

                {loading && (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Generating personalized advice...</p>
                    </div>
                )}

                {error && <div className="error-message">{error}</div>}

                {!loading && !error && recommendations.length > 0 && (
                    <div className="recommendations-section">
                        <h3 className="rec-title">Personalized Recommendations for You:</h3>
                        <ul className="rec-list">
                            {recommendations.map((rec, index) => (
                                <li key={index} className="rec-item">{rec}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <button className="submit-btn" onClick={handleRetake} style={{ marginTop: '2rem' }}>
                    Retake Assessment
                </button>
            </div>
        );
    }

    return (
        <div className="assessment-container">
            <h1 className="assessment-title">Health-Promoting Lifestyle Assessment</h1>
            <form onSubmit={handleSubmit}>
                {questions.map((q) => (
                    <div key={q.id} className="question-card">
                        <div className="question-text">{q.text}</div>
                        <div className="options-container">
                            {options.map((opt) => (
                                <label
                                    key={opt.value}
                                    className={`option-label ${responses[q.id] === opt.value ? 'selected' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name={`question-${q.id}`}
                                        value={opt.value}
                                        checked={responses[q.id] === opt.value}
                                        onChange={() => handleOptionChange(q.id, opt.value)}
                                        className="radio-input"
                                        style={{ display: 'none' }}
                                    />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                    </div>
                ))}

                <button type="submit" className="submit-btn" disabled={!isFormComplete}>
                    {isFormComplete ? 'Get My Results' : 'Please Answer All Questions'}
                </button>
            </form>
        </div>
    );
};

export default AssessmentForm;
