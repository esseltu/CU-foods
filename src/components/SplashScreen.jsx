import React, { useEffect, useState } from 'react';
import { FaUtensils } from 'react-icons/fa';

const SplashScreen = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Start fade out after 2.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Notify parent after transition ends (500ms duration)
      setTimeout(onFinish, 500); 
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="relative mb-7">
        <div className="relative w-24 h-24 bg-black rounded-xl flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
          <FaUtensils className="text-white text-4xl" />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-black tracking-tight mb-2 animate-fade-in-up">
        CU Foods
      </h1>
      
      <p className="text-body text-sm font-medium tracking-wide animate-pulse">
        Central University
      </p>

      <div className="absolute bottom-12 flex flex-col items-center gap-2">
         <div className="w-24 h-1.5 bg-chip rounded-full overflow-hidden">
            <div className="h-full bg-black w-full animate-[loading_1.5s_ease-in-out_infinite] origin-left rounded-full"></div>
         </div>
      </div>
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
