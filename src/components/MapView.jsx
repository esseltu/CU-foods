import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import FoodMarker from './FoodMarker';
import { FaLocationArrow } from 'react-icons/fa';

// Component to handle map center updates
const MapRecenter = ({ location }) => {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.flyTo(location, 16, { animate: true, duration: 1.5 });
    }
  }, [location, map]);
  return null;
};

// User Location Marker with Ping Effect
const UserMarker = ({ position }) => {
    if (!position) return null;
    
    const icon = L.divIcon({
        className: 'user-marker',
        html: `<div class="relative w-4 h-4">
                 <div class="absolute inset-0 bg-black rounded-full border-2 border-white shadow-[0_2px_8px_rgba(0,0,0,0.16)] z-10"></div>
                 <div class="absolute -inset-4 bg-black/20 rounded-full animate-ping z-0"></div>
               </div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });

    return <Marker position={position} icon={icon} interactive={false} />;
};

const MapView = ({ spots, userLocation, onFindMe }) => {
  // Default center: Miotso/Dawhenya
  const defaultCenter = [5.769, 0.084];

  return (
    <div className="relative w-full h-full">
      <MapContainer 
        center={defaultCenter} 
        zoom={16} 
        className="w-full h-full z-0"
        zoomControl={false}
      >
        {/* CartoDB Voyager Tiles for a cleaner, modern look */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />
        
        {spots.map(spot => (
          <FoodMarker key={spot.id} spot={spot} userLocation={userLocation} />
        ))}

        {userLocation && <UserMarker position={userLocation} />}
        {userLocation && <MapRecenter location={userLocation} />}

      </MapContainer>

      {/* Floating Button */}
      <div className="absolute bottom-8 left-0 right-0 z-[1000] px-6 flex justify-center pointer-events-none">
        <button 
          onClick={onFindMe}
          className="pointer-events-auto bg-white text-black font-medium py-3.5 px-6 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.16)] translate-y-[2px] flex items-center justify-center gap-2 transition-colors hover:bg-[#f3f3f3] active:shadow-inner w-full max-w-sm"
        >
          <FaLocationArrow />
          Find Food Near Me
        </button>
      </div>
    </div>
  );
};

export default MapView;
