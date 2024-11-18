// src/App.js
import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_WEATHER_DATA } from './queries';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ReactDOM from 'react-dom';
import { format } from 'date-fns';

// Import the logo image
import blackHoleLogo from './assets/black_hole.jpg'; // Ensure the path is correct

function App() {
  const [selectedVariables, setSelectedVariables] = useState([]);
  const [showMovingAverage, setShowMovingAverage] = useState(false);
  const [movingAverageWindow, setMovingAverageWindow] = useState(5); // State for window size
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [limit, setLimit] = useState(1000); // State for data limit

  const { loading, error, data, refetch } = useQuery(GET_WEATHER_DATA, {
    variables: {
      limit,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd HH:mm:ss') : null,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd HH:mm:ss') : null,
    },
    fetchPolicy: 'network-only', // Always fetch from server
  });

  useEffect(() => {
    refetch({
      limit,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd HH:mm:ss') : null,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd HH:mm:ss') : null,
    });
  }, [startDate, endDate, limit, refetch]);

  const handleVariableChange = (event) => {
    const { value, checked } = event.target;
    if (checked) {
      setSelectedVariables((prev) => [...prev, value]);
    } else {
      setSelectedVariables((prev) => prev.filter((item) => item !== value));
    }
    setShowMovingAverage(false); // Reset moving average when variables change
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

  const getChartData = () => {
    if (!data || !data.getWeatherData || selectedVariables.length === 0) return { labels: [], datasets: [] };

    // Filter data based on selected date range
    const filteredData = data.getWeatherData.filter((entry) => {
      const entryDate = new Date(Number(entry.wdatetime)); // Convert string to number
      if (startDate && entryDate < startDate) return false;
      if (endDate && entryDate > endDate) return false;
      return true;
    });

    // Remove entries with null or undefined wdatetime
    const cleanedData = filteredData.filter((entry) => entry.wdatetime);

    // If no data after filtering, return empty arrays
    if (cleanedData.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = cleanedData.map((entry) =>
      new Date(Number(entry.wdatetime)).toLocaleString()
    );

    const chartData = {
      labels,
      datasets: [],
    };

    selectedVariables.forEach((variable, index) => {
      const values = cleanedData.map(
        (entry) => (entry[variable] !== undefined ? entry[variable] : null)
      );

      chartData.datasets.push({
        label: variables.find((v) => v.value === variable).label,
        data: values,
        fill: false,
        backgroundColor: getColor(index),
        borderColor: getColor(index),
        borderWidth: 1,
        pointRadius: 1,
        pointHoverRadius: 8,
        tension: 0.1, // Smooth curves
        spanGaps: true, // Connect points with null values
        yAxisID: selectedVariables.length > 1 ? `y-axis-${index}` : 'y',
      });

      if (showMovingAverage && movingAverageWindow) {
        const movingAverage = calculateMovingAverage(cleanedData, movingAverageWindow)[variable];
        chartData.datasets.push({
          label: `${variables.find((v) => v.value === variable).label} (${movingAverageWindow}-point MA)`,
          data: movingAverage,
          fill: false,
          backgroundColor: 'rgba(255,0,0,0.4)', // Fixed red background
          borderColor: 'rgba(255,0,0,1)', // Fixed red border
          borderWidth: 2, // Thicker line
          pointRadius: 0, // No points for moving average
          pointHoverRadius: 0, // No hover effect
          tension: 0.1,
          spanGaps: true, // Connect points with null values
          yAxisID: selectedVariables.length > 1 ? `y-axis-${index}` : 'y',
        });
      }
    });

    return chartData;
  };

  const getColor = (index, isMovingAverage = false) => {
    const colors = [
      'rgba(75,192,192,1)',
      'rgba(255,99,132,1)',
      'rgba(54,162,235,1)',
      'rgba(255,206,86,1)',
      'rgba(153,102,255,1)',
      'rgba(255,159,64,1)',
    ];

    if (isMovingAverage) {
      // Fixed red color for moving averages
      return 'rgba(255,0,0,1)';
    }

    return colors[index % colors.length];
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

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">Error: {error.message}</p>;

  const chartData = getChartData();

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-black text-white px-4 py-2 flex items-center">
        <img src={blackHoleLogo} alt="Black Hole Logo" className="h-8 w-8 mr-2" />
        <h1 className="text-lg font-semibold">Black Hole Astrophysics Group - Georgia Tech</h1>
      </header>

      {/* Main Layout */}
      <div className="flex flex-col md:flex-row flex-1">
        {/* Sidebar */}
        <div className="md:w-1/4 lg:w-1/5 bg-gray-100 p-4 overflow-auto border-r">
          <h2 className="text-xl font-semibold mb-4">Variables</h2>
          <div className="flex flex-col space-y-2">
            {variables.map((varItem) => (
              <label key={varItem.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={varItem.value}
                  checked={selectedVariables.includes(varItem.value)}
                  onChange={handleVariableChange}
                  className="form-checkbox h-5 w-5 text-blue-600"
                  aria-label={`Toggle ${varItem.label}`}
                />
                <span className="text-gray-700">{varItem.label}</span>
              </label>
            ))}
          </div>

          {/* Moving Average Controls */}
          {selectedVariables.length > 0 && (
            <div className="mt-6 flex items-center space-x-4">
              <button
                onClick={handleMovingAverageToggle}
                className={`px-4 py-2 rounded text-left ${showMovingAverage
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
              >
                {showMovingAverage ? 'Hide Moving Average' : 'Show Moving Average'}
              </button>

              {showMovingAverage && (
                <div className="flex flex-col">
                  <input
                    type="number"
                    value={movingAverageWindow}
                    onChange={handleMovingAverageWindowChange}
                    className="mt-1 block w-24 border-gray-300 rounded-md shadow-sm"
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
            <div className="flex flex-col space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date:</label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  showTimeSelect
                  dateFormat="Pp"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm z-50"
                  placeholderText="Select start date"
                  popperPlacement="bottom-end" // Simple fix for clipping
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date:</label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  showTimeSelect
                  dateFormat="Pp"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm z-50"
                  placeholderText="Select end date"
                  popperPlacement="bottom-end" // Simple fix for clipping
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:w-3/4 lg:w-4/5 p-6 overflow-auto">
          {selectedVariables.length > 0 ? (
            chartData.datasets && chartData.datasets.length > 0 ? (
              <div className="bg-white p-4 rounded shadow h-full" style={{ height: '500px' }}>
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false, // Allows the chart to fill the container's height
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text:
                          selectedVariables.length === 1
                            ? variables.find((v) => v.value === selectedVariables[0]).label
                            : 'Selected Variables Comparison',
                      },
                    },
                    scales: selectedVariables.length > 1
                      ? selectedVariables.reduce((acc, variable, index) => {
                        acc[`y-axis-${index}`] = {
                          type: 'linear',
                          position: index % 2 === 0 ? 'left' : 'right',
                          grid: {
                            drawOnChartArea: index === 0, // Only draw grid on the first y-axis
                          },
                          title: {
                            display: true,
                            text: variables.find((v) => v.value === variable).label,
                          },
                        };
                        return acc;
                      }, {})
                      : {
                        y: {
                          title: {
                            display: true,
                            text: variables.find((v) => v.value === selectedVariables[0]).label,
                          },
                          beginAtZero: false,
                        },
                      },
                  }}
                />
              </div>
            ) : (
              <p className="text-center text-gray-500">No data available for the selected date range.</p>
            )
          ) : (
            <p className="text-center text-gray-500">Select one or more variables to display the graph.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
