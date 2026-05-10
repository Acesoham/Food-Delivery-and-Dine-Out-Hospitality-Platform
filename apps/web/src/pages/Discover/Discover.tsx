import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, Clock, Filter, Loader2 } from 'lucide-react';
import { restaurantApi } from '../../services/endpoints';
import type { IRestaurant } from 'shared-types';
import './Discover.css';

const CUISINE_FILTERS = ['All', 'Indian', 'Italian', 'Chinese', 'Japanese', 'American', 'Thai', 'Mexican'];

export const Discover = () => {
  const [restaurants, setRestaurants] = useState<(IRestaurant & { distanceInKm?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [userLocation, setUserLocation] = useState({ lat: 12.9716, lng: 77.5946 }); // Default: Bangalore

  useEffect(() => {
    // Try getting user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log('Using default location')
      );
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [userLocation, selectedCuisine, search]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params: any = {
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: 15000,
        limit: 20,
      };
      if (selectedCuisine !== 'All') params.cuisine = selectedCuisine;
      if (search) params.search = search;

      const { data } = await restaurantApi.discover(params);
      setRestaurants(data.data || []);
    } catch (err) {
      console.error('Discovery error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="discover-page page">
      <div className="container">
        <div className="discover-header">
          <h1>Discover Restaurants</h1>
          <p>Find the best food near you</p>
        </div>

        {/* Search + Filters */}
        <div className="discover-controls">
          <div className="search-bar">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search restaurants, cuisines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="cuisine-filters">
            <Filter size={16} />
            {CUISINE_FILTERS.map((c) => (
              <button
                key={c}
                className={`filter-chip ${selectedCuisine === c ? 'active' : ''}`}
                onClick={() => setSelectedCuisine(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="results-loading">
            <Loader2 size={32} className="spin" />
            <p>Finding restaurants near you...</p>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="no-results">
            <p>🍽️ No restaurants found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="restaurant-grid">
            {restaurants.map((r) => (
              <Link to={`/restaurant/${r._id}`} key={r._id} className="restaurant-card card">
                <div className="restaurant-img">
                  <img
                    src={r.images?.[0] || `https://picsum.photos/seed/${r._id}/400/250`}
                    alt={r.name}
                    loading="lazy"
                  />
                  <div className="restaurant-badges">
                    {r.distanceInKm !== undefined && (
                      <span className="badge badge-info">
                        <MapPin size={12} /> {r.distanceInKm} km
                      </span>
                    )}
                    <span className="badge badge-primary">
                      {'₹'.repeat(r.priceRange)}
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  <h3 className="restaurant-name">{r.name}</h3>
                  <p className="restaurant-cuisines">{r.cuisineTypes.join(' • ')}</p>
                  <div className="restaurant-meta">
                    <span className="restaurant-rating">
                      <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                      {r.rating.average} <span className="rating-count">({r.rating.count})</span>
                    </span>
                    <span className="restaurant-time">
                      <Clock size={14} /> 25-35 min
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
