import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { Search, Loader2, RefreshCw } from 'lucide-react';

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [query, setQuery] = useState('baby formula');
  const [postalCode, setPostalCode] = useState('N9G2N5');
  const [activeFilter, setActiveFilter] = useState('All');
  
  const [sortBy, setSortBy] = useState('relevance');
  const [brandFilter, setBrandFilter] = useState('');
  
  const fetchDeals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/flipp', {
        params: {
          locale: 'en-ca',
          postal_code: postalCode.replace(/\s/g, ''),
          q: query
        }
      });
      
      const fetchedItems = response.data.items || [];
      const uniqueItems = fetchedItems.reduce((acc, current) => {
        const x = acc.find(item => item.name === current.name && item.merchant_name === current.merchant_name);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);
      
      setItems(uniqueItems);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data. Ensure your postal code is valid.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const merchants = ['All', ...new Set(items.map(i => i.merchant_name))].sort();
  
  const filteredItems = items
    .filter(item => activeFilter === 'All' ? true : item.merchant_name === activeFilter)
    .filter(item => brandFilter ? item.name.toLowerCase().includes(brandFilter.toLowerCase()) : true)
    .filter(item => {
      if (query.toLowerCase().includes('formula') || query.toLowerCase() === '') {
        const name = item.name.toLowerCase();
        const kws = ['formula', 'similac', 'enfamil', 'kendamil', 'good start', "parent's choice", 'nutramigen', 'alimentum', 'puramino', 'neocate', 'elecare', 'milupa', 'infant powder', 'toddler drink'];
        return kws.some(kw => name.includes(kw)) && !name.includes('bottle') && !name.includes('nipple') && !name.includes('pacifier') && !name.includes('wipes');
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return (a.current_price || 9999) - (b.current_price || 9999);
      if (sortBy === 'price-high') return (b.current_price || 0) - (a.current_price || 0);
      return 0; // relevance
    });

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchDeals();
  };

  return (
    <div className="app-container">
      <header className="header" style={{ position: 'relative' }}>
        <h1>Baby Formula Finder</h1>
        <p>Live deals from your local stores</p>
      </header>

      <form className="search-section" onSubmit={handleSubmit} style={{ alignItems: 'flex-end' }}>
        <div className="input-group">
          <label htmlFor="query">Search Item</label>
          <input 
            id="query"
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., baby formula, diapers"
          />
        </div>
        <div className="input-group">
          <label htmlFor="postal">Postal Code</label>
          <input 
            id="postal"
            type="text" 
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="e.g., N9G 2N5"
          />
        </div>
        <button type="button" onClick={fetchDeals} disabled={loading} style={{ background: 'var(--success)', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', height: '42px', transition: 'background 0.2s' }}>
          <RefreshCw className={loading ? "animate-spin" : ""} size={20} />
          Refresh Live Data
        </button>
      </form>

      {items.length > 0 && !loading && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', padding: '1rem 1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 2, minWidth: '300px' }}>
            <span style={{color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', alignSelf: 'center', marginRight: '0.5rem'}}>Stores:</span>
            {merchants.map(merchant => (
              <button
                key={merchant}
                className={`filter-btn ${activeFilter === merchant ? 'active' : ''}`}
                onClick={() => setActiveFilter(merchant)}
              >
                {merchant}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            <div className="input-group" style={{minWidth: '150px', flex: 1}}>
              <input 
                type="text" 
                placeholder="Filter by brand..." 
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div className="input-group" style={{minWidth: '180px', flex: 1}}>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{ 
                  padding: '0.75rem 1rem', 
                  borderRadius: '0.5rem', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  background: 'rgba(0,0,0,0.2)', 
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  width: '100%'
                }}
              >
                <option value="relevance" style={{background: 'var(--bg-card)'}}>Sort: Relevance</option>
                <option value="price-low" style={{background: 'var(--bg-card)'}}>Price: Low to High</option>
                <option value="price-high" style={{background: 'var(--bg-card)'}}>Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading">
          <Loader2 className="animate-spin" size={48} style={{margin: '0 auto', marginBottom: '1rem'}} />
          <p>Scouring local flyers for new sales...</p>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {!loading && !error && filteredItems.length === 0 && (
        <div className="no-results">No deals found matching your filters.</div>
      )}

      {!loading && !error && filteredItems.length > 0 && (
        <div className="grid">
          {filteredItems.map(item => (
            <div className="card" key={item.id}>
              <div className="card-img-container">
                <div className="merchant-badge">
                  <img src={item.merchant_logo} alt={item.merchant_name} />
                  <span>{item.merchant_name}</span>
                </div>
                <img src={item.clean_image_url} alt={item.name} className="card-img" />
              </div>
              <div className="card-content">
                <h3 className="card-title">{item.name}</h3>
                <div className="price-section">
                  <div className="current-price">
                    ${item.current_price ? item.current_price.toFixed(2) : '???'}
                  </div>
                  {item.post_price_text && (
                    <div className="sale-story">{item.post_price_text}</div>
                  )}
                  {item.sale_story && (
                    <div className="sale-story" style={{color: 'var(--accent)', marginTop: '4px'}}>
                      {item.sale_story}
                    </div>
                  )}
                  <div className="validity">
                    Valid: {item.valid_from ? format(parseISO(item.valid_from), 'MMM d') : '?'} - {item.valid_to ? format(parseISO(item.valid_to), 'MMM d, yyyy') : '?'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
