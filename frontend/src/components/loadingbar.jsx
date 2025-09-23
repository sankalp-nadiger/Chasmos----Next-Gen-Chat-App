import React, { useState, useEffect } from 'react';

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
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700&display=swap');
                
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
                
                .animate-load {
                    animation: loadBar 1.5s linear forwards;
                }
                
                .animate-bounce-custom {
                    animation: bounce 1s ease-in-out infinite, pulse-glow 3s ease-in-out infinite;
                }
                
                .animate-text-glow {
                    animation: text-glow 2s ease-in-out infinite alternate;
                }
                
                .bg-gradient-text {
                    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                `}
            </style>
            
            <div className={`
                fixed inset-0 flex flex-col items-center justify-center
                ${theme.container} ${theme.text}
                transition-all duration-1000 ease-in-out
                ${isLoading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                z-[1000]
                animate-pulse
            `}>
                {/* Time Indicator */}
                <div className="absolute top-5 right-5 font-orbitron text-sm font-semibold opacity-70 
                               bg-white/10 backdrop-blur-sm px-3 py-2 rounded-full
                               border border-white/20">
                    {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                
                {/* Logo */}
                <div className="relative mb-5">
                    <svg
                        width="60"
                        height="60"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="animate-bounce-custom transition-all duration-800"
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="10"
                            fill="currentColor"
                            className="text-blue-500"
                        />
                        <path
                            d="M17.5 15.5C17.25 15.25 16.8125 15.0625 16.375 14.875C15.9375 14.6875 15.5625 14.5 15.0625 14.1875C14.5625 13.875 14.1875 13.625 13.8125 13.3125C13.4375 13 13.0625 12.5625 12.75 12.0625C12.5 11.5625 12.25 11.0625 12 10.5625C11.75 10.0625 11.5 9.5625 11.25 9.0625C11 8.5625 10.75 8.125 10.5 7.625C10.25 7.125 10 6.625 9.75 6.125C9.5 5.625 9.25 5.1875 9 4.6875C8.75 4.1875 8.5 3.75 8.25 3.25C8 2.75 7.75 2.25 7.5 1.75C7.25 1.25 7 0.75 6.75 0.25C6.5 0.25 6.25 0.5 6 0.75C5.75 1 5.5 1.25 5.25 1.5C5 1.75 4.75 2 4.5 2.25C4.25 2.5 4 2.75 3.75 3C3.5 3.25 3.25 3.5 3 3.75C2.75 4 2.5 4.25 2.25 4.5C2 4.75 1.75 5 1.5 5.25C1.25 5.5 1 5.75 0.75 6C0.5 6.25 0.25 6.5 0.25 6.75L0.25 6.75Z"
                            fill="white"
                        />
                    </svg>
                </div>
                
                {/* App Name */}
                <div className={`
                    font-orbitron text-4xl font-bold uppercase tracking-[4px] text-center my-5
                    bg-gradient-text animate-text-glow
                    transition-all duration-800 hover:scale-105
                `}>
                    Chasmos
                </div>
                
                {/* Loading Bar */}
                <div className={`
                    w-full max-w-[250px] h-1.5 bg-white/20 mt-8 rounded-full overflow-hidden
                    relative shadow-inner transition-all duration-800
                `}>
                    <div className={`
                        h-full w-0 ${theme.bar} rounded-full animate-load
                        shadow-lg ${theme.shadow} transition-all duration-800
                    `}></div>
                </div>
            </div>
        </>
    );
};

export default LoadingBar;
