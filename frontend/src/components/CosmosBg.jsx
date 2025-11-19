import React, { useMemo } from "react";

const CosmosBackground = ({ 
  opacity = 0.3, 
  className = "", 
  showStars = true, 
  showNebula = true, 
  showParticles = true,
  showComets = true,
  theme = 'light',
  zIndex = -1,
  cometCount = 3 
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
      : 'radial-gradient(circle, rgba(34, 197, 94, 0.2), rgba(59, 130, 246, 0.15), transparent)',
  };

  // Generate random comet data
  const comets = useMemo(() => {
    if (!showComets) return [];
    
    const cometTypes = [
      {
        headGradient: theme === 'light' 
          ? 'radial-gradient(circle, #ffffff 0%, #60a5fa 50%, #3b82f6 100%)'
          : 'radial-gradient(circle, #ffffff 0%, #93c5fd 50%, #60a5fa 100%)',
        headShadow: theme === 'light'
          ? '0 0 25px #60a5fa, 0 0 50px #3b82f6, 0 0 80px #3b82f6'
          : '0 0 30px #93c5fd, 0 0 60px #60a5fa, 0 0 90px #60a5fa',
        tailCore: theme === 'light'
          ? 'linear-gradient(90deg, rgba(96, 165, 246, 0.9) 0%, rgba(147, 197, 253, 0.6) 40%, transparent 100%)'
          : 'linear-gradient(90deg, rgba(147, 197, 253, 1) 0%, rgba(96, 165, 246, 0.7) 40%, transparent 100%)',
        tailGlow: theme === 'light'
          ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.4) 0%, rgba(147, 197, 253, 0.2) 30%, transparent 100%)'
          : 'linear-gradient(90deg, rgba(147, 197, 253, 0.6) 0%, rgba(96, 165, 246, 0.3) 30%, transparent 100%)',
        tailShadow: theme === 'light'
          ? '0 0 15px rgba(59, 130, 246, 0.8)'
          : '0 0 20px rgba(147, 197, 253, 0.9)'
      },
      {
        headGradient: theme === 'light'
          ? 'radial-gradient(circle, #ffffff 0%, #f0abfc 50%, #e879f9 100%)'
          : 'radial-gradient(circle, #ffffff 0%, #f0abfc 50%, #e879f9 100%)',
        headShadow: theme === 'light'
          ? '0 0 25px #e879f9, 0 0 50px #d946ef, 0 0 80px #c026d3'
          : '0 0 30px #f0abfc, 0 0 60px #e879f9, 0 0 90px #d946ef',
        tailCore: theme === 'light'
          ? 'linear-gradient(90deg, rgba(232, 121, 249, 0.9) 0%, rgba(240, 171, 252, 0.6) 40%, transparent 100%)'
          : 'linear-gradient(90deg, rgba(240, 171, 252, 1) 0%, rgba(232, 121, 249, 0.7) 40%, transparent 100%)',
        tailGlow: theme === 'light'
          ? 'linear-gradient(90deg, rgba(217, 70, 239, 0.4) 0%, rgba(240, 171, 252, 0.2) 30%, transparent 100%)'
          : 'linear-gradient(90deg, rgba(240, 171, 252, 0.6) 0%, rgba(232, 121, 249, 0.3) 30%, transparent 100%)',
        tailShadow: theme === 'light'
          ? '0 0 15px rgba(217, 70, 239, 0.8)'
          : '0 0 20px rgba(240, 171, 252, 0.9)'
      },
      {
        headGradient: theme === 'light'
          ? 'radial-gradient(circle, #ffffff 0%, #67e8f9 50%, #22d3ee 100%)'
          : 'radial-gradient(circle, #ffffff 0%, #67e8f9 50%, #22d3ee 100%)',
        headShadow: theme === 'light'
          ? '0 0 25px #22d3ee, 0 0 50px #06b6d4, 0 0 80px #0891b2'
          : '0 0 30px #67e8f9, 0 0 60px #22d3ee, 0 0 90px #06b6d4',
        tailCore: theme === 'light'
          ? 'linear-gradient(90deg, rgba(34, 211, 238, 0.9) 0%, rgba(103, 232, 249, 0.6) 40%, transparent 100%)'
          : 'linear-gradient(90deg, rgba(103, 232, 249, 1) 0%, rgba(34, 211, 238, 0.7) 40%, transparent 100%)',
        tailGlow: theme === 'light'
          ? 'linear-gradient(90deg, rgba(6, 182, 212, 0.4) 0%, rgba(103, 232, 249, 0.2) 30%, transparent 100%)'
          : 'linear-gradient(90deg, rgba(103, 232, 249, 0.6) 0%, rgba(34, 211, 238, 0.3) 30%, transparent 100%)',
        tailShadow: theme === 'light'
          ? '0 0 15px rgba(6, 182, 212, 0.8)'
          : '0 0 20px rgba(103, 232, 249, 0.9)'
      }
    ];

    const paths = [
      { 
        name: 'diagonal-tl-br',
        animation: 'comet-travel-cosmos',
        duration: 25,
        startX: -150,
        startY: -150,
        endX: 'calc(100vw + 150px)',
        endY: 'calc(100vh + 150px)',
        rotation: -45
      },
      { 
        name: 'diagonal-tr-bl',
        animation: 'comet-travel-2-cosmos',
        duration: 30,
        startX: 'calc(100vw + 150px)',
        startY: -150,
        endX: -150,
        endY: 'calc(100vh + 150px)',
        rotation: -135
      },
      { 
        name: 'horizontal',
        animation: 'comet-travel-3-cosmos',
        duration: 35,
        startX: -150,
        startY: '50vh',
        endX: 'calc(100vw + 150px)',
        endY: '30vh',
        rotation: -30
      }
    ];

    return Array.from({ length: cometCount }, (_, index) => {
      const cometType = cometTypes[Math.floor(Math.random() * cometTypes.length)];
      const path = paths[Math.floor(Math.random() * paths.length)];
      const delay = Math.random() * 40;
      const size = 12 + Math.random() * 10; // Larger size: 12-22px
      const tailLength = 180 + Math.random() * 120; // Longer tails
      const speed = path.duration + (Math.random() - 0.5) * 10;

      return {
        ...cometType,
        ...path,
        delay,
        size,
        tailLength,
        speed,
        key: `comet-${index}`
      };
    });
  }, [showComets, theme, cometCount]);

  return (
    <>
      <style>
        {`
          @keyframes twinkle-cosmos {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.3); }
          }
          
          @keyframes float-cosmos {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-10px) rotate(5deg); }
            66% { transform: translateY(5px) rotate(-3deg); }
          }
          
          @keyframes nebula-cosmos {
            0% { transform: scale(1) rotate(0deg); opacity: 0.15; }
            50% { transform: scale(1.15) rotate(180deg); opacity: 0.35; }
            100% { transform: scale(1) rotate(360deg); opacity: 0.15; }
          }
          
          @keyframes cosmic-drift-cosmos {
            0% { transform: translateX(-100px) translateY(0px); opacity: 0; }
            10% { opacity: 0.6; }
            90% { opacity: 0.6; }
            100% { transform: translateX(calc(100vw + 100px)) translateY(-30px); opacity: 0; }
          }
          
          @keyframes pulse-particle-cosmos {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.8); opacity: 1; }
          }
          
          @keyframes comet-travel-cosmos {
            0% { 
              transform: translate(-150px, -150px) rotate(-45deg); 
              opacity: 0; 
            }
            5% { opacity: 1; }
            95% { opacity: 1; }
            100% { 
              transform: translate(calc(100vw + 150px), calc(100vh + 150px)) rotate(-45deg); 
              opacity: 0; 
            }
          }
          
          @keyframes comet-travel-2-cosmos {
            0% { 
              transform: translate(calc(100vw + 150px), -150px) rotate(-135deg); 
              opacity: 0; 
            }
            5% { opacity: 1; }
            95% { opacity: 1; }
            100% { 
              transform: translate(-150px, calc(100vh + 150px)) rotate(-135deg); 
              opacity: 0; 
            }
          }
          
          @keyframes comet-travel-3-cosmos {
            0% { 
              transform: translate(-150px, 50vh) rotate(-30deg); 
              opacity: 0; 
            }
            5% { opacity: 1; }
            95% { opacity: 1; }
            100% { 
              transform: translate(calc(100vw + 150px), 30vh) rotate(-30deg); 
              opacity: 0; 
            }
          }

          /* Enhanced comet glow effects */
          .comet-head {
            animation: comet-pulse 2s ease-in-out infinite;
          }
          
          @keyframes comet-pulse {
            0%, 100% { transform: scale(1); filter: brightness(1.5); }
            50% { transform: scale(1.1); filter: brightness(2); }
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
        {/* Twinkling Stars - Enhanced visibility */}
        {showStars && (
          <>
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '3px', 
                height: '3px', 
                top: '15%', 
                left: '8%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 3s ease-in-out infinite',
                animationDelay: '0s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '2px', 
                height: '2px', 
                top: '25%', 
                left: '18%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 3.5s ease-in-out infinite',
                animationDelay: '0.8s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '3.5px', 
                height: '3.5px', 
                top: '8%', 
                left: '75%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 2.8s ease-in-out infinite',
                animationDelay: '1.2s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '2px', 
                height: '2px', 
                top: '55%', 
                left: '12%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 3.2s ease-in-out infinite',
                animationDelay: '1.8s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '2.5px', 
                height: '2.5px', 
                top: '65%', 
                left: '82%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 3.3s ease-in-out infinite',
                animationDelay: '2.4s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '2px', 
                height: '2px', 
                top: '35%', 
                left: '65%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 3.6s ease-in-out infinite',
                animationDelay: '3s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '3px', 
                height: '3px', 
                top: '12%', 
                left: '35%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 2.9s ease-in-out infinite',
                animationDelay: '0.4s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '2px', 
                height: '2px', 
                top: '75%', 
                left: '28%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 3.4s ease-in-out infinite',
                animationDelay: '1.6s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '3.5px', 
                height: '3.5px', 
                top: '45%', 
                left: '88%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 3.1s ease-in-out infinite',
                animationDelay: '2.8s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '2px', 
                height: '2px', 
                top: '22%', 
                left: '55%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 3.7s ease-in-out infinite',
                animationDelay: '0.6s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '2.5px', 
                height: '2.5px', 
                top: '85%', 
                left: '15%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 3s ease-in-out infinite',
                animationDelay: '2.2s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '2px', 
                height: '2px', 
                top: '5%', 
                left: '92%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 3.5s ease-in-out infinite',
                animationDelay: '1.4s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '3px', 
                height: '3px', 
                top: '42%', 
                left: '42%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 3.2s ease-in-out infinite',
                animationDelay: '2s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '2px', 
                height: '2px', 
                top: '68%', 
                left: '58%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 3.4s ease-in-out infinite',
                animationDelay: '1s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '2.5px', 
                height: '2.5px', 
                top: '92%', 
                left: '72%',
                background: themeStyles.starColor,
                boxShadow: themeStyles.starShadow,
                animation: 'twinkle-cosmos 3.6s ease-in-out infinite',
                animationDelay: '2.6s'
              }}
            />
          </>
        )}
        
        {/* Nebula Clouds - Enhanced */}
        {showNebula && (
          <>
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '350px', 
                height: '200px', 
                top: '5%', 
                left: '-50px',
                background: themeStyles.nebula1,
                filter: 'blur(50px)',
                animation: 'nebula-cosmos 35s linear infinite',
                animationDelay: '0s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '300px', 
                height: '170px', 
                bottom: '15%', 
                right: '-70px',
                background: themeStyles.nebula2,
                filter: 'blur(45px)',
                animation: 'nebula-cosmos 30s linear infinite',
                animationDelay: '10s'
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '400px', 
                height: '220px', 
                top: '40%', 
                left: '60%',
                background: themeStyles.nebula3,
                filter: 'blur(55px)',
                animation: 'nebula-cosmos 40s linear infinite',
                animationDelay: '20s'
              }}
            />
          </>
        )}
        
        {/* Floating Cosmic Particles - Enhanced */}
        {showParticles && (
          <>
            <div 
              className="absolute rounded-full bg-blue-400"
              style={{ 
                width: '5px', 
                height: '5px',
                top: '25%', 
                left: '25%',
                opacity: theme === 'light' ? 0.7 : 0.9,
                boxShadow: '0 0 8px rgba(59, 130, 246, 0.8)',
                animation: 'float-cosmos 10s ease-in-out infinite, pulse-particle-cosmos 4s ease-in-out infinite'
              }}
            />
            <div 
              className="absolute rounded-full bg-purple-400"
              style={{ 
                width: '4px', 
                height: '4px',
                top: '70%', 
                right: '35%',
                opacity: theme === 'light' ? 0.8 : 1,
                boxShadow: '0 0 8px rgba(168, 85, 247, 0.8)',
                animation: 'float-cosmos 9s ease-in-out infinite, pulse-particle-cosmos 3.5s ease-in-out infinite',
                animationDelay: '3s'
              }}
            />
            <div 
              className="absolute rounded-full bg-cyan-400"
              style={{ 
                width: '6px', 
                height: '6px',
                bottom: '30%', 
                left: '65%',
                opacity: theme === 'light' ? 0.6 : 0.85,
                boxShadow: '0 0 10px rgba(34, 211, 238, 0.8)',
                animation: 'float-cosmos 11s ease-in-out infinite, pulse-particle-cosmos 4.5s ease-in-out infinite',
                animationDelay: '6s'
              }}
            />
            <div 
              className="absolute rounded-full bg-indigo-400"
              style={{ 
                width: '4px', 
                height: '4px',
                top: '15%', 
                right: '15%',
                opacity: theme === 'light' ? 0.7 : 0.9,
                boxShadow: '0 0 8px rgba(99, 102, 241, 0.8)',
                animation: 'float-cosmos 10s ease-in-out infinite, pulse-particle-cosmos 3.8s ease-in-out infinite',
                animationDelay: '9s'
              }}
            />
            <div 
              className="absolute rounded-full bg-pink-400"
              style={{ 
                width: '5px', 
                height: '5px',
                top: '50%', 
                left: '40%',
                opacity: theme === 'light' ? 0.7 : 0.9,
                boxShadow: '0 0 8px rgba(236, 72, 153, 0.8)',
                animation: 'float-cosmos 9.5s ease-in-out infinite, pulse-particle-cosmos 4.2s ease-in-out infinite',
                animationDelay: '4s'
              }}
            />
          </>
        )}
        
        {/* Dynamic Comets - Much more visible now */}
        {showComets && comets.map((comet) => (
          <div 
            key={comet.key}
            style={{
              position: 'absolute',
              animation: `${comet.animation} ${comet.speed}s linear infinite`,
              animationDelay: `${comet.delay}s`
            }}
          >
            <div style={{ 
              position: 'relative', 
              width: `${comet.tailLength}px`, 
              height: `${comet.size}px`,
              filter: 'drop-shadow(0 0 10px currentColor)'
            }}>
              {/* Comet head - MUCH larger and brighter than stars */}
              <div 
                className="comet-head absolute rounded-full"
                style={{
                  width: `${comet.size}px`,
                  height: `${comet.size}px`,
                  right: '0',
                  top: '0',
                  background: comet.headGradient,
                  boxShadow: comet.headShadow,
                  zIndex: 10,
                  filter: 'brightness(1.8) drop-shadow(0 0 8px currentColor)'
                }}
              />
              {/* Bright tail core */}
              <div 
                style={{
                  position: 'absolute',
                  right: `${comet.size * 0.8}px`,
                  top: `${comet.size * 0.35}px`,
                  width: `${comet.tailLength - comet.size}px`,
                  height: `${comet.size * 0.3}px`,
                  background: comet.tailCore,
                  boxShadow: comet.tailShadow,
                  zIndex: 5,
                  filter: 'blur(0.5px)'
                }}
              />
              {/* Outer tail glow - much more prominent */}
              <div 
                style={{
                  position: 'absolute',
                  right: `${comet.size * 0.8}px`,
                  top: '1px',
                  width: `${comet.tailLength - comet.size}px`,
                  height: `${comet.size - 2}px`,
                  background: comet.tailGlow,
                  zIndex: 4,
                  filter: 'blur(4px)',
                  borderRadius: '50%'
                }}
              />
            </div>
          </div>
        ))}
        
        {/* Cosmic Drift Lines - Enhanced */}
        <div 
          className="absolute"
          style={{
            top: '20%',
            left: '-100px',
            width: '100px',
            height: '1.5px',
            background: theme === 'light' 
              ? 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.8), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 1), transparent)',
            boxShadow: '0 0 4px rgba(59, 130, 246, 0.5)',
            animation: 'cosmic-drift-cosmos 45s linear infinite'
          }}
        />
        <div 
          className="absolute"
          style={{
            bottom: '30%',
            left: '-100px',
            width: '80px',
            height: '1.5px',
            background: theme === 'light' 
              ? 'linear-gradient(90deg, transparent, rgba(147, 51, 234, 0.7), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(147, 51, 234, 0.9), transparent)',
            boxShadow: '0 0 4px rgba(147, 51, 234, 0.5)',
            animation: 'cosmic-drift-cosmos 50s linear infinite',
            animationDelay: '22s'
          }}
        />
        <div 
          className="absolute"
          style={{
            top: '60%',
            left: '-100px',
            width: '90px',
            height: '1.5px',
            background: theme === 'light' 
              ? 'linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.7), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.9), transparent)',
            boxShadow: '0 0 4px rgba(236, 72, 153, 0.5)',
            animation: 'cosmic-drift-cosmos 55s linear infinite',
            animationDelay: '35s'
          }}
        />
      </div>
    </>
  );
};

export default CosmosBackground;