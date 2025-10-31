import React from 'react';

const CosmosBackground = ({ 
  opacity = 0.3, 
  className = "", 
  showStars = true, 
  showNebula = true, 
  showParticles = true,
  theme = 'light',
  zIndex = -1
}) => {
  // Move theme-dependent styles to computed values
  const themeStyles = {
    starColor: theme === 'light' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    starShadow: theme === 'light' ? '0 0 6px rgba(59, 130, 246, 0.6)' : '0 0 6px rgba(255, 255, 255, 0.6)',
    nebula1: theme === 'light' 
      ? 'radial-gradient(circle, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.15), transparent)'
      : 'radial-gradient(circle, rgba(99, 102, 241, 0.4), rgba(139, 92, 246, 0.3), transparent)',
    nebula2: theme === 'light'
      ? 'radial-gradient(circle, rgba(236, 72, 153, 0.2), rgba(168, 85, 247, 0.12), transparent)'
      : 'radial-gradient(circle, rgba(236, 72, 153, 0.3), rgba(168, 85, 247, 0.25), transparent)',
    nebula3: theme === 'light'
      ? 'radial-gradient(circle, rgba(34, 197, 94, 0.15), rgba(59, 130, 246, 0.1), transparent)'
      : 'radial-gradient(circle, rgba(34, 197, 94, 0.2), rgba(59, 130, 246, 0.15), transparent)'
  };

  return (
    <>
      <style>
        {`
          @keyframes twinkle-cosmos {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          
          @keyframes float-cosmos {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-8px) rotate(3deg); }
            66% { transform: translateY(4px) rotate(-2deg); }
          }
          
          @keyframes nebula-cosmos {
            0% { transform: scale(1) rotate(0deg); opacity: 0.1; }
            50% { transform: scale(1.1) rotate(180deg); opacity: 0.3; }
            100% { transform: scale(1) rotate(360deg); opacity: 0.1; }
          }
          
          @keyframes cosmic-drift-cosmos {
            0% { transform: translateX(-100px) translateY(0px); opacity: 0.3; }
            50% { opacity: 0.8; }
            100% { transform: translateX(calc(100vw + 100px)) translateY(-30px); opacity: 0.3; }
          }
          
          @keyframes pulse-particle-cosmos {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.5); opacity: 0.9; }
          }
        `}
      </style>
      
      <div 
        className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} 
        style={{ 
          opacity, 
          zIndex: zIndex 
        }}
      >
        {/* Twinkling Stars */}
        {showStars && (
          <>
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '2px', 
                height: '2px', 
                top: '15%', 
                left: '8%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 4s ease-in-out infinite',
                animationDelay: '0s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '1.5px', 
                height: '1.5px', 
                top: '25%', 
                left: '18%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 4s ease-in-out infinite',
                animationDelay: '0.8s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '2.5px', 
                height: '2.5px', 
                top: '8%', 
                left: '75%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 4s ease-in-out infinite',
                animationDelay: '1.2s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '1.5px', 
                height: '1.5px', 
                top: '55%', 
                left: '12%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 4s ease-in-out infinite',
                animationDelay: '1.8s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '2px', 
                height: '2px', 
                top: '65%', 
                left: '82%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 4s ease-in-out infinite',
                animationDelay: '2.4s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '1.5px', 
                height: '1.5px', 
                top: '35%', 
                left: '65%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 4s ease-in-out infinite',
                animationDelay: '3s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '2px', 
                height: '2px', 
                top: '12%', 
                left: '35%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 4s ease-in-out infinite',
                animationDelay: '0.4s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '1.5px', 
                height: '1.5px', 
                top: '75%', 
                left: '28%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 4s ease-in-out infinite',
                animationDelay: '1.6s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '2.5px', 
                height: '2.5px', 
                top: '45%', 
                left: '88%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 4s ease-in-out infinite',
                animationDelay: '2.8s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '1.5px', 
                height: '1.5px', 
                top: '22%', 
                left: '55%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 4s ease-in-out infinite',
                animationDelay: '0.6s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '2px', 
                height: '2px', 
                top: '85%', 
                left: '15%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 4s ease-in-out infinite',
                animationDelay: '2.2s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '1.5px', 
                height: '1.5px', 
                top: '5%', 
                left: '92%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 4s ease-in-out infinite',
                animationDelay: '1.4s'
              }}
            />
          </>
        )}
        
        {/* Nebula Clouds */}
        {showNebula && (
          <>
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '300px', 
                height: '180px', 
                top: '5%', 
                left: '-50px',
                background: themeStyles.nebula1,
                filter: 'blur(40px)',
                animation: 'nebula-cosmos 30s linear infinite',
                animationDelay: '0s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '250px', 
                height: '150px', 
                bottom: '15%', 
                right: '-70px',
                background: themeStyles.nebula2,
                filter: 'blur(35px)',
                animation: 'nebula-cosmos 25s linear infinite',
                animationDelay: '8s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '350px', 
                height: '200px', 
                top: '40%', 
                left: '60%',
                background: themeStyles.nebula3,
                filter: 'blur(45px)',
                animation: 'nebula-cosmos 35s linear infinite',
                animationDelay: '15s'
              }}
            />
          </>
        )}
        
        {/* Floating Cosmic Particles */}
        {showParticles && (
          <>
            <div 
              className="absolute rounded-full bg-blue-400"
              style={{ 
                width: '4px', 
                height: '4px',
                top: '25%', 
                left: '25%',
                opacity: theme === 'light' ? 0.6 : 0.8,
                animation: 'float-cosmos 8s ease-in-out infinite, pulse-particle-cosmos 3s ease-in-out infinite'
              }}
            />
            <div 
              className="absolute rounded-full bg-purple-400"
              style={{ 
                width: '3px', 
                height: '3px',
                top: '70%', 
                right: '35%',
                opacity: theme === 'light' ? 0.7 : 0.9,
                animation: 'float-cosmos 8s ease-in-out infinite, pulse-particle-cosmos 3s ease-in-out infinite',
                animationDelay: '3s'
              }}
            />
            <div 
              className="absolute rounded-full bg-cyan-400"
              style={{ 
                width: '5px', 
                height: '5px',
                bottom: '30%', 
                left: '65%',
                opacity: theme === 'light' ? 0.5 : 0.7,
                animation: 'float-cosmos 8s ease-in-out infinite, pulse-particle-cosmos 3s ease-in-out infinite',
                animationDelay: '6s'
              }}
            />
            <div 
              className="absolute rounded-full bg-indigo-400"
              style={{ 
                width: '3px', 
                height: '3px',
                top: '15%', 
                right: '15%',
                opacity: theme === 'light' ? 0.6 : 0.8,
                animation: 'float-cosmos 8s ease-in-out infinite, pulse-particle-cosmos 3s ease-in-out infinite',
                animationDelay: '9s'
              }}
            />
          </>
        )}
        
        {/* Cosmic Drift Lines */}
        <div 
          className="absolute"
          style={{
            top: '20%',
            left: '-100px',
            width: '80px',
            height: '1px',
            background: theme === 'light' 
              ? 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.6), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.8), transparent)',
            animation: 'cosmic-drift-cosmos 40s linear infinite'
          }}
        />
        <div 
          className="absolute"
          style={{
            bottom: '30%',
            left: '-100px',
            width: '60px',
            height: '1px',
            background: theme === 'light' 
              ? 'linear-gradient(90deg, transparent, rgba(147, 51, 234, 0.5), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(147, 51, 234, 0.7), transparent)',
            animation: 'cosmic-drift-cosmos 45s linear infinite',
            animationDelay: '20s'
          }}
        />
      </div>
    </>
  );
};

export default CosmosBackground;