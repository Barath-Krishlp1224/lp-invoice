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

  return (
    <div className="min-h-screen relative flex items-center justify-center p-8">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/1.mp4" type="video/mp4" />
      </video>
      
      <div className="absolute inset-0 bg-black/40"></div>
      
      <div className="max-w-3xl mt-[-10%] w-full relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-semibold text-white mb-3">
            Select Merchant to Generate Invoice
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
          <button
            onClick={() => handleNavigation('fino', '/fino')}
            className="bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-xl px-4 py-3 transition-all duration-200 flex items-center justify-center space-x-3 hover:scale-105 hover:bg-white"
          >
            <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900">FINO</h3>
          </button>

          <button
            onClick={() => handleNavigation('easybuzz', '/easybuzz')}
            className="bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-xl px-4 py-3 transition-all duration-200 flex items-center justify-center space-x-3 hover:scale-105 hover:bg-white"
          >
            <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900">Easybuzz</h3>
          </button>
        </div>
      </div>
    </div>
  );
}