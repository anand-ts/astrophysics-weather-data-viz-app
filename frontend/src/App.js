// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { useLazyQuery } from '@apollo/client';
import { GET_WEATHER_DATA } from './queries';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

// Import the logo image
import blackHoleLogo from './assets/black_hole.jpg'; // Ensure the path is correct

// Import Heroicons for the toggle button
import { SunIcon, MoonIcon } from '@heroicons/react/solid';

function App() {
  const [selectedVariables, setSelectedVariables] = useState([]);
  const [showMovingAverage, setShowMovingAverage] = useState(false);
  const [movingAverageWindow, setMovingAverageWindow] = useState(5); // State for window size
  const [startDate, setStartDate] = useState(''); // Date string
  const [endDate, setEndDate] = useState(''); // Date string
  const [dateError, setDateError] = useState({ startDate: false, endDate: false }); // State for date validation
  const [showOnlyMovingAverage, setShowOnlyMovingAverage] = useState(false); // State for additional graph

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for theme preference
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
    // Save preference to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Helper function to validate date format
  const isValidDateFormat = useCallback((dateString) => {
    // Regex to match "YYYY-MM-DD HH:mm:ss"
    const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    return regex.test(dateString);
  }, []);

  // Initialize useLazyQuery
  const [getWeatherData, { loading, error, data }] = useLazyQuery(GET_WEATHER_DATA, {
    fetchPolicy: 'network-only', // Always fetch from server
  });

  useEffect(() => {
    // Validate dates but do not refetch automatically
    const isStartDateValid = startDate ? isValidDateFormat(startDate) : false;
    const isEndDateValid = endDate ? isValidDateFormat(endDate) : false;

    setDateError({ startDate: !isStartDateValid, endDate: !isEndDateValid });

    // Removed automatic refetching
  }, [startDate, endDate, isValidDateFormat]);

  const handleVariableChange = (event) => {
    const { value, checked } = event.target;
    if (checked) {
      setSelectedVariables((prev) => [...prev, value]);
    } else {
      setSelectedVariables((prev) => prev.filter((item) => item !== value));
    }
    setShowMovingAverage(false); // Reset moving average when variables change
    setShowOnlyMovingAverage(false); // Hide additional graph when variables change
  };

  const handleMovingAverageToggle = () => {
    setShowMovingAverage(!showMovingAverage);
  };

  const handleMovingAverageWindowChange = (event) => {
    const value = event.target.value;
    // Validate that the input is a positive integer
    const intValue = parseInt(value, 10);
    if (!isNaN(intValue) && intValue > 0) {
      setMovingAverageWindow(intValue);
    } else if (value === '') {
      setMovingAverageWindow('');
    }
    // Optionally, you can provide feedback for invalid inputs
  };

  const calculateMovingAverage = (data, windowSize = 5) => {
    if (!data || data.length === 0) return {};

    const averages = {};

    selectedVariables.forEach((variable) => {
      averages[variable] = [];

      for (let i = 0; i < data.length; i++) {
        // Define the window slice
        const window = data.slice(i - windowSize + 1, i + 1);

        // Filter out 0 and undefined/null values
        const validValues = window
          .map((entry) => entry[variable])
          .filter((value) => value !== 0 && value !== undefined && value !== null);

        if (validValues.length === 0) {
          averages[variable].push(null); // Not enough valid data to calculate average
          continue;
        }

        // Calculate the average of valid values
        const sum = validValues.reduce((acc, curr) => acc + curr, 0);
        const avg = sum / validValues.length;

        averages[variable].push(avg);
      }
    });

    return averages;
  };

  const getColor = (index, opacity = 1) => {
    const colors = [
      'rgba(75,192,192',   // Teal
      'rgba(255,99,132',   // Red
      'rgba(54,162,235',   // Blue
      'rgba(255,206,86',    // Yellow
      'rgba(153,102,255',   // Purple
      'rgba(255,159,64',    // Orange
    ];

    const baseColor = colors[index % colors.length] + `, ${opacity})`;
    return baseColor;
  };

  const getChartData = () => {
    if (!data || !data.getWeatherData || selectedVariables.length === 0) return { labels: [], datasets: [] };

    const cleanedData = data.getWeatherData.filter((entry) => entry.wdatetime);

    if (cleanedData.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = cleanedData.map((entry) =>
      new Date(entry.wdatetime).toLocaleString()
    );

    const chartData = {
      labels,
      datasets: [],
    };

    selectedVariables.forEach((variable, index) => {
      const values = cleanedData.map(
        (entry) => (entry[variable] !== undefined ? entry[variable] : null)
      );

      // Variable Dataset
      chartData.datasets.push({
        label: variables.find((v) => v.value === variable).label,
        data: values,
        fill: false,
        backgroundColor: getColor(index),
        borderColor: getColor(index),
        borderWidth: 1,
        pointRadius: 1,
        pointHoverRadius: 8,
        tension: 0.1,
        spanGaps: true,
        yAxisID: selectedVariables.length > 1 ? `y-axis-${index}` : 'y',
      });

      // Moving Average Dataset
      if (showMovingAverage && movingAverageWindow) {
        const movingAverage = calculateMovingAverage(cleanedData, movingAverageWindow)[variable];
        chartData.datasets.push({
          label: `${variables.find((v) => v.value === variable).label} (${movingAverageWindow}-point MA)`,
          data: movingAverage,
          fill: false,
          backgroundColor: getColor(index, 0.5), // 50% opacity
          borderColor: getColor(index, 0.5),     // 50% opacity
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0.1,
          spanGaps: true,
          yAxisID: selectedVariables.length > 1 ? `y-axis-${index}` : 'y',
        });
      }
    });

    return chartData;
  };

  const getMovingAverageChartData = () => {
    if (!data || !data.getWeatherData || selectedVariables.length === 0) return { labels: [], datasets: [] };

    const cleanedData = data.getWeatherData.filter((entry) => entry.wdatetime);

    if (cleanedData.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = cleanedData.map((entry) =>
      new Date(entry.wdatetime).toLocaleString()
    );

    const chartData = {
      labels,
      datasets: [],
    };

    selectedVariables.forEach((variable, index) => {
      if (showMovingAverage && movingAverageWindow) {
        const movingAverage = calculateMovingAverage(cleanedData, movingAverageWindow)[variable];
        chartData.datasets.push({
          label: `${variables.find((v) => v.value === variable).label} (${movingAverageWindow}-point MA)`,
          data: movingAverage,
          fill: false,
          backgroundColor: getColor(index, 0.5), // 50% opacity
          borderColor: getColor(index, 0.5),     // 50% opacity
          borderWidth: 2,
          pointRadius: 1,
          pointHoverRadius: 0,
          tension: 0.1,
          spanGaps: true,
          yAxisID: selectedVariables.length > 1 ? `y-axis-${index}` : 'y',
        });
      }
    });

    return chartData;
  };

  const variables = [
    { label: 'Temperature (K)', value: 'temperature_k' },
    { label: 'Dew Point (K)', value: 'dewpoint_k' },
    { label: 'Pressure (kPa)', value: 'pressure_kpa' },
    { label: 'Relative Humidity (%)', value: 'relhumidity_pct' },
    { label: 'Wind Direction (°)', value: 'winddir_deg' },
    { label: 'Wind Speed (m/s)', value: 'windspeed_mps' },
    { label: 'PWV (mm)', value: 'pwv_mm' },
    { label: 'Phaser MS (°)', value: 'phaserms_deg' },
    { label: 'Tau 183 GHz', value: 'tau183ghz' },
    { label: 'Tau 215 GHz', value: 'tau215ghz' },
    { label: 'Tau 225 GHz', value: 'tau225ghz' },
  ];

  const chartData = getChartData();
  const movingAverageChartData = getMovingAverageChartData();

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header */}
      <header className="bg-black text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <img src={blackHoleLogo} alt="Black Hole Logo" className="h-8 w-8 mr-2" />
          <h1 className="text-lg font-semibold">Black Hole Astrophysics Group - Georgia Tech</h1>
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

      {/* Main Layout */}
      <div className="flex flex-col md:flex-row flex-1">
        {/* Sidebar */}
        <div className="md:w-1/4 lg:w-1/5 bg-gray-100 dark:bg-gray-800 p-4 overflow-auto border-r border-gray-300 dark:border-gray-700 transition-colors duration-300">
          <h2 className="text-xl font-semibold mb-4">Variables</h2>
          <div className="flex flex-col space-y-2">
            {variables.map((varItem) => (
              <label key={varItem.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={varItem.value}
                  checked={selectedVariables.includes(varItem.value)}
                  onChange={handleVariableChange}
                  className="form-checkbox h-5 w-5 text-blue-600 dark:text-blue-400"
                  aria-label={`Toggle ${varItem.label}`}
                />
                <span className="text-gray-700 dark:text-gray-300">{varItem.label}</span>
              </label>
            ))}
          </div>

          {/* Moving Average Controls */}
          {selectedVariables.length > 0 && (
            <div className="mt-6 flex items-center space-x-4">
              <button
                onClick={handleMovingAverageToggle}
                className={`px-4 py-2 rounded text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300 ${showMovingAverage
                    ? 'bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                    : 'bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'
                  }`}
              >
                {showMovingAverage ? 'Hide Moving Average' : 'Show Moving Average'}
              </button>

              {showMovingAverage && (
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Step Size:</label>
                  <input
                    type="number"
                    value={movingAverageWindow}
                    onChange={handleMovingAverageWindowChange}
                    className="mt-1 block w-24 border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600 dark:focus:border-indigo-600 transition-colors duration-300"
                    min="1"
                    placeholder="Enter size"
                  />
                  {movingAverageWindow !== '' && (isNaN(movingAverageWindow) || movingAverageWindow < 1) && (
                    <p className="text-red-500 text-sm mt-1">Enter a positive integer.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Date Range Selector */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Select Date Range</h3>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date:</label>
                <input
                  type="text"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`mt-1 block w-full border ${dateError.startDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600 dark:focus:border-indigo-600 transition-colors duration-300`}
                  placeholder="YYYY-MM-DD HH:mm:ss"
                  aria-label="Start Date"
                />
                {/* Validation Message */}
                {startDate && dateError.startDate && (
                  <p className="text-red-500 text-sm mt-1">Invalid date format.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date:</label>
                <input
                  type="text"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`mt-1 block w-full border ${dateError.endDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600 dark:focus:border-indigo-600 transition-colors duration-300`}
                  placeholder="YYYY-MM-DD HH:mm:ss"
                  aria-label="End Date"
                />
                {/* Validation Message */}
                {endDate && dateError.endDate && (
                  <p className="text-red-500 text-sm mt-1">Invalid date format.</p>
                )}
              </div>
              {/* Apply Button */}
              <button
                onClick={() => {
                  if (startDate && endDate && !dateError.startDate && !dateError.endDate) {
                    getWeatherData({
                      variables: {
                        limit: 10000,
                        startDate: startDate,
                        endDate: endDate,
                      },
                    });
                    setShowOnlyMovingAverage(false); // Hide additional graph when new data is fetched
                  }
                }}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300 flex items-center justify-center"
                disabled={!startDate || !endDate || dateError.startDate || dateError.endDate}
                aria-label="Apply Date Range"
              >
                {loading ? 'Loading...' : 'Apply'}
              </button>
            </form>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:w-3/4 lg:w-4/5 p-6 overflow-auto">
          {selectedVariables.length > 0 ? (
            <>
              {/* Main Graph */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded shadow h-[500px] transition-colors duration-300">
                {loading && !showOnlyMovingAverage ? (
                  <div className="flex justify-center items-center h-full">
                    <p>Loading...</p>
                  </div>
                ) : error && !showOnlyMovingAverage ? (
                  <p className="text-center text-red-500">Error: {error.message}</p>
                ) : data && data.getWeatherData && data.getWeatherData.length > 0 ? (
                  <Line
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                          labels: {
                            color: isDarkMode ? '#f3f4f6' : '#1f2937', // Adjust legend text color
                          },
                        },
                        title: {
                          display: true,
                          text:
                            selectedVariables.length === 1
                              ? variables.find((v) => v.value === selectedVariables[0]).label
                              : 'Selected Variables Comparison',
                          color: isDarkMode ? '#f3f4f6' : '#1f2937', // Adjust title color
                        },
                      },
                      scales: selectedVariables.length > 1
                        ? selectedVariables.reduce((acc, variable, index) => {
                          acc[`y-axis-${index}`] = {
                            type: 'linear',
                            position: index % 2 === 0 ? 'left' : 'right',
                            grid: {
                              drawOnChartArea: index === 0,
                              color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', // Grid color
                            },
                            title: {
                              display: true,
                              text: variables.find((v) => v.value === variable).label,
                              color: isDarkMode ? '#f3f4f6' : '#1f2937', // Y-axis title color
                            },
                            ticks: {
                              color: isDarkMode ? '#f3f4f6' : '#1f2937', // Y-axis tick color
                            },
                          };
                          return acc;
                        }, {})
                        : {
                          y: {
                            title: {
                              display: true,
                              text: variables.find((v) => v.value === selectedVariables[0]).label,
                              color: isDarkMode ? '#f3f4f6' : '#1f2937', // Y-axis title color
                            },
                            ticks: {
                              color: isDarkMode ? '#f3f4f6' : '#1f2937', // Y-axis tick color
                            },
                            beginAtZero: false,
                            grid: {
                              color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', // Grid color
                            },
                          },
                        },
                    }}
                  />
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400">No data available for the selected date range.</p>
                )}
              </div>

              {/* Toggle Moving Average Graph Button */}
              {selectedVariables.length > 0 && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setShowOnlyMovingAverage(!showOnlyMovingAverage)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300"
                    aria-label="Toggle Moving Average Graph"
                  >
                    {showOnlyMovingAverage ? '− Hide Moving Average Graph' : '+ Show Moving Average Graph'}
                  </button>
                </div>
              )}

              {/* Additional Moving Average Graph */}
              {showOnlyMovingAverage && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded shadow h-[500px] mt-6 transition-colors duration-300">
                  {loading ? (
                    <div className="flex justify-center items-center h-full">
                      <p>Loading...</p>
                    </div>
                  ) : error ? (
                    <p className="text-center text-red-500">Error: {error.message}</p>
                  ) : data && data.getWeatherData && data.getWeatherData.length > 0 ? (
                    <Line
                      data={movingAverageChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                            labels: {
                              color: isDarkMode ? '#f3f4f6' : '#1f2937', // Adjust legend text color
                            },
                          },
                          title: {
                            display: true,
                            text: 'Moving Average Lines',
                            color: isDarkMode ? '#f3f4f6' : '#1f2937', // Title color
                          },
                        },
                        scales: selectedVariables.length > 1
                          ? selectedVariables.reduce((acc, variable, index) => {
                            acc[`y-axis-${index}`] = {
                              type: 'linear',
                              position: index % 2 === 0 ? 'left' : 'right',
                              grid: {
                                drawOnChartArea: index === 0,
                                color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', // Grid color
                              },
                              title: {
                                display: true,
                                text: variables.find((v) => v.value === variable).label,
                                color: isDarkMode ? '#f3f4f6' : '#1f2937', // Y-axis title color
                              },
                              ticks: {
                                color: isDarkMode ? '#f3f4f6' : '#1f2937', // Y-axis tick color
                              },
                            };
                            return acc;
                          }, {})
                          : {
                            y: {
                              title: {
                                display: true,
                                text: variables.find((v) => v.value === selectedVariables[0]).label,
                                color: isDarkMode ? '#f3f4f6' : '#1f2937', // Y-axis title color
                              },
                              ticks: {
                                color: isDarkMode ? '#f3f4f6' : '#1f2937', // Y-axis tick color
                              },
                              beginAtZero: false,
                              grid: {
                                color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', // Grid color
                              },
                            },
                          },
                      }}
                    />
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400">No data available for the selected date range.</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">Select one or more variables to display the graph.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
