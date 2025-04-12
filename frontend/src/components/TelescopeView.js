import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLazyQuery } from '@apollo/client';
import { GET_WEATHER_DATA } from '../queries';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
// Fix the zoom plugin import
import { Chart } from 'chart.js';
import Zoom from 'chartjs-plugin-zoom/dist/chartjs-plugin-zoom.min.js';
import { Link } from 'react-router-dom';

// Import the logo image
import blackHoleLogo from '../assets/black_hole.jpg';

// Fix heroicons import
import { ArrowLeftIcon, SunIcon, MoonIcon, RefreshIcon } from '@heroicons/react/solid';

// Register Zoom Plugin
Chart.register(Zoom);

function TelescopeView() {
  const [selectedVariable, setSelectedVariable] = useState('temperature_k');
  const [selectedTelescopes, setSelectedTelescopes] = useState([]);
  const [showMovingAverage, setShowMovingAverage] = useState(false);
  const [movingAverageWindow, setMovingAverageWindow] = useState(5);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState({ startDate: false, endDate: false });
  const [showOnlyMovingAverage, setShowOnlyMovingAverage] = useState(false);
  
  // New state to store all telescope data
  const [telescopeData, setTelescopeData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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

  // Helper function to validate date format
  const isValidDateFormat = useCallback((dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    return regex.test(dateString);
  }, []);

  // Initialize useLazyQuery
  const [getWeatherData, { error: queryError }] = useLazyQuery(GET_WEATHER_DATA, {
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    // Validate dates but do not refetch automatically
    const isStartDateValid = startDate ? isValidDateFormat(startDate) : false;
    const isEndDateValid = endDate ? isValidDateFormat(endDate) : false;

    setDateError({ startDate: !isStartDateValid, endDate: !isEndDateValid });
  }, [startDate, endDate, isValidDateFormat]);

  const handleTelescopeChange = (event) => {
    const { value, checked } = event.target;
    if (checked) {
      setSelectedTelescopes((prev) => [...prev, value]);
    } else {
      setSelectedTelescopes((prev) => prev.filter((item) => item !== value));
    }
    setShowMovingAverage(false);
    setShowOnlyMovingAverage(false);
  };

  const handleVariableChange = (event) => {
    setSelectedVariable(event.target.value);
    setShowMovingAverage(false);
    setShowOnlyMovingAverage(false);
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
  };

  // New function to fetch data for all selected telescopes
  const fetchTelescopeData = async () => {
    if (startDate && endDate && !dateError.startDate && !dateError.endDate && selectedTelescopes.length > 0) {
      setIsLoading(true);
      const newData = {};
      let hasError = false;
      
      // Fetch data for each selected telescope
      for (const telescope of selectedTelescopes) {
        try {
          const result = await getWeatherData({
            variables: {
              collection: telescope,
              limit: 10000,
              startDate: startDate,
              endDate: endDate,
            }
          });
          
          if (result.data && result.data.getWeatherData) {
            newData[telescope] = result.data.getWeatherData;
          }
        } catch (err) {
          console.error(`Error fetching data for ${telescope}:`, err);
          hasError = true;
        }
      }
      
      setTelescopeData(newData);
      setIsLoading(false);
      setShowOnlyMovingAverage(false);
    }
  };

  const calculateMovingAverage = (data, collection, windowSize = 5) => {
    if (!data || !data[collection] || data[collection].length === 0) return [];

    const values = data[collection].map(entry => entry[selectedVariable]);
    const movingAverages = [];

    for (let i = 0; i < values.length; i++) {
      // Define window slice
      const window = values.slice(Math.max(0, i - windowSize + 1), i + 1);
      
      // Filter out invalid values
      const validValues = window.filter(val => val !== 0 && val !== null && val !== undefined);
      
      if (validValues.length === 0) {
        movingAverages.push(null);
        continue;
      }
      
      // Calculate average
      const sum = validValues.reduce((acc, val) => acc + val, 0);
      const avg = sum / validValues.length;
      
      movingAverages.push(avg);
    }
    
    return movingAverages;
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
    if (!telescopeData || selectedTelescopes.length === 0) return { labels: [], datasets: [] };

    // Combine labels from all telescopes
    let allLabels = [];
    selectedTelescopes.forEach(telescope => {
      if (telescopeData[telescope] && telescopeData[telescope].length > 0) {
        const telescopeLabels = telescopeData[telescope].map(entry => 
          new Date(entry.wdatetime).toLocaleString()
        );
        allLabels = [...allLabels, ...telescopeLabels];
      }
    });
    
    // Sort and deduplicate labels
    const uniqueLabels = [...new Set(allLabels)].sort((a, b) => new Date(a) - new Date(b));

    const chartData = {
      labels: uniqueLabels,
      datasets: [],
    };

    selectedTelescopes.forEach((telescope, index) => {
      if (!telescopeData[telescope]) return;
      
      // Create a map of date string to value for quick lookup
      const dateValueMap = {};
      telescopeData[telescope].forEach(entry => {
        dateValueMap[new Date(entry.wdatetime).toLocaleString()] = entry[selectedVariable];
      });
      
      // Create dataset with values corresponding to each label
      const values = uniqueLabels.map(label => dateValueMap[label] || null);
      
      // Variable Dataset
      chartData.datasets.push({
        label: `${telescopes.find(t => t.value === telescope).label} - ${variables.find(v => v.value === selectedVariable).label}`,
        data: values,
        fill: false,
        backgroundColor: getColor(index),
        borderColor: getColor(index),
        borderWidth: 1,
        pointRadius: 1,
        pointHoverRadius: 8,
        tension: 0.1,
        spanGaps: true,
        yAxisID: 'y',
      });

      // Moving Average Dataset
      if (showMovingAverage && movingAverageWindow) {
        const movingAverage = calculateMovingAverage({ [telescope]: telescopeData[telescope] }, telescope, movingAverageWindow);
        
        // Map moving averages to labels
        const maValues = [];
        telescopeData[telescope].forEach((entry, i) => {
          const dateStr = new Date(entry.wdatetime).toLocaleString();
          const labelIndex = uniqueLabels.indexOf(dateStr);
          if (labelIndex !== -1) {
            maValues[labelIndex] = movingAverage[i];
          }
        });
        
        chartData.datasets.push({
          label: `${telescopes.find(t => t.value === telescope).label} - ${variables.find(v => v.value === selectedVariable).label} (${movingAverageWindow}-point MA)`,
          data: maValues,
          fill: false,
          backgroundColor: getColor(index, 0.5),
          borderColor: getColor(index, 0.5),
          borderWidth: 3,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0.1,
          spanGaps: true,
          yAxisID: 'y',
        });
      }
    });

    return chartData;
  };

  const telescopes = [
    { label: 'APEX', value: 'apex_2006_2023' },
    { label: 'GLT', value: 'glt_2017_2022' },
    { label: 'JCMT', value: 'jcmt_data' },
    { label: 'SMA', value: 'sma_data' },
    { label: 'SMT', value: 'smt_data' },
    { label: 'LMT', value: 'lmt_data' },
    { label: 'ALMA', value: 'alma_data' },
  ];

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

  // Add chart reference for zoom reset
  const chartRef = useRef(null);
  
  // Add a function to reset zoom
  const resetZoom = () => {
    if (chartRef && chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header */}
      <header className="bg-black text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="mr-4 hover:text-gray-300">
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
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

      {/* Main Layout */}
      <div className="flex flex-col md:flex-row flex-1">
        {/* Sidebar */}
        <div className="md:w-1/4 lg:w-1/5 bg-gray-100 dark:bg-gray-800 p-4 overflow-auto border-r border-gray-300 dark:border-gray-700 transition-colors duration-300">
          {/* Variable Selector */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Select Variable</h2>
            <select
              value={selectedVariable}
              onChange={handleVariableChange}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600 dark:focus:border-indigo-600 transition-colors duration-300"
              aria-label="Select Variable"
            >
              {variables.map(variable => (
                <option key={variable.value} value={variable.value}>{variable.label}</option>
              ))}
            </select>
          </div>

          {/* Telescopes Selection */}
          <h2 className="text-xl font-semibold mb-4">Telescopes</h2>
          <div className="flex flex-col space-y-2">
            {telescopes.map((telescope) => (
              <label key={telescope.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={telescope.value}
                  checked={selectedTelescopes.includes(telescope.value)}
                  onChange={handleTelescopeChange}
                  className="form-checkbox h-5 w-5 text-purple-600 dark:text-purple-400"
                  aria-label={`Toggle ${telescope.label}`}
                />
                <span className="text-gray-700 dark:text-gray-300">{telescope.label}</span>
              </label>
            ))}
          </div>

          {/* Moving Average Controls */}
          {selectedTelescopes.length > 0 && (
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
                    className={`mt-1 block w-24 border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600 dark:focus:border-indigo-600 transition-colors duration-300`}
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
                {endDate && dateError.endDate && (
                  <p className="text-red-500 text-sm mt-1">Invalid date format.</p>
                )}
              </div>
              {/* Apply Button */}
              <button
                onClick={fetchTelescopeData}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300 flex items-center justify-center"
                disabled={!startDate || !endDate || dateError.startDate || dateError.endDate || selectedTelescopes.length === 0}
                aria-label="Apply Date Range"
              >
                {isLoading ? 'Loading...' : 'Apply'}
              </button>
            </form>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:w-3/4 lg:w-4/5 p-6 overflow-auto">
          {selectedTelescopes.length > 0 ? (
            <>
              {/* Main Graph */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded shadow transition-colors duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">
                    {variables.find(v => v.value === selectedVariable).label} Across Selected Telescopes
                  </h2>
                  <button
                    onClick={resetZoom}
                    className="flex items-center px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300"
                    disabled={Object.keys(telescopeData).length === 0}
                    title="Reset Zoom"
                  >
                    <RefreshIcon className="h-4 w-4 mr-1" />
                    Reset Zoom
                  </button>
                </div>
                <div className="h-[500px]">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <p>Loading...</p>
                    </div>
                  ) : queryError ? (
                    <p className="text-center text-red-500">Error: {queryError.message}</p>
                  ) : Object.keys(telescopeData).length > 0 ? (
                    <Line
                      ref={chartRef}
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                            labels: {
                              color: isDarkMode ? '#f3f4f6' : '#1f2937',
                            },
                          },
                          title: {
                            display: true,
                            text: `${variables.find(v => v.value === selectedVariable).label} Across Selected Telescopes`,
                            color: isDarkMode ? '#f3f4f6' : '#1f2937',
                          },
                          // Add zoom plugin configuration
                          zoom: {
                            pan: {
                              enabled: true,
                              mode: 'x',
                              modifierKey: 'shift',
                            },
                            zoom: {
                              wheel: {
                                enabled: true,
                                speed: 0.1,  // Reduced from default
                                sensitivity: 0.1,  // Lower sensitivity for smoother zoom
                              },
                              pinch: {
                                enabled: true,
                              },
                              drag: {
                                enabled: true,
                                backgroundColor: isDarkMode ? 'rgba(128,128,128,0.3)' : 'rgba(225,225,225,0.3)',
                                borderColor: isDarkMode ? 'rgba(128,128,128)' : 'rgba(225,225,225)',
                                borderWidth: 1,
                                threshold: 10,
                              },
                              mode: 'x',
                            },
                          },
                        },
                        scales: {
                          y: {
                            title: {
                              display: true,
                              text: variables.find(v => v.value === selectedVariable).label,
                              color: isDarkMode ? '#f3f4f6' : '#1f2937',
                            },
                            ticks: {
                              color: isDarkMode ? '#f3f4f6' : '#1f2937',
                            },
                            beginAtZero: false,
                            grid: {
                              color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            },
                          },
                          x: {
                            ticks: {
                              color: isDarkMode ? '#f3f4f6' : '#1f2937',
                              maxRotation: 45,
                              minRotation: 45,
                            },
                            grid: {
                              color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            },
                          }
                        }
                      }}
                    />
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400">No data available. Please apply a date range filter.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">Select one or more telescopes to display the graph.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TelescopeView;
