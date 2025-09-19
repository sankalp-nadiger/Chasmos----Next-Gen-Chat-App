import React, { useState, useEffect } from 'react';
import './loadingbar.css';

const LoadingBar = () => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 9200);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`loading-container ${isLoading ? 'active' : ''}`}>
            <div className="whatsapp-logo">
                <svg
                    width="60"
                    height="60"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z"
                        fill="#3cd325ff"
                    />
                    <path
                        d="M17.5 15.5C17.25 15.25 16.8125 15.0625 16.375 14.875C15.9375 14.6875 15.5625 14.5 15.0625 14.1875C14.5625 13.875 14.1875 13.625 13.8125 13.3125C13.4375 13 13.0625 12.5625 12.75 12.0625C12.5 11.5625 12.25 11.0625 12 10.5625C11.75 10.0625 11.5 9.5625 11.25 9.0625C11 8.5625 10.75 8.125 10.5 7.625C10.25 7.125 10 6.625 9.75 6.125C9.5 5.625 9.25 5.1875 9 4.6875C8.75 4.1875 8.5 3.75 8.25 3.25C8 2.75 7.75 2.25 7.5 1.75C7.25 1.25 7 0.75 6.75 0.25C6.5 0.25 6.25 0.5 6 0.75C5.75 1 5.5 1.25 5.25 1.5C5 1.75 4.75 2 4.5 2.25C4.25 2.5 4 2.75 3.75 3C3.5 3.25 3.25 3.5 3 3.75C2.75 4 2.5 4.25 2.25 4.5C2 4.75 1.75 5 1.5 5.25C1.25 5.5 1 5.75 0.75 6C0.5 6.25 0.25 6.5 0.25 6.75L0.25 6.75Z"
                        fill="white"
                    />
                </svg>
            </div>
            <div className='appname'>Chasmos</div>
            <div className="text-container">
                <p>Next-gen-chat-app</p>
               
               
            </div>
            <div className="loading-bar"></div>

             <p className="end-to-end-encrypted">End-to-end encrypted</p>
        </div>
    );
};

export default LoadingBar;
