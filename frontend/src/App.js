// src/App.js
import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_WEATHER_DATA } from './queries';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

// Import the logo image
import blackHoleLogo from './assets/black_hole.jpg'; // Ensure the path is correct

function App() {
  const [selectedVariable, setSelectedVariable] = useState(null);
  const [showMovingAverage, setShowMovingAverage] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const { loading, error, data, refetch } = useQuery(GET_WEATHER_DATA, {
    variables: {
      limit: 100000, // Adjust as needed
      startDate: startDate ? format(startDate, 'yyyy-MM-dd HH:mm:ss') : null,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd HH:mm:ss') : null,
    },
    fetchPolicy: 'network-only', // Always fetch from server
  });

  useEffect(() => {
    refetch({
      limit: 10000,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd HH:mm:ss') : null,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd HH:mm:ss') : null,
    });
  }, [startDate, endDate, refetch]);

  const handleVariableClick = (variable) => {
    setSelectedVariable(variable);
    setShowMovingAverage(false); // Reset moving average when selecting a new variable
  };

  const handleMovingAverageToggle = () => {
    setShowMovingAverage(!showMovingAverage);
  };

  const calculateMovingAverage = (data, windowSize = 5) => {
    if (!data || data.length === 0) return [];

    const averages = [];

    for (let i = 0; i < data.length; i++) {
      // Define the window slice
      const window = data.slice(i - windowSize + 1, i + 1);

      // Filter out 0 and undefined/null values
      const validValues = window.filter(value => value !== 0 && value !== undefined && value !== null);

      if (validValues.length === 0) {
        averages.push(null); // Not enough valid data to calculate average
        continue;
      }

      // Calculate the average of valid values
      const sum = validValues.reduce((acc, curr) => acc + curr, 0);
      const avg = sum / validValues.length;

      averages.push(avg);
    }

    return averages;
  };

  const getChartData = () => {
    if (!data || !selectedVariable) return {};

    // Filter data based on selected date range
    const filteredData = data.getWeatherData.filter(entry => {
      const entryDate = new Date(Number(entry.wdatetime)); // Convert string to number
      if (startDate && entryDate < startDate) return false;
      if (endDate && entryDate > endDate) return false;
      return true;
    });

    // Remove entries with null or undefined wdatetime
    const cleanedData = filteredData.filter(entry => entry.wdatetime);

    const labels = cleanedData.map(entry => new Date(Number(entry.wdatetime)).toLocaleString());
    const values = cleanedData.map(entry => entry[selectedVariable] !== undefined ? entry[selectedVariable] : 0);

    // Debugging logs
    console.log('Filtered Data:', cleanedData);
    console.log('Labels:', labels);
    console.log('Values:', values);

    const chartData = {
      labels,
      datasets: [
        {
          label: selectedVariable.replace('_', ' ').toUpperCase(),
          data: values,
          fill: false,
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
          tension: 0.1, // Smooth curves
          spanGaps: true, // Connect points with null values
        },
      ],
    };

    if (showMovingAverage) {
      const movingAverage = calculateMovingAverage(values, 5); // Window size of 5
      console.log('Moving Average:', movingAverage);
      chartData.datasets.push({
        label: `${selectedVariable.replace('_', ' ').toUpperCase()} (5-point MA)`,
        data: movingAverage,
        fill: false,
        backgroundColor: 'rgba(255,99,132,0.4)',
        borderColor: 'rgba(255,99,132,1)',
        tension: 0.1,
        spanGaps: true, // Connect points with null values
      });
    }

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

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">Error: {error.message}</p>;

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
        <div className="md:w-1/4 bg-gray-100 p-4 overflow-auto border-r">
          <h2 className="text-xl font-semibold mb-4">Variables</h2>
          <div className="flex flex-col space-y-2">
            {variables.map(varItem => (
              <button
                key={varItem.value}
                onClick={() => handleVariableClick(varItem.value)}
                className={`px-4 py-2 rounded text-left ${selectedVariable === varItem.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                {varItem.label}
              </button>
            ))}
          </div>

          {/* Moving Average Toggle */}
          {selectedVariable && (
            <div className="mt-6">
              <button
                onClick={handleMovingAverageToggle}
                className={`w-full px-4 py-2 rounded text-left ${showMovingAverage
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
              >
                {showMovingAverage ? 'Hide Moving Average' : 'Show Moving Average'}
              </button>
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
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  placeholderText="Select start date"
                  popperPlacement="bottom-end" // Added this line
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
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  placeholderText="Select end date"
                  popperPlacement="bottom-end" // Added this line
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:w-3/4 p-6 overflow-auto">
          {selectedVariable ? (
            <div className="bg-white p-4 rounded shadow h-full" style={{ height: '500px' }}>
              <Line
                data={getChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false, // Allows the chart to fill the container's height
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: selectedVariable.replace('_', ' ').toUpperCase(),
                    },
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: 'Date and Time',
                      },
                      ticks: {
                        maxTicksLimit: 20, // Limit the number of ticks for better readability
                      },
                    },
                    y: {
                      title: {
                        display: true,
                        text: selectedVariable.replace('_', ' ').toUpperCase(),
                      },
                      beginAtZero: false,
                      // Optionally, set min and max based on data
                      // min: 250,
                      // max: 300,
                    },
                  },
                }}
              />
            </div>
          ) : (
            <p className="text-center text-gray-500">Select a variable to display the graph.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
