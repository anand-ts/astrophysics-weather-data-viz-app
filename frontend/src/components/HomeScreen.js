import React from 'react';
import { Link } from 'react-router-dom';

function HomeScreen() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <header className="bg-black text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold">Black Hole Astrophysics Group - Georgia Tech</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
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

      <footer className="bg-gray-100 dark:bg-gray-800 p-4 text-center mt-auto">
        <p>© 2023 Black Hole Astrophysics Group - Georgia Tech</p>
      </footer>
    </div>
  );
}

export default HomeScreen;
