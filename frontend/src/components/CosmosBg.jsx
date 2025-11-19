import React from 'react';

const CosmosBackground = ({ 
  opacity = 0.3, 
  className = "", 
  showStars = true, 
  showNebula = true, 
  showParticles = true,
  showComets = true,
  theme = 'light',
  zIndex = -1
}) => {
  // Enhanced theme-dependent styles
  const themeStyles = {
    starColor: theme === 'light' ? 'rgba(59, 130, 246, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    starShadow: theme === 'light' ? '0 0 5px rgba(59, 130, 246, 0.6)' : '0 0 6px rgba(255, 255, 255, 0.7)', // Increased shadow
    nebula1: theme === 'light' 
      ? 'radial-gradient(circle, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1), transparent)'
      : 'radial-gradient(circle, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2), transparent)',
    nebula2: theme === 'light'
      ? 'radial-gradient(circle, rgba(236, 72, 153, 0.15), rgba(168, 85, 247, 0.08), transparent)'
      : 'radial-gradient(circle, rgba(236, 72, 153, 0.25), rgba(168, 85, 247, 0.15), transparent)',
    nebula3: theme === 'light'
      ? 'radial-gradient(circle, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.08), transparent)'
      : 'radial-gradient(circle, rgba(34, 197, 94, 0.15), rgba(59, 130, 246, 0.1), transparent)',
    
    // Comet 1 (Existing - Left to Right)
    cometColor1: theme === 'light'
      ? 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.7), rgba(147, 51, 234, 0.5), transparent)'
      : 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 1), rgba(147, 51, 234, 0.7), transparent)',
    cometCoreShadow1: theme === 'light'
      ? '0 0 5px 1px rgba(255, 255, 255, 0.8), 0 0 10px rgba(59, 130, 246, 0.6)'
      : '0 0 7px 2px rgba(255, 255, 255, 1), 0 0 15px rgba(59, 130, 246, 0.8)',

    // Comet 2 (Existing - Left to Right, but will modify for Middle flow)
    cometColor2: theme === 'light' 
      ? 'linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.6), rgba(168, 85, 247, 0.4), transparent)'
      : 'linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.8), rgba(168, 85, 247, 0.6), transparent)',
    cometCoreShadow2: theme === 'light'
      ? '0 0 5px 1px rgba(255, 255, 255, 0.7), 0 0 10px rgba(236, 72, 153, 0.5)'
      : '0 0 7px 2px rgba(255, 255, 255, 0.9), 0 0 15px rgba(236, 72, 153, 0.7)',
    
    // Comet 3 (Existing - Left to Right, but will modify for Top-Left diagonal)
    cometColor3: theme === 'light' 
      ? 'linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.5), rgba(59, 130, 246, 0.3), transparent)'
      : 'linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.7), rgba(59, 130, 246, 0.5), transparent)',
    cometCoreShadow3: theme === 'light'
      ? '0 0 5px 1px rgba(255, 255, 255, 0.7), 0 0 10px rgba(34, 197, 94, 0.4)'
      : '0 0 7px 2px rgba(255, 255, 255, 0.9), 0 0 15px rgba(34, 197, 94, 0.6)',

    // New Comet 4 (Middle to Out)
    cometColor4: theme === 'light' 
      ? 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.7), rgba(99, 102, 241, 0.5), transparent)'
      : 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 1), rgba(99, 102, 241, 0.7), transparent)',
    cometCoreShadow4: theme === 'light'
      ? '0 0 5px 1px rgba(255, 255, 255, 0.8), 0 0 10px rgba(168, 85, 247, 0.6)'
      : '0 0 7px 2px rgba(255, 255, 255, 1), 0 0 15px rgba(168, 85, 247, 0.8)',
  };

  // Particle color array using theme styles for blending
  const particleColors = [
    themeStyles.starColor,
    themeStyles.starColor.replace('59, 130, 246', '147, 51, 234'), // Purple variant
    themeStyles.starColor.replace('59, 130, 246', '34, 197, 94'), // Green variant
  ];

  return (
    <>
      <style>
        {`
          /* --- Global Keyframes --- */
          /* Stars Visibility: Increased peak opacity */
          @keyframes twinkle-cosmos {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          
          @keyframes float-cosmos {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-8px) rotate(3deg); }
            66% { transform: translateY(4px) rotate(-2deg); }
          }
          
          /* Nebula opacity reduced for cleaner feel */
          @keyframes nebula-cosmos {
            0% { transform: scale(1) rotate(0deg) translateX(0px) translateY(0px); opacity: 0.05; }
            25% { transform: scale(1.05) rotate(90deg) translateX(10px) translateY(-5px); opacity: 0.15; }
            50% { transform: scale(1.1) rotate(180deg) translateX(5px) translateY(8px); opacity: 0.2; }
            75% { transform: scale(1.05) rotate(270deg) translateX(-8px) translateY(3px); opacity: 0.15; }
            100% { transform: scale(1) rotate(360deg) translateX(0px) translateY(0px); opacity: 0.05; }
          }
          
          @keyframes cosmic-drift-cosmos {
            0% { transform: translateX(-100px) translateY(0px); opacity: 0.2; }
            50% { opacity: 0.7; }
            100% { transform: translateX(calc(100vw + 100px)) translateY(-30px); opacity: 0.2; }
          }
          
          @keyframes pulse-particle-cosmos {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.3); opacity: 0.7; }
          }
          
          /* Comet 1 (Left to Right) keyframes remain the same for movement */
          @keyframes comet-flow-left-right {
            0% { 
              transform: translateX(-100px) translateY(0px) scale(0.5);
              opacity: 0;
            }
            10% { 
              opacity: 1;
              transform: translateX(0px) translateY(0px) scale(1);
            }
            90% { 
              opacity: 1;
              transform: translateX(calc(100vw + 100px)) translateY(0px) scale(1);
            }
            100% { 
              opacity: 0;
              transform: translateX(calc(100vw + 200px)) translateY(0px) scale(0.5);
            }
          }

          /* Comet 2 (Top-Left Diagonal) */
          @keyframes comet-flow-top-left-diag {
            0% { 
              transform: translateX(-50px) translateY(-50px) scale(0.5);
              opacity: 0;
            }
            10% { 
              opacity: 1;
              transform: translateX(0px) translateY(0px) scale(1);
            }
            90% { 
              opacity: 1;
              transform: translateX(calc(100vw + 50px)) translateY(calc(100vh + 50px)) scale(1);
            }
            100% { 
              opacity: 0;
              transform: translateX(calc(100vw + 100px)) translateY(calc(100vh + 100px)) scale(0.5);
            }
          }

          /* Comet 3 (Middle Out) */
          @keyframes comet-flow-middle-out {
            0% { 
              transform: translateX(calc(50vw - 50px)) translateY(calc(50vh - 25px)) scale(0);
              opacity: 0;
            }
            5% { /* Appear quickly at a central point */
              opacity: 1;
              transform: translateX(calc(50vw - 50px)) translateY(calc(50vh - 25px)) scale(1);
            }
            95% { 
              opacity: 1;
              transform: translateX(calc(100vw + 100px)) translateY(calc(50vh + 50px)) scale(1); /* Flow towards bottom-right */
            }
            100% { 
              opacity: 0;
              transform: translateX(calc(100vw + 200px)) translateY(calc(50vh + 100px)) scale(0.5);
            }
          }
          
          @keyframes nebula-pulse {
            0%, 100% { opacity: 0.05; transform: scale(1); }
            50% { opacity: 0.15; transform: scale(1.03); }
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
        {/* Twinkling Stars - More visible now */}
        {showStars && (
          <>
            {[...Array(70)].map((_, i) => { // Increased count for density
              const size = Math.random() * 3 + 0.8; // Increased max size and min size
              const left = Math.random() * 100;
              const top = Math.random() * 100;
              const delay = Math.random() * 5;
              const duration = 2 + Math.random() * 3;
              
              return (
                <div 
                  key={`star-${i}`}
                  className="absolute rounded-full"
                  style={{ 
                    width: `${size}px`, 
                    height: `${size}px`, 
                    left: `${left}%`, 
                    top: `${top}%`,
                    background: themeStyles.starColor,
                    boxShadow: themeStyles.starShadow,
                    animation: `twinkle-cosmos ${duration}s ease-in-out infinite`,
                    animationDelay: `${delay}s`
                  }}
                />
              );
            })}
          </>
        )}
        
        {/* Enhanced Nebula Clouds (Opacity reduced in keyframes) */}
        {showNebula && (
          <>
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '400px', 
                height: '250px', 
                top: '5%', 
                left: '-100px',
                background: themeStyles.nebula1,
                filter: 'blur(70px)', // Increased blur for softness
                animation: 'nebula-cosmos 45s ease-in-out infinite, nebula-pulse 20s ease-in-out infinite',
                animationDelay: '0s, 0s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '350px', 
                height: '200px', 
                bottom: '10%', 
                right: '-120px',
                background: themeStyles.nebula2,
                filter: 'blur(60px)',
                animation: 'nebula-cosmos 35s ease-in-out infinite, nebula-pulse 25s ease-in-out infinite',
                animationDelay: '12s, 5s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '500px', 
                height: '300px', 
                top: '35%', 
                left: '50%',
                background: themeStyles.nebula3,
                filter: 'blur(80px)',
                animation: 'nebula-cosmos 55s ease-in-out infinite, nebula-pulse 30s ease-in-out infinite',
                animationDelay: '25s, 15s'
              }}
            />
          </>
        )}
        
        {/* Comets with integrated core (Fixes bubble effect) */}
        {showComets && (
          <>
            {/* Comet 1: Blue/Purple - Original Left to Right */}
            <div // Comet Trail
              className="absolute"
              style={{
                top: '15%',
                left: '-100px',
                width: '100px', 
                height: '1.5px', 
                background: themeStyles.cometColor1,
                filter: 'blur(0.5px)', 
                animation: 'comet-flow-left-right 25s linear infinite',
                animationDelay: '0s'
              }}
            />
            <div // Comet Core
              className="absolute rounded-full bg-white"
              style={{
                width: '3px', 
                height: '3px',
                top: '15%',
                left: '-100px',
                boxShadow: themeStyles.cometCoreShadow1,
                animation: 'comet-flow-left-right 25s linear infinite',
                animationDelay: '0s'
              }}
            />
            
            {/* Comet 2: Pink/Violet - New: Top-Left Diagonal */}
            <div // Comet Trail
              className="absolute"
              style={{
                top: '0%', // Start from top
                left: '0%', // Start from left
                width: '80px',
                height: '1px',
                background: themeStyles.cometColor2,
                filter: 'blur(0.3px)',
                animation: 'comet-flow-top-left-diag 30s linear infinite',
                animationDelay: '8s' // Different delay
              }}
            />
            <div // Comet Core
              className="absolute rounded-full bg-white"
              style={{
                width: '2.5px', 
                height: '2.5px',
                top: '0%',
                left: '0%',
                boxShadow: themeStyles.cometCoreShadow2,
                animation: 'comet-flow-top-left-diag 30s linear infinite',
                animationDelay: '8s'
              }}
            />
            
            {/* Comet 3: Green/Blue - New: Middle Flow Out */}
            <div // Comet Trail
              className="absolute"
              style={{
                // Position will be controlled by animation
                width: '90px',
                height: '1.5px',
                background: themeStyles.cometColor3,
                filter: 'blur(0.5px)',
                animation: 'comet-flow-middle-out 35s linear infinite',
                animationDelay: '16s' // Different delay
              }}
            />
            <div // Comet Core
              className="absolute rounded-full bg-white"
              style={{
                // Position will be controlled by animation
                width: '3px', 
                height: '3px',
                boxShadow: themeStyles.cometCoreShadow3,
                animation: 'comet-flow-middle-out 35s linear infinite',
                animationDelay: '16s'
              }}
            />

            {/* Comet 4: New Comet - Middle Out (Additional, more dynamic) */}
            <div // Comet Trail
              className="absolute"
              style={{
                width: '110px',
                height: '2px',
                background: themeStyles.cometColor4,
                filter: 'blur(0.8px)',
                animation: 'comet-flow-middle-out 28s linear infinite', // Re-using middle-out animation
                animationDelay: '2s' 
              }}
            />
            <div // Comet Core
              className="absolute rounded-full bg-white"
              style={{
                width: '3.5px',
                height: '3.5px',
                boxShadow: themeStyles.cometCoreShadow4,
                animation: 'comet-flow-middle-out 28s linear infinite',
                animationDelay: '2s'
              }}
            />
          </>
        )}
        
        {/* Floating Cosmic Particles (Using theme colors for blending) */}
        {showParticles && (
          <>
            {[...Array(15)].map((_, i) => { // Increased count
              const color = particleColors[i % particleColors.length];
              const top = Math.random() * 100;
              const left = Math.random() * 100;
              const delay = Math.random() * 12;
              const size = Math.random() * 3 + 1; // Max size reduced
              
              return (
                <div 
                  key={`particle-${i}`}
                  className={`absolute rounded-full`}
                  style={{ 
                    width: `${size}px`, 
                    height: `${size}px`,
                    top: `${top}%`, 
                    left: `${left}%`,
                    background: color, // Theme-blended color
                    opacity: theme === 'light' ? 0.2 : 0.5, // Lower base opacity
                    animation: `float-cosmos ${8 + Math.random() * 4}s ease-in-out infinite, pulse-particle-cosmos ${3 + Math.random() * 2}s ease-in-out infinite`,
                    animationDelay: `${delay}s, ${delay * 0.5}s`
                  }}
                />
              );
            })}
          </>
        )}
        
        {/* Subtle Cosmic Drift Lines (Lower opacity and added blur) */}
        <div 
          className="absolute"
          style={{
            top: '20%',
            left: '-100px',
            width: '80px',
            height: '1px',
            background: theme === 'light' 
              ? 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.2), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent)',
            filter: 'blur(2px)', // Added blur
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
              ? 'linear-gradient(90deg, transparent, rgba(147, 51, 234, 0.15), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(147, 51, 234, 0.3), transparent)',
            filter: 'blur(1.5px)', // Added blur
            animation: 'cosmic-drift-cosmos 45s linear infinite',
            animationDelay: '20s'
          }}
        />
      </div>
    </>
  );
};

export default CosmosBackground;