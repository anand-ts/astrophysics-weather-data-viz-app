import React, { useState, useEffect, useCallback } from 'react';
import { useLazyQuery } from '@apollo/client';
import { GET_WEATHER_DATA } from '../queries';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import Confetti from 'react-confetti';
import { Link } from 'react-router-dom';

// Import the logo image
import blackHoleLogo from '../assets/black_hole.jpg';

// Fix heroicons import with correct component names
import { ArrowLeftIcon, SunIcon, MoonIcon } from '@heroicons/react/solid';

function VariableView() {
  const [selectedCollection, setSelectedCollection] = useState('apex_2006_2023');
  const [selectedVariables, setSelectedVariables] = useState([]);
  const [showMovingAverage, setShowMovingAverage] = useState(false);
  const [movingAverageWindow, setMovingAverageWindow] = useState(5);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState({ startDate: false, endDate: false });
  const [showOnlyMovingAverage, setShowOnlyMovingAverage] = useState(false);

  // New state variables for statistics
  const [showStatistics, setShowStatistics] = useState(false);
  const [showCorrelation, setShowCorrelation] = useState(false);

  // Confetti state
  const [confettiActive, setConfettiActive] = useState(false);
  const [confettiDimensions, setConfettiDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

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

  // Handle window resize for confetti
  useEffect(() => {
    const handleResize = () => {
      setConfettiDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  }, [startDate, endDate, isValidDateFormat]);

  const handleVariableChange = (event) => {
    const { value, checked } = event.target;
    if (checked) {
      setSelectedVariables((prev) => [...prev, value]);
    } else {
      setSelectedVariables((prev) => prev.filter((item) => item !== value));
    }
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
          borderWidth: 3,
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

    // Moving Average Graph
    selectedVariables.forEach((variable, index) => {
      if (showMovingAverage && movingAverageWindow) {
        const movingAverage = calculateMovingAverage(cleanedData, movingAverageWindow)[variable];
        chartData.datasets.push({
          label: `${variables.find((v) => v.value === variable).label} (${movingAverageWindow}-point MA)`,
          data: movingAverage,
          fill: false,
          backgroundColor: getColor(index),
          borderColor: getColor(index),
          borderWidth: 3,
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

  const calculateMean = (data, variable) => {
    if (!data || data.length === 0) return 0;

    const validValues = data
      .map(entry => entry[variable])
      .filter(value => value !== undefined && value !== null && !isNaN(value));

    if (validValues.length === 0) return 0;

    const sum = validValues.reduce((acc, curr) => acc + curr, 0);
    return sum / validValues.length;
  };

  const calculateStdDev = (data, variable) => {
    if (!data || data.length === 0) return 0;

    const validValues = data
      .map(entry => entry[variable])
      .filter(value => value !== undefined && value !== null && !isNaN(value));

    if (validValues.length === 0) return 0;

    const mean = validValues.reduce((acc, curr) => acc + curr, 0) / validValues.length;
    const squaredDifferences = validValues.map(value => Math.pow(value - mean, 2));
    const variance = squaredDifferences.reduce((acc, curr) => acc + curr, 0) / validValues.length;
    return Math.sqrt(variance);
  };

  const calculateCorrelation = (data, var1, var2) => {
    if (!data || data.length === 0 || !var1 || !var2) return 0;

    const pairs = data.map(entry => [entry[var1], entry[var2]])
      .filter(pair => pair[0] !== undefined && pair[0] !== null && !isNaN(pair[0]) &&
                      pair[1] !== undefined && pair[1] !== null && !isNaN(pair[1]));

    if (pairs.length < 2) return 0;

    const mean1 = pairs.reduce((sum, pair) => sum + pair[0], 0) / pairs.length;
    const mean2 = pairs.reduce((sum, pair) => sum + pair[1], 0) / pairs.length;

    let covariance = 0;
    let variance1 = 0;
    let variance2 = 0;

    for (const pair of pairs) {
      const diff1 = pair[0] - mean1;
      const diff2 = pair[1] - mean2;

      covariance += diff1 * diff2;
      variance1 += diff1 * diff1;
      variance2 += diff2 * diff2;
    }

    covariance /= pairs.length;
    variance1 /= pairs.length;
    variance2 /= pairs.length;

    if (variance1 === 0 || variance2 === 0) return 0;

    return covariance / (Math.sqrt(variance1) * Math.sqrt(variance2));
  };

  const StatisticsDisplay = ({ data, selectedVariables, variables }) => {
    if (!data || data.length === 0 || selectedVariables.length === 0) {
      return <p className="text-center text-gray-500 dark:text-gray-400">No data available for statistics.</p>;
    }

    const cleanedData = data.filter(entry => entry.wdatetime);

    return (
      <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded shadow transition-colors duration-300">
        <h3 className="text-lg font-semibold mb-2">Statistics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Variable</th>
                <th className="px-4 py-2 text-right">Mean</th>
                <th className="px-4 py-2 text-right">Std Dev</th>
                <th className="px-4 py-2 text-right">Min</th>
                <th className="px-4 py-2 text-right">Max</th>
                <th className="px-4 py-2 text-right">Count</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {selectedVariables.map(variable => {
                const validValues = cleanedData
                  .map(entry => entry[variable])
                  .filter(value => value !== undefined && value !== null && !isNaN(value));

                const mean = calculateMean(cleanedData, variable);
                const stdDev = calculateStdDev(cleanedData, variable);
                const min = Math.min(...validValues);
                const max = Math.max(...validValues);
                const count = validValues.length;

                const variableLabel = variables.find(v => v.value === variable)?.label || variable;

                return (
                  <tr key={variable}>
                    <td className="px-4 py-2">{variableLabel}</td>
                    <td className="px-4 py-2 text-right">{mean.toFixed(4)}</td>
                    <td className="px-4 py-2 text-right">{stdDev.toFixed(4)}</td>
                    <td className="px-4 py-2 text-right">{min.toFixed(4)}</td>
                    <td className="px-4 py-2 text-right">{max.toFixed(4)}</td>
                    <td className="px-4 py-2 text-right">{count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const CorrelationMatrix = ({ data, selectedVariables, variables }) => {
    if (!data || data.length === 0 || selectedVariables.length < 2) {
      return <p className="text-center text-gray-500 dark:text-gray-400">Select at least two variables to display correlations.</p>;
    }

    const cleanedData = data.filter(entry => entry.wdatetime);

    return (
      <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded shadow transition-colors duration-300">
        <h3 className="text-lg font-semibold mb-2">Correlation Matrix</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2"></th>
                {selectedVariables.map(variable => {
                  const variableLabel = variables.find(v => v.value === variable)?.label || variable;
                  return (
                    <th key={variable} className="px-4 py-2 text-right">
                      {variableLabel}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {selectedVariables.map(var1 => {
                const var1Label = variables.find(v => v.value === var1)?.label || var1;

                return (
                  <tr key={var1}>
                    <td className="px-4 py-2 font-medium">{var1Label}</td>
                    {selectedVariables.map(var2 => {
                      const correlation = var1 === var2 ? 1 : calculateCorrelation(cleanedData, var1, var2);

                      let colorClass = '';
                      const absCorr = Math.abs(correlation);
                      if (absCorr > 0.7) {
                        colorClass = correlation > 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900';
                      } else if (absCorr > 0.4) {
                        colorClass = correlation > 0 ? 'bg-green-50 dark:bg-green-800' : 'bg-red-50 dark:bg-red-800';
                      }

                      return (
                        <td key={`${var1}-${var2}`} className={`px-4 py-2 text-right ${colorClass}`}>
                          {correlation.toFixed(3)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
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

  // Function to trigger confetti
  const triggerConfetti = () => {
    setConfettiActive(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Conditionally render Confetti */}
      {confettiActive && (
        <Confetti
          width={confettiDimensions.width}
          height={confettiDimensions.height}
          recycle={false}
          numberOfPieces={500}
          onConfettiComplete={() => setConfettiActive(false)}
        />
      )}

      {/* Header */}
      <header className="bg-black text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="mr-4 hover:text-gray-300">
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div className="flex items-center cursor-pointer" onClick={triggerConfetti}>
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
          {/* Collection Selector */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Select Collection</h2>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600 dark:focus:border-indigo-600 transition-colors duration-300"
              aria-label="Select Collection"
            >
              <option value="apex_2006_2023">Apex 2006-2023</option>
              <option value="glt_2017_2022">GLT 2017-2022</option>
            </select>
          </div>

          {/* Variables Selection */}
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

          {/* Statistical Analysis Controls */}
          {selectedVariables.length > 0 && data && data.getWeatherData && data.getWeatherData.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Statistical Analysis</h3>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => setShowStatistics(!showStatistics)}
                  className={`px-4 py-2 rounded transition-colors duration-300 ${
                    showStatistics
                      ? 'bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                      : 'bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'
                  }`}
                >
                  {showStatistics ? 'Hide Statistics' : 'Show Statistics'}
                </button>

                <button
                  onClick={() => setShowCorrelation(!showCorrelation)}
                  className={`px-4 py-2 rounded transition-colors duration-300 ${
                    showCorrelation
                      ? 'bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                      : 'bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'
                  }`}
                  disabled={selectedVariables.length < 2}
                >
                  {showCorrelation ? 'Hide Correlation' : 'Show Correlation'}
                </button>
              </div>
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
                        collection: selectedCollection, // Pass selected collection
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
                            color: isDarkMode ? '#f3f4f6' : '#1f2937',
                          },
                        },
                        title: {
                          display: true,
                          text:
                            selectedVariables.length === 1
                              ? variables.find((v) => v.value === selectedVariables[0]).label
                              : 'Selected Variables Comparison',
                          color: isDarkMode ? '#f3f4f6' : '#1f2937',
                        },
                      },
                      scales: selectedVariables.length > 1
                        ? selectedVariables.reduce((acc, variable, index) => {
                          acc[`y-axis-${index}`] = {
                            type: 'linear',
                            position: index % 2 === 0 ? 'left' : 'right',
                            grid: {
                              drawOnChartArea: index === 0,
                              color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            },
                            title: {
                              display: true,
                              text: variables.find((v) => v.value === variable).label,
                              color: isDarkMode ? '#f3f4f6' : '#1f2937',
                            },
                            ticks: {
                              color: isDarkMode ? '#f3f4f6' : '#1f2937',
                            },
                          };
                          return acc;
                        }, {})
                        : {
                          y: {
                            title: {
                              display: true,
                              text: variables.find((v) => v.value === selectedVariables[0]).label,
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
                              color: isDarkMode ? '#f3f4f6' : '#1f2937',
                            },
                          },
                          title: {
                            display: true,
                            text: 'Moving Average Lines',
                            color: isDarkMode ? '#f3f4f6' : '#1f2937',
                          },
                        },
                        scales: selectedVariables.length > 1
                          ? selectedVariables.reduce((acc, variable, index) => {
                            acc[`y-axis-${index}`] = {
                              type: 'linear',
                              position: index % 2 === 0 ? 'left' : 'right',
                              grid: {
                                drawOnChartArea: index === 0,
                                color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                              },
                              title: {
                                display: true,
                                text: variables.find((v) => v.value === variable).label,
                                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                              },
                              ticks: {
                                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                              },
                            };
                            return acc;
                          }, {})
                          : {
                            y: {
                              title: {
                                display: true,
                                text: variables.find((v) => v.value === selectedVariables[0]).label,
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
                          },
                      }}
                    />
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400">No data available for the selected date range.</p>
                  )}
                </div>
              )}

              {/* Statistics Display */}
              {showStatistics && data && data.getWeatherData && (
                <StatisticsDisplay
                  data={data.getWeatherData}
                  selectedVariables={selectedVariables}
                  variables={variables}
                />
              )}

              {/* Correlation Matrix */}
              {showCorrelation && data && data.getWeatherData && (
                <CorrelationMatrix
                  data={data.getWeatherData}
                  selectedVariables={selectedVariables}
                  variables={variables}
                />
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

export default VariableView;
