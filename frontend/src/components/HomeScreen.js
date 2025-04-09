import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// Import icons for dark/light mode toggle
import { SunIcon, MoonIcon } from '@heroicons/react/solid';

// Import the logo image
import blackHoleLogo from '../assets/black_hole.jpg';

function HomeScreen() {
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' ? true : false;
  });

  // Update the HTML element's class based on dark mode state
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 flex flex-col">
      <header className="bg-black text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex items-center">
            <img src={blackHoleLogo} alt="Black Hole Logo" className="h-8 w-8 mr-2" />
            <h1 className="text-lg font-semibold">Black Hole Astrophysics Group - Georgia Tech</h1>
          </div>
        </div>
        {/* Dark Mode Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300"
          aria-label="Toggle Dark Mode"
        >
          {isDarkMode ? (
            <SunIcon className="h-6 w-6 text-yellow-400" />
          ) : (
            <MoonIcon className="h-6 w-6 text-gray-200" />
          )}
        </button>
      </header>

      <div className="container mx-auto px-4 py-16 flex-1">
        <h1 className="text-3xl font-bold text-center mb-12">Weather Data Visualization</h1>
        
        <div className="flex flex-col md:flex-row justify-center items-center gap-8">
          {/* Select Variable Card */}
          <Link to="/variables" className="w-full md:w-1/3">
            <div className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 p-8">
              <h2 className="text-2xl font-bold mb-4">Select Variable</h2>
              <p>Choose weather variables like temperature, pressure, and wind speed to visualize data from different telescopes.</p>
              <div className="mt-6 text-center">
                <span className="inline-block px-4 py-2 border-2 border-white rounded-md">
                  Get Started
                </span>
              </div>
            </div>
          </Link>
          
          {/* Select Telescope Card */}
          <Link to="/telescopes" className="w-full md:w-1/3">
            <div className="bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 p-8">
              <h2 className="text-2xl font-bold mb-4">Select Telescope</h2>
              <p>Choose telescopes to compare different weather variables across multiple observation sites.</p>
              <div className="mt-6 text-center">
                <span className="inline-block px-4 py-2 border-2 border-white rounded-md">
                  Get Started
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <footer className="bg-gray-100 dark:bg-gray-800 p-4 text-center text-gray-800 dark:text-gray-200 transition-colors duration-300">
        <p>© 2025 Black Hole Astrophysics Group - Georgia Tech</p>
      </footer>
    </div>
  );
}

export default HomeScreen;
