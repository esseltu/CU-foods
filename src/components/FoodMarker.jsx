import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { FaUtensils, FaCoffee, FaPizzaSlice, FaClock, FaCalendarAlt, FaDirections } from 'react-icons/fa';
import { isOpenNow } from '../utils/timeUtils';

// Function to get emoji based on types
const getSpotIcon = (spot) => {
    const type = spot.foodTypes[0] || "";
    if (type.includes("Coffee") || type.includes("Pastry")) return "☕";
    if (type.includes("Pizza") || type.includes("Burger")) return "🍕";
    return "🍛"; // Generic food
}

const FoodMarker = ({ spot, userLocation }) => {
  const emoji = getSpotIcon(spot);

  const isSpotOpen = isOpenNow(spot.openHours, spot.daysOpen);
  
  // Clean strings for display
  const displayHours = spot.openHours ? spot.openHours.replace(/['"]/g, '') : '';
  const displayDays = spot.daysOpen ? spot.daysOpen.replace(/['"]/g, '') : 'Mon - Sat';
  
  const icon = L.divIcon({
    className: 'custom-icon',
    html: `<div class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-transform hover:scale-110 relative group">
             <div class="absolute inset-0 rounded-full border-[3px] border-black opacity-20 group-hover:opacity-60 transition-opacity"></div>
             <span class="text-2xl transform transition-transform group-hover:rotate-12">${emoji}</span>
             <div class="absolute -bottom-1 w-2 h-2 bg-black rotate-45"></div>
           </div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 52],
    popupAnchor: [0, -52]
  });

  const getDistance = () => {
      if (!userLocation) return null;
      const user = L.latLng(userLocation[0], userLocation[1]);
      const target = L.latLng(spot.lat, spot.lng);
      const distMeters = user.distanceTo(target);
      if (distMeters < 1000) return `${Math.round(distMeters)}m`;
      return `${(distMeters / 1000).toFixed(1)}km`;
  };

  const distance = getDistance();

  return (
    <Marker position={[spot.lat, spot.lng]} icon={icon}>
      <Popup className="food-popup border-0 p-0" closeButton={false}>
        <div className="w-[280px] font-sans bg-white">
          <div className="bg-black h-20 relative overflow-visible">
            <div className="absolute top-3 left-4 z-20">
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${isSpotOpen ? 'bg-black text-white' : 'bg-chip text-black'}`}>
                {isSpotOpen ? 'Open now' : 'Closed'}
              </span>
            </div>
            <div className="absolute top-3 right-4 z-20">
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-white text-black">
                {spot.price}
              </span>
            </div>
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 z-30">
              <div className="w-14 h-14 bg-white rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.12)] flex items-center justify-center border-2 border-white">
                <span className="text-3xl leading-none pb-1">{emoji}</span>
              </div>
            </div>
          </div>
          
          <div className="px-5 pb-5 pt-10 bg-white">
            <h3 className="font-bold text-[18px] text-black leading-tight mb-1">{spot.name}</h3>
            
            {distance && (
              <div className="flex items-center gap-1 text-sm text-body mb-3">
                <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {distance} away
              </div>
            )}

            <p className="text-sm text-body leading-snug line-clamp-2 mb-4">{spot.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {spot.foodTypes.slice(0, 3).map((food, idx) => (
                <span key={idx} className="text-xs font-medium bg-chip text-black px-3 py-1 rounded-full">
                  {food}
                </span>
              ))}
              {spot.foodTypes.length > 3 && (
                <span className="text-xs font-medium bg-chip text-black px-3 py-1 rounded-full">+{spot.foodTypes.length - 3}</span>
              )}
            </div>
            
            <div className="pt-4 border-t border-black/10 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-body font-medium flex items-center gap-2">
                  <FaCalendarAlt className="text-black" />
                  <span>{displayDays}</span>
                </div>
                <div className="text-xs text-body font-medium flex items-center gap-2">
                  <FaClock className="text-black" />
                  <span>{displayHours}</span>
                </div>
              </div>
              <button 
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`, '_blank')}
                className="bg-black text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#111111] transition-colors flex items-center gap-2 mr-2.5"
              >
                <FaDirections />
                Directions
              </button>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default FoodMarker;
