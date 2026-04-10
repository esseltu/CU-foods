import { useState, useEffect } from 'react'
import MapView from './components/MapView'
import { getSpots } from './services/spotService'
import { isOpenNow } from './utils/timeUtils'
import { FaSearch, FaTimes } from 'react-icons/fa'
import SplashScreen from './components/SplashScreen'

function App() {
  const [loading, setLoading] = useState(true);
  const [spots, setSpots] = useState([]);
  const [filteredSpots, setFilteredSpots] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadSpots = async () => {
      const data = await getSpots();
      setSpots(data);
      setFilteredSpots(data);
    };
    loadSpots();
  }, []);

  useEffect(() => {
    let next = spots;
    if (activeFilter === 'Open Now') {
      next = next.filter(spot => isOpenNow(spot.openHours, spot.daysOpen));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      next = next.filter(spot =>
        spot.name.toLowerCase().includes(q) ||
        (spot.description && spot.description.toLowerCase().includes(q)) ||
        (Array.isArray(spot.foodTypes) && spot.foodTypes.some(t => t.toLowerCase().includes(q)))
      );
    }
    setFilteredSpots(next);
  }, [spots, activeFilter, searchQuery]);

  const handleFilter = (filter) => {
    setActiveFilter(filter);
  };

  const handleFindMe = () => {
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              (position) => {
                  const { latitude, longitude } = position.coords;
                  setUserLocation([latitude, longitude]);
              },
              (error) => {
                  console.error("Error getting location", error);
                  // Optional: handle error UI
                  alert("Could not access your location. Please check permissions.");
              },
              { enableHighAccuracy: true }
          );
      } else {
          alert("Geolocation is not supported by your browser.");
      }
  };

  return (
    <div className="h-screen w-full relative overflow-hidden bg-white">
      {loading && <SplashScreen onFinish={() => setLoading(false)} />}
      
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="w-full sm:max-w-[420px]">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search food spots"
              className="w-full pl-9 pr-10 py-3 rounded-lg bg-white border border-black text-sm text-black placeholder:text-muted focus:outline-none"
            />
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-chip text-black flex items-center justify-center active:shadow-inner"
              >
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {['All', 'Open Now'].map(filter => (
            <button
              key={filter}
              type="button"
              onClick={() => handleFilter(filter)}
              className={`px-4 py-3 rounded-full text-sm font-medium transition-colors active:shadow-inner ${
                activeFilter === filter ? 'bg-black text-white' : 'bg-chip text-black hover:bg-hover'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <MapView 
        spots={filteredSpots} 
        userLocation={userLocation}
        onFindMe={handleFindMe}
      />
    </div>
  )
}

export default App
