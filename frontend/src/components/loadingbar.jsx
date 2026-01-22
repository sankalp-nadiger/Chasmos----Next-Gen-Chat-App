import React, { useState, useEffect } from 'react';
import logo from '../assets/Chasmos_logo.png';

const LoadingBar = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 9200);

        // Update time every second for dynamic color changes
        const timeInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => {
            clearTimeout(timer);
            clearInterval(timeInterval);
        };
    }, []);

    // Get time-based theme classes
    const getTimeBasedTheme = () => {
        const hour = currentTime.getHours();
        
        if (hour >= 6 && hour < 12) {
            // Morning theme (6 AM - 12 PM) - White
            return {
                container: 'bg-white',
                text: 'text-gray-800',
                logo: 'text-blue-500',
                bar: 'bg-blue-500',
                shadow: 'shadow-blue-500/40',
                glow: 'drop-shadow-[0_0_10px_rgba(59,130,246,0.4)]'
            };
        } else if (hour >= 12 && hour < 18) {
            // Afternoon theme (12 PM - 6 PM) - Mix of white and blue
            return {
                container: 'bg-gradient-to-br from-white via-blue-50 to-blue-100',
                text: 'text-gray-800',
                logo: 'text-blue-600',
                bar: 'bg-blue-600',
                shadow: 'shadow-blue-600/40',
                glow: 'drop-shadow-[0_0_10px_rgba(37,99,235,0.4)]'
            };
        } else {
            // Night theme (6 PM - 6 AM) - Dark blue
            return {
                container: 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900',
                text: 'text-blue-100',
                logo: 'text-blue-300',
                bar: 'bg-blue-300',
                shadow: 'shadow-blue-300/40',
                glow: 'drop-shadow-[0_0_10px_rgba(147,197,253,0.4)]'
            };
        }
    };

    const theme = getTimeBasedTheme();

    return (
        <>
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&display=swap');
                
                .font-orbitron {
                    font-family: 'Orbitron', sans-serif;
                }
                
                @keyframes loadBar {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
                
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                
                @keyframes pulse-glow {
                    0%, 100% { 
                        filter: drop-shadow(0 0 10px rgba(59,130,246,0.4));
                    }
                    50% { 
                        filter: drop-shadow(0 0 20px rgba(59,130,246,0.6)) drop-shadow(0 0 30px rgba(59,130,246,0.4));
                    }
                }
                
                @keyframes text-glow {
                    0% { 
                        text-shadow: 0px 0px 12px rgba(59,130,246,0.4);
                    }
                    100% { 
                        text-shadow: 0px 0px 25px rgba(59,130,246,0.6), 0px 0px 35px rgba(59,130,246,0.4);
                    }
                }
                
                @keyframes fade-in-up {
                    0% { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes twinkle {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    33% { transform: translateY(-10px) rotate(5deg); }
                    66% { transform: translateY(5px) rotate(-3deg); }
                }
                
                @keyframes nebula {
                    0% { transform: scale(1) rotate(0deg); opacity: 0.1; }
                    50% { transform: scale(1.1) rotate(180deg); opacity: 0.2; }
                    100% { transform: scale(1) rotate(360deg); opacity: 0.1; }
                }
                
                @keyframes cosmic-drift {
                    0% { transform: translateX(-100px) translateY(0px); }
                    100% { transform: translateX(100vw) translateY(-50px); }
                }
                
                .animate-load {
                    animation: loadBar 1.5s linear forwards;
                }
                
                .animate-bounce-custom {
                    animation: bounce 1s ease-in-out infinite, pulse-glow 3s ease-in-out infinite;
                }
                
                .animate-text-glow {
                    animation: text-glow 2s ease-in-out infinite alternate;
                }
                
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out forwards;
                    animation-delay: 0.5s;
                    opacity: 0;
                }
                
                .animate-twinkle {
                    animation: twinkle 3s ease-in-out infinite;
                }
                
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                
                .animate-nebula {
                    animation: nebula 20s linear infinite;
                }
                
                .animate-cosmic-drift {
                    animation: cosmic-drift 25s linear infinite;
                }
                
                .bg-gradient-text {
                    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .cosmic-bg {
                    background: radial-gradient(ellipse at top, #1e1b4b, #0f0f23, #000000);
                }
                
                .star {
                    position: absolute;
                    border-radius: 50%;
                    background: white;
                }
                
                .star-1 { width: 2px; height: 2px; top: 20%; left: 10%; animation-delay: 0s; }
                .star-2 { width: 1px; height: 1px; top: 30%; left: 20%; animation-delay: 0.5s; }
                .star-3 { width: 3px; height: 3px; top: 10%; left: 80%; animation-delay: 1s; }
                .star-4 { width: 1px; height: 1px; top: 60%; left: 15%; animation-delay: 1.5s; }
                .star-5 { width: 2px; height: 2px; top: 70%; left: 85%; animation-delay: 2s; }
                .star-6 { width: 1px; height: 1px; top: 40%; left: 70%; animation-delay: 2.5s; }
                .star-7 { width: 2px; height: 2px; top: 15%; left: 40%; animation-delay: 3s; }
                .star-8 { width: 1px; height: 1px; top: 80%; left: 30%; animation-delay: 0.2s; }
                .star-9 { width: 3px; height: 3px; top: 50%; left: 90%; animation-delay: 1.2s; }
                .star-10 { width: 1px; height: 1px; top: 25%; left: 60%; animation-delay: 2.2s; }
                
                .nebula-cloud {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(40px);
                    background: radial-gradient(circle, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2), transparent);
                }
                
                .nebula-1 { 
                    width: 300px; height: 200px; 
                    top: 10%; left: -50px; 
                    animation-delay: 0s; 
                }
                .nebula-2 { 
                    width: 250px; height: 150px; 
                    bottom: 20%; right: -80px; 
                    animation-delay: 5s;
                    background: radial-gradient(circle, rgba(236, 72, 153, 0.2), rgba(168, 85, 247, 0.15), transparent);
                }
                .nebula-3 { 
                    width: 400px; height: 300px; 
                    top: 30%; left: 60%; 
                    animation-delay: 10s;
                    background: radial-gradient(circle, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1), transparent);
                }
                `}
            </style>
            
            <div className={`
                fixed inset-0 flex flex-col items-center justify-center
                cosmic-bg ${theme.text}
                transition-all duration-1000 ease-in-out
                ${isLoading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                z-[1000]
                overflow-hidden
            `}>
                {/* Cosmos Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    {/* Twinkling Stars */}
                    <div className="star star-1 animate-twinkle"></div>
                    <div className="star star-2 animate-twinkle"></div>
                    <div className="star star-3 animate-twinkle"></div>
                    <div className="star star-4 animate-twinkle"></div>
                    <div className="star star-5 animate-twinkle"></div>
                    <div className="star star-6 animate-twinkle"></div>
                    <div className="star star-7 animate-twinkle"></div>
                    <div className="star star-8 animate-twinkle"></div>
                    <div className="star star-9 animate-twinkle"></div>
                    <div className="star star-10 animate-twinkle"></div>
                    
                    {/* Nebula Clouds */}
                    <div className="nebula-cloud nebula-1 animate-nebula"></div>
                    <div className="nebula-cloud nebula-2 animate-nebula"></div>
                    <div className="nebula-cloud nebula-3 animate-nebula"></div>
                    
                    {/* Floating Cosmic Particles */}
                    <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-400 rounded-full animate-float opacity-60"></div>
                    <div className="absolute top-3/4 right-1/3 w-0.5 h-0.5 bg-purple-300 rounded-full animate-float opacity-70" style={{animationDelay: '2s'}}></div>
                    <div className="absolute bottom-1/3 left-2/3 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-float opacity-50" style={{animationDelay: '4s'}}></div>
                    
                    {/* Cosmic Drift Lines */}
                    <div className="absolute top-1/6 w-20 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-cosmic-drift opacity-30"></div>
                    <div className="absolute bottom-1/4 w-16 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-cosmic-drift opacity-25" style={{animationDelay: '10s'}}></div>
                </div>
                {/* Time Indicator */}
                <div className="absolute top-5 right-5 font-orbitron text-sm font-semibold opacity-70 
                               bg-black/20 backdrop-blur-sm px-3 py-2 rounded-full
                               border border-white/20 text-white z-10">
                    {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                
                {/* Logo */}
                <div className="relative mb-5 z-10">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow overflow-hidden animate-bounce-custom">
  <img src={logo} className="w-18 h-18 object-contain" />
</div>



                </div>
                
                {/* App Name */}
                <div className={`
                    font-orbitron text-4xl font-bold uppercase tracking-[4px] text-center mb-2
                    text-white animate-text-glow
                    transition-all duration-800 hover:scale-105 z-10 relative
                `}>
                    Chasmos
                </div>
                
                {/* Tagline */}
                <div className={`
                    font-orbitron text-sm uppercase tracking-[2px] text-center mb-8
                    opacity-75 animate-fade-in-up text-blue-200 z-10 relative
                `}>
                    Next Gen Chat App
                </div>
                
                {/* Loading Bar */}
                <div className={`
                    w-full max-w-[250px] h-1.5 bg-white/10 rounded-full overflow-hidden
                    relative shadow-inner transition-all duration-800 z-10
                `}>
                    <div className={`
                        h-full w-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-load
                        shadow-lg shadow-blue-400/40 transition-all duration-800
                    `}></div>
                </div>
            </div>
        </>
    );
};

export default LoadingBar;