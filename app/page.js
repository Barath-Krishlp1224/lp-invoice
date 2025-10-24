"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [selectedMode, setSelectedMode] = useState(null);
  const router = useRouter();

  const handleNavigation = (mode, route) => {
    router.push(route);
  };

  const buttonBaseClass = "px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 ease-out shadow-lg hover:shadow-2xl focus:outline-none focus:ring-4 transform hover:scale-105 active:scale-95";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Header Section */}
        <div className="text-center mb-12">
      
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Select Merchant to Generate Invoice
          </h1>
          <div className="w-135 h-1 bg-gradient-to-r from-yellow-400 to-green-400 mx-auto rounded-full"></div>
        </div>

        {/* Buttons Container */}
        <div className="grid md:grid-cols-2 gap-8 mb-10">
          {/* FINO Button */}
          <button
            onClick={() => handleNavigation('fino', '/fino')}
            className={`${buttonBaseClass} ${
              selectedMode === 'fino'
                ? 'bg-gradient-to-r from-green-600 to-green-500 text-white ring-green-400 ring-offset-2 ring-offset-white'
                : 'bg-white text-gray-800 border-2 border-gray-300 hover:border-green-500 hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                selectedMode === 'fino' ? 'bg-white/20' : 'bg-green-100'
              }`}>
                <svg className={`w-8 h-8 ${selectedMode === 'fino' ? 'text-white' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-2xl font-bold">FINO</span>
              <span className="text-sm opacity-70">Invoice Generator</span>
            </div>
          </button>

          {/* SPARKLEAP Button */}
          <button
            onClick={() => handleNavigation('sparkleap', '/sparkleap')}
            className={`${buttonBaseClass} ${
              selectedMode === 'sparkleap'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white ring-indigo-400 ring-offset-2 ring-offset-white'
                : 'bg-white text-gray-800 border-2 border-gray-300 hover:border-indigo-500 hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                selectedMode === 'sparkleap' ? 'bg-white/20' : 'bg-indigo-100'
              }`}>
                <svg className={`w-8 h-8 ${selectedMode === 'sparkleap' ? 'text-white' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-bold">SPARKLEAP</span>
              <span className="text-sm opacity-70">Invoice Generator</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}