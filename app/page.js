"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  const [selectedMode, setSelectedMode] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const router = useRouter();

  const handleNavigation = (mode, route) => {
    setSelectedMode(mode);
    router.push(route);
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/1.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60"></div>
      </div>
      
      <div className="relative z-10 p-8">
        <div className="flex items-center">
          <img 
            src="/logo hd.png" 
            alt="Company Logo" 
            className="h-20 w-auto object-contain"
          />
        </div>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-8 pb-20">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-16">
            <p className="text-6xl text-white font-light animate-[fadeInUp_1s_ease-out_0.2s] opacity-0 [animation-fill-mode:forwards]">
              Select Merchant
            </p>
            <div className="inline-block mb-6 animate-[fadeInDown_0.8s_ease-out]">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-lime-400 to-transparent animate-[shimmer_2s_ease-in-out_infinite]"></div>
                <div className="w-3 h-3 rounded-full bg-lime-400 animate-pulse"></div>
                <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-[shimmer_2s_ease-in-out_infinite_0.5s]"></div>
              </div>
            </div>
          </div>

          <div className="flex gap-6 max-w-xl mx-auto justify-center">
            {/* FINO Card */}
            <button
              onClick={() => handleNavigation('fino', '/fino')}
              onMouseEnter={() => setHoveredCard('fino')}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative w-48 h-64 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/30 rounded-3xl transition-all duration-700 hover:scale-105 hover:border-yellow-300/60 hover:shadow-[0_20px_60px_rgba(253,224,71,0.4)] animate-[slideInLeft_0.8s_ease-out_0.4s] opacity-0 [animation-fill-mode:forwards] overflow-hidden"
            >
              {/* Animated Background Orbs */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute top-0 left-0 w-32 h-32 bg-yellow-300/30 rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite]"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-yellow-400/30 rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite_3s]"></div>
              </div>

              {/* Hexagon Icon Container */}
              <div className="relative pt-8 flex justify-center">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 rotate-45 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-700 shadow-2xl">
                    <span className="-rotate-45 text-4xl font-bold text-white">₹</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="relative mt-4 px-6 text-center">
                <h3 className="text-3xl font-black text-white mb-2 group-hover:text-yellow-300 transition-colors duration-300 tracking-tight">
                  FINO
                </h3>
                
                {/* Arrow Icon with Circle Background */}
                <div className="flex justify-center mb-3">
                  <div className="w-8 h-8 rounded-full bg-gray-400/30 flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-white group-hover:text-yellow-300 transition-colors duration-300" />
                  </div>
                </div>
                
                {/* Animated Underline */}
                <div className="flex justify-center mb-3">
                  <div className="w-0 h-0.5 bg-gradient-to-r from-yellow-300 to-yellow-400 group-hover:w-16 transition-all duration-500 rounded-full"></div>
                </div>
              </div>

              {/* Corner Accent */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-4 left-4 w-2 h-2 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </button>

            {/* Easybuzz Card */}
            <button
              onClick={() => handleNavigation('easybuzz', '/easybuzz')}
              onMouseEnter={() => setHoveredCard('easybuzz')}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative w-48 h-64 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/30 rounded-3xl transition-all duration-700 hover:scale-105 hover:border-lime-400/60 hover:shadow-[0_20px_60px_rgba(163,230,53,0.4)] animate-[slideInRight_0.8s_ease-out_0.6s] opacity-0 [animation-fill-mode:forwards] overflow-hidden"
            >
              {/* Animated Background Orbs */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400/30 rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite]"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-400/30 rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite_3s]"></div>
              </div>

              {/* Hexagon Icon Container */}
              <div className="relative pt-8 flex justify-center">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 bg-gradient-to-br from-lime-400 via-green-500 to-emerald-600 opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-lime-400 via-green-500 to-emerald-600 rotate-45 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-700 shadow-2xl">
                    <span className="-rotate-45 text-4xl font-bold text-white">₹</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="relative mt-4 px-6 text-center">
                <h3 className="text-3xl font-black text-white mb-2 group-hover:text-lime-400 transition-colors duration-300 tracking-tight">
                  Easybuzz
                </h3>
                
                {/* Arrow Icon with Circle Background */}
                <div className="flex justify-center mb-3">
                  <div className="w-8 h-8 rounded-full bg-gray-400/30 flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-white group-hover:text-lime-400 transition-colors duration-300" />
                  </div>
                </div>
                
                {/* Animated Underline */}
                <div className="flex justify-center mb-3">
                  <div className="w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-16 transition-all duration-500 rounded-full"></div>
                </div>
              </div>

              {/* Corner Accent */}
              <div className="absolute top-4 left-4 w-2 h-2 bg-lime-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-4 right-4 w-2 h-2 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes shimmer {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(10px, 10px);
          }
        }
      `}</style>
    </div>
  );
}