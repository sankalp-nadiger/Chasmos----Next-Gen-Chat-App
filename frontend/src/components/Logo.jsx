import React from 'react';
import logo from '../assets/Chasmos_logo.png';

const Logo = ({
  size = 'md',
  variant = 'default',   //  NEW
  showText = true,
  textClassName = '',
  containerClassName = ''
}) => {

  const largeSizes = {
  sm: { container: 'w-10 h-10', img: 'w-7 h-7', text: 'text-lg' },
  md: { container: 'w-12 h-12', img: 'w-9 h-9', text: 'text-xl' },
  lg: { container: 'w-20 h-20', img: 'w-17 h-17', text: 'text-2xl' }
};

const compactSizes = {
  sm: { container: 'w-8 h-8', img: 'w-5 h-5', text: 'text-lg' },
  md: { container: 'w-10 h-10', img: 'w-7 h-7', text: 'text-xl' },
  lg: { container: 'w-14 h-14', img: 'w-12 h-12', text: 'text-2xl' }
};


  const sizes = variant === 'compact' ? compactSizes : largeSizes;
  const sizeConfig = sizes[size] || sizes.md;

  return (
    <>
     <div
  className={`${sizeConfig.container} rounded-full bg-white flex items-center justify-center shadow overflow-hidden ${containerClassName}`}
  style={{ aspectRatio: '1 / 1' }}
>

  <img
    src={logo}
    alt="Chasmos Logo"
    className={`${sizeConfig.img} object-contain max-w-full max-h-full`}
    style={{ transform: 'scale(0.95)' }}  //  subtle breathing room
    draggable="false"
  />
</div>

   

      {showText && (
        <h1
          className={`${sizeConfig.text} font-bold ${textClassName}`}
          style={{
            fontFamily: "'Orbitron', sans-serif",
            letterSpacing: '2px'
          }}
        >
          Chasmos
        </h1>
      )}
    </>
  );
};

export default Logo;
