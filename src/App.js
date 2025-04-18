import { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import { users } from './config/users';

const ROTATION_INTERVAL = 5000; // 5 seconds
const GOOGLE_SHEETS_URL = process.env.REACT_APP_GOOGLE_SHEETS_URL;

// Users to exclude from leaderboard
const EXCLUDED_USERS = ['rtuttle@luciddronetech.com@lucidbots.com', 'unknown.rep@lucidbots.com'];

// Create a map of email to user data for quick lookup
const userMap = Object.fromEntries(
  users.map(user => [user.email, user])
);

function App() {
  const [currentView, setCurrentView] = useState('ytd-2025');
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const VIEWS = ['ytd-2025', 'week', 'jan-2025', 'feb-2025', 'mar-2025', 'apr-2025'];
  
  // Calculate totals
  const calculateTotals = useCallback(() => {
    if (!salesData.length) return { viewTotal: 0, viewDeals: 0 };
    
    return {
      viewTotal: salesData.reduce((sum, person) => {
        let amount;
        if (currentView === 'ytd-2025') {
          amount = person['ytd-2025AmountNum'];
        } else {
          amount = person[`${currentView}AmountNum`] || 0;
        }
        return sum + amount;
      }, 0),
      viewDeals: salesData.reduce((sum, person) => {
        let deals;
        if (currentView === 'ytd-2025') {
          deals = person['ytd-2025Deals'];
        } else {
          deals = person[`${currentView}Deals`];
        }
        return sum + (parseInt(deals) || 0);
      }, 0)
    };
  }, [salesData, currentView]);

  // Fetch data only once when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (dataLoaded) return; // Skip if data is already loaded

      try {
        setLoading(true);
        const response = await fetch(GOOGLE_SHEETS_URL, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received');
        }

        // Process data and filter out excluded users
        const processedData = data
          .filter(person => !EXCLUDED_USERS.includes(person.email)) // Remove excluded users
          .map(person => {
            // Clean up email by removing any duplicate @lucidbots.com
            const email = person.email?.replace(/@lucidbots\.com@lucidbots\.com$/, '@lucidbots.com')
                                     ?.replace(/@luciddronetech\.com@lucidbots\.com$/, '@luciddronetech.com');
            
            // Parse amounts with field names matching the Google Apps Script exactly
            const processedPerson = {
              ...person,
              email,
              name: person.name,
              allTimeAmountNum: parseFloat(person.allTimeAmount) || 0,
              allTimeDeals: parseInt(person.allTimeDeals) || 0,
              'weekAmountNum': parseFloat(person.weekAmount) || 0,
              'weekDeals': parseInt(person.weekDeals) || 0,
              'jan-2025AmountNum': parseFloat(person['jan-2025Amount']) || 0,
              'jan-2025Deals': parseInt(person['jan-2025Deals']) || 0,
              'feb-2025AmountNum': parseFloat(person['feb-2025Amount']) || 0,
              'feb-2025Deals': parseInt(person['feb-2025Deals']) || 0,
              'mar-2025AmountNum': parseFloat(person['mar-2025Amount']) || 0,
              'mar-2025Deals': parseInt(person['mar-2025Deals']) || 0,
              'apr-2025AmountNum': parseFloat(person['apr-2025Amount']) || 0,
              'apr-2025Deals': parseInt(person['apr-2025Deals']) || 0,
              // Calculate YTD totals from monthly data
              'ytd-2025AmountNum': parseFloat(person['jan-2025Amount'] || 0) +
                                  parseFloat(person['feb-2025Amount'] || 0) +
                                  parseFloat(person['mar-2025Amount'] || 0) +
                                  parseFloat(person['apr-2025Amount'] || 0),
              'ytd-2025Deals': parseInt(person['jan-2025Deals'] || 0) +
                              parseInt(person['feb-2025Deals'] || 0) +
                              parseInt(person['mar-2025Deals'] || 0) +
                              parseInt(person['apr-2025Deals'] || 0)
            };
            
            // Debug log for 2024 data
            console.log('Processing person:', {
              name: person.name,
              raw2024Data: person['2024Amount'],
              processed2024Amount: processedPerson['2024AmountNum'],
              processed2024Deals: processedPerson['2024Deals']
            });
            
            return processedPerson;
          });
        
        // Debug logs to see the data structure
        console.log('First row of processed data:', processedData[0]);
        
        setSalesData(processedData);
        setLastUpdated(new Date());
        setDataLoaded(true);
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(`Failed to load sales data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  // View rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentView(prev => {
        const currentIndex = VIEWS.indexOf(prev);
        return VIEWS[(currentIndex + 1) % VIEWS.length];
      });
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Sort data based on current view
  const sortedData = useMemo(() => {
    if (!salesData.length) return [];
    
    return [...salesData]
      .filter(person => {
        let amount;
        if (currentView === 'ytd-2025') {
          amount = person['ytd-2025AmountNum'];
        } else {
          amount = person[`${currentView}AmountNum`];
        }
        return amount > 0; // Filter out zero amounts
      })
      .sort((a, b) => {
        let aAmount, bAmount;
        if (currentView === 'ytd-2025') {
          aAmount = a['ytd-2025AmountNum'];
          bAmount = b['ytd-2025AmountNum'];
        } else {
          aAmount = a[`${currentView}AmountNum`];
          bAmount = b[`${currentView}AmountNum`];
        }
        return bAmount - aAmount;
      });
  }, [salesData, currentView]);

  const getViewTitle = (view) => {
    switch(view) {
      case 'ytd-2025':
        return '2025 Year to Date Leaders';
      case 'week':
        return 'This Week\'s Sales Leaders';
      case 'jan-2025':
        return 'January 2025 Sales Leaders';
      case 'feb-2025':
        return 'February 2025 Sales Leaders';
      case 'mar-2025':
        return 'March 2025 Sales Leaders';
      case 'apr-2025':
        return 'April 2025 Sales Leaders';
      default:
        return '';
    }
  };

  // Add rank suffix
  const getRankSuffix = (rank) => {
    if (rank === 1) return 'st';
    if (rank === 2) return 'nd';
    if (rank === 3) return 'rd';
    return 'th';
  };

  if (loading && !salesData.length) {
    return (
      <div className="App">
        <div className="logo-container">
          {/* Add your logo here */}
          <img src="/logo.png" alt="Company Logo" className="company-logo" />
        </div>
        <div className="leaderboard loading">
          <div className="loading-spinner"></div>
          <h1>Loading Sales Champions...</h1>
        </div>
      </div>
    );
  }

  if (error && !salesData.length) {
    return (
      <div className="App">
        <div className="logo-container">
          <img src="/logo.png" alt="Company Logo" className="company-logo" />
        </div>
        <div className="leaderboard error">
          <h1>Error</h1>
          <p>{error}</p>
          <button onClick={() => {
            setDataLoaded(false);
            setError(null);
          }} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="top-section">
        <div className="logo-container">
          <img src="/logo.png" alt="Company Logo" className="company-logo" />
        </div>
        <div className="header-content">
          <h1>{getViewTitle(currentView)}</h1>
          {lastUpdated && (
            <div className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
        <div className="totals-container">
          <div className="total-item">
            <span className="total-label">
              {currentView === 'ytd-2025' ? '2025 YTD Total' :
               currentView === 'week' ? 'This Week\'s Total' :
               currentView === 'jan-2025' ? 'January Total' :
               currentView === 'feb-2025' ? 'February Total' :
               currentView === 'mar-2025' ? 'March Total' :
               currentView === 'apr-2025' ? 'April Total' :
               'Total'}
            </span>
            <span className="total-amount">${calculateTotals().viewTotal.toLocaleString()}</span>
            <span className="total-deals">{calculateTotals().viewDeals.toLocaleString()} Deals</span>
          </div>
        </div>
      </div>
      <div className="leaderboard">
        <div className="leaderboard-content">
          {sortedData.map((person, index) => {
            const userData = userMap[person.email];
            const rank = index + 1;
            const amount = currentView === 'ytd-2025' 
              ? person['ytd-2025AmountNum'] 
              : person[`${currentView}AmountNum`];
            const deals = currentView === 'ytd-2025'
              ? person['ytd-2025Deals']
              : person[`${currentView}Deals`];
            
            return (
              <div key={person.email} className={`leaderboard-row rank-${rank}`}>
                <div className="rank">
                  <span className="rank-number">{rank}</span>
                  <span className="rank-suffix">{getRankSuffix(rank)}</span>
                </div>
                <div className="profile-info">
                  <div className="profile">
                    <img 
                      src={userData?.image || '/profile-pictures/default.png'}
                      alt={userData?.name || person.email}
                      onError={(e) => {
                        e.target.src = '/profile-pictures/default.png';
                      }}
                    />
                  </div>
                  <div className="info">
                    <div className="name">{userData?.name || person.email}</div>
                    <div className="email">{person.email}</div>
                  </div>
                </div>
                <div className="stats">
                  <div className="amount">${amount.toLocaleString()}</div>
                  <div className="deals">
                    <span className="deals-number">{deals || 0}</span>
                    <span className="deals-label">deals</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
