import { useState, useEffect } from 'react';
import './App.css';
import { users } from './config/users';

const userMap = {};
users.forEach(user => {
  // Map both full email and username part for matching
  userMap[user.email.toLowerCase()] = user;
  // Add mapping for username part (before @) to handle variations
  const username = user.email.split('@')[0].toLowerCase();
  userMap[username] = user;
});

const SECTIONS = [
  { title: "YTD Revenue Leaders", valueKey: "YTD 2025 $", dealsKey: "YTD Deals" },
  { title: "May Revenue Leaders", valueKey: "May 2025 $", dealsKey: "May Deals" },
  { title: "April Revenue Leaders", valueKey: "April 2025 $", dealsKey: "April Deals" },
  { title: "This Week's Leaders", valueKey: "Week $", dealsKey: "Week Deals" },
  { title: "May Calls Leaderboard", valueKey: "May Calls", isCalls: true }
];

function LeaderboardSection({ title, data, valueKey, dealsKey, isCalls, isActive }) {
  const sortedData = [...data]
    .filter(person => person[valueKey] > 0)
    .sort((a, b) => b[valueKey] - a[valueKey])
    .slice(0, 10);  // Show top 10

  // Calculate totals
  const totals = data.reduce((acc, person) => {
    acc.value += person[valueKey] || 0;
    if (dealsKey) {
      acc.deals += person[dealsKey] || 0;
    }
    return acc;
  }, { value: 0, deals: 0 });

  return (
    <div className={`leaderboard-section ${isActive ? 'active' : ''}`}>
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        <div className="section-totals">
          <div className="total-item">
            <span className="total-label">{isCalls ? 'Total Calls:' : 'Total Revenue:'}</span>
            <span className="total-value">
              {isCalls 
                ? `${totals.value.toLocaleString()} calls`
                : `$${totals.value.toLocaleString()}`
              }
            </span>
          </div>
          {!isCalls && dealsKey && (
            <div className="total-item">
              <span className="total-label">Total Deals:</span>
              <span className="total-value">{totals.deals.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
      <ul className="leaderboard-list">
        {sortedData.map((person, index) => {
          const email = person.email?.toLowerCase();
          // Try to match by email or username part
          const username = email?.split('@')[0];
          const user = userMap[email] || userMap[username];
          const rank = index + 1;
          return (
            <li key={email} className={`leaderboard-item rank-${rank}`}>
              <div className="rank">
                {rank}
                {rank <= 3 && <div className={`crown crown-${rank}`} />}
              </div>
              <div className="person-info">
                {user?.image && (
                  <div className="profile">
                    <img src={user.image} alt={user?.name || email} />
                  </div>
                )}
                <div className="info">
                  <div className="person-name">{user?.name || email}</div>
                  <div className="email">{email}</div>
                </div>
              </div>
              <div className="stats">
                <div className="amount">
                  {isCalls ? 
                    `${person[valueKey]} calls` : 
                    `$${person[valueKey].toLocaleString()}`
                  }
                </div>
                {!isCalls && dealsKey && (
                  <div className="deals">
                    <span className="deals-number">{person[dealsKey]}</span>
                    <span className="deals-label">deals</span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
        {sortedData.length === 0 && (
          <li className="leaderboard-item">No data available</li>
        )}
      </ul>
    </div>
  );
}

function App() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(process.env.REACT_APP_GOOGLE_SHEETS_URL);
        const data = await response.json();
        
        if (data && data.leaderboard) {
          setRawData(data.leaderboard);
          setError(null);
        } else {
          throw new Error('Invalid data format');
        }
      } catch (error) {
        console.error("Error:", error);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Cycle through sections every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSection(current => (current + 1) % SECTIONS.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handlePrevious = () => {
    setCurrentSection(current => 
      current === 0 ? SECTIONS.length - 1 : current - 1
    );
  };

  const handleNext = () => {
    setCurrentSection(current => 
      (current + 1) % SECTIONS.length
    );
  };

  if (loading) return <div className="loading">Loading sales data...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!rawData.length) return <div>No data available</div>;

  return (
    <div className="App">
      <header>
        <img src="/lb-logo-blue-white.png" alt="Lucid Bots Logo" className="logo" />
      </header>
      <main className="leaderboards-container">
        <button className="nav-arrow prev" onClick={handlePrevious}>
          ‹
        </button>
        {SECTIONS.map((section, index) => (
          <LeaderboardSection
            key={section.title}
            title={section.title}
            data={rawData}
            valueKey={section.valueKey}
            dealsKey={section.dealsKey}
            isCalls={section.isCalls}
            isActive={currentSection === index}
          />
        ))}
        <button className="nav-arrow next" onClick={handleNext}>
          ›
        </button>
      </main>
    </div>
  );
}

export default App;
