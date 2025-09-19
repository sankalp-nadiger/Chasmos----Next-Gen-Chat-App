import React, { useState, useEffect } from 'react';
import LoadingBar from './components/loadingbar.jsx';
import './App.css'; 
function App() {
    const [isLoading, setIsLoading] = useState(true);

    
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1700); 
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="App">
            {isLoading ? <LoadingBar /> : (
                <main>
                   
                    <h1>Welcome to my app!</h1>
                    <p>The loading animation has completed.</p>
                </main>
            )}
        </div>
    );
}

export default App;