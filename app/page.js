"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  
  const [selectedMode, setSelectedMode] = useState(null);
  const router = useRouter();

  const handleNavigation = (mode, route) => {
    setSelectedMode(mode);
    router.push(route);
  };

  const buttonBaseClass = "px-6 py-3 text-lg font-semibold rounded-lg transition duration-150 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-4";

  return (
    <main className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      
      <div className="flex-shrink-0 pt-12 pb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Select Merchant to Generate Invoice
          <div className="h-1 w-60 bg-black rounded-full mx-auto mt-2"></div>
        </h1>
        
        <div className="flex justify-center gap-6">
          
          <button
            onClick={() => handleNavigation('fino', '/fino')}
            className={`${buttonBaseClass} 
              ${selectedMode === 'fino' 
                ? 'bg-green-600 text-white ring-green-300'
                : 'bg-white text-gray-800 border border-gray-300 hover:bg-green-50'
              }
            `}
          >
            FINO Invoice 
          </button>

          <button
            onClick={() => handleNavigation('sparkleap', '/sparkleap')}
            className={`${buttonBaseClass}
              ${selectedMode === 'sparkleap' 
                ? 'bg-indigo-600 text-white ring-indigo-300'
                : 'bg-white text-gray-800 border border-gray-300 hover:bg-indigo-50'
              }
            `}
          >
            SPARKLEAP Invoice
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 text-center">
        <p className="text-gray-500 mt-12">Click a button above to navigate to the dedicated invoice generator page.</p>
      </div>
    </main>
  );
}