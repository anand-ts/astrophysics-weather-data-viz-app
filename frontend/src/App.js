// // src/App.js
// import React, { useState } from 'react';
// import { useQuery } from '@apollo/client';
// import { GET_WEATHER_DATA } from './queries';
// import { Line } from 'react-chartjs-2';
// import 'chart.js/auto';

// function App() {
//   const [selectedVariable, setSelectedVariable] = useState(null);
//   const { loading, error, data } = useQuery(GET_WEATHER_DATA, {
//     variables: { limit: 1000 }, // Adjust the limit as needed
//   });

//   const handleButtonClick = (variable) => {
//     setSelectedVariable(variable);
//   };

//   const getChartData = () => {
//     if (!data || !selectedVariable) return {};

//     const labels = data.getWeatherData.map(entry => new Date(entry.wdatetime).toLocaleString());
//     const values = data.getWeatherData.map(entry => entry[selectedVariable]);

//     return {
//       labels,
//       datasets: [
//         {
//           label: selectedVariable,
//           data: values,
//           fill: false,
//           backgroundColor: 'rgba(75,192,192,0.4)',
//           borderColor: 'rgba(75,192,192,1)',
//         },
//       ],
//     };
//   };

//   const variables = [
//     { label: 'Temperature (K)', value: 'temperature_k' },
//     { label: 'Dew Point (K)', value: 'dewpoint_k' },
//     { label: 'Pressure (kPa)', value: 'pressure_kpa' },
//     { label: 'Relative Humidity (%)', value: 'relhumidity_pct' },
//     { label: 'Wind Direction (°)', value: 'winddir_deg' },
//     { label: 'Wind Speed (m/s)', value: 'windspeed_mps' },
//     { label: 'PWV (mm)', value: 'pwv_mm' },
//     { label: 'Phaser MS (°)', value: 'phaserms_deg' },
//     { label: 'Tau 183 GHz', value: 'tau183ghz' },
//     { label: 'Tau 215 GHz', value: 'tau215ghz' },
//     { label: 'Tau 225 GHz', value: 'tau225ghz' },
//   ];

//   if (loading) return <p className="text-center mt-10">Loading...</p>;
//   if (error) return <p className="text-center mt-10 text-red-500">Error: {error.message}</p>;

//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-3xl font-bold text-center mb-6">Weather Data Visualization</h1>
//       <div className="flex flex-wrap justify-center mb-6">
//         {variables.map(varItem => (
//           <button
//             key={varItem.value}
//             onClick={() => handleButtonClick(varItem.value)}
//             className={`m-2 px-4 py-2 rounded ${
//               selectedVariable === varItem.value
//                 ? 'bg-blue-500 text-white'
//                 : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//             }`}
//           >
//             {varItem.label}
//           </button>
//         ))}
//       </div>
//       {selectedVariable ? (
//         <div className="bg-white p-4 rounded shadow">
//           <Line data={getChartData()} />
//         </div>
//       ) : (
//         <p className="text-center text-gray-500">Select a variable to display the graph.</p>
//       )}
//     </div>
//   );
// }

// export default App;


// // src/App.js
// import React, { useState } from 'react';
// import { useQuery } from '@apollo/client';
// import { GET_WEATHER_DATA } from './queries';
// import { Line } from 'react-chartjs-2';
// import 'chart.js/auto';
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
// import { format } from 'date-fns';

// function App() {
//   const [selectedVariable, setSelectedVariable] = useState(null);
//   const [showMovingAverage, setShowMovingAverage] = useState(false);
//   const [startDate, setStartDate] = useState(null);
//   const [endDate, setEndDate] = useState(null);

//   // Modify the query variables based on date range
//   const { loading, error, data } = useQuery(GET_WEATHER_DATA, {
//     variables: {
//       limit: 1000, // Adjust as needed
//       startDate: startDate ? format(startDate, 'yyyy-MM-dd HH:mm:ss') : null,
//       endDate: endDate ? format(endDate, 'yyyy-MM-dd HH:mm:ss') : null,
//     },
//   });

//   const handleVariableClick = (variable) => {
//     setSelectedVariable(variable);
//   };

//   const handleMovingAverageToggle = () => {
//     setShowMovingAverage(!showMovingAverage);
//   };

//   const calculateMovingAverage = (data, windowSize = 5) => {
//     if (!data || data.length === 0) return [];
//     const averages = [];
//     for (let i = 0; i < data.length; i++) {
//       if (i < windowSize - 1) {
//         averages.push(null); // Not enough data to calculate average
//         continue;
//       }
//       const window = data.slice(i - windowSize + 1, i + 1);
//       const sum = window.reduce((acc, curr) => acc + (curr[selectedVariable] || 0), 0);
//       averages.push(sum / windowSize);
//     }
//     return averages;
//   };

//   const getChartData = () => {
//     if (!data || !selectedVariable) return {};

//     // Filter data based on selected date range
//     const filteredData = data.getWeatherData.filter(entry => {
//       const entryDate = new Date(entry.wdatetime);
//       if (startDate && entryDate < startDate) return false;
//       if (endDate && entryDate > endDate) return false;
//       return true;
//     });

//     const labels = filteredData.map(entry => new Date(entry.wdatetime).toLocaleString());
//     const values = filteredData.map(entry => entry[selectedVariable]);

//     const chartData = {
//       labels,
//       datasets: [
//         {
//           label: selectedVariable,
//           data: values,
//           fill: false,
//           backgroundColor: 'rgba(75,192,192,0.4)',
//           borderColor: 'rgba(75,192,192,1)',
//         },
//       ],
//     };

//     if (showMovingAverage) {
//       const movingAverage = calculateMovingAverage(filteredData, 5); // Window size of 5
//       chartData.datasets.push({
//         label: `${selectedVariable} (Moving Avg)`,
//         data: movingAverage,
//         fill: false,
//         backgroundColor: 'rgba(255,99,132,0.4)',
//         borderColor: 'rgba(255,99,132,1)',
//       });
//     }

//     return chartData;
//   };

//   const variables = [
//     { label: 'Temperature (K)', value: 'temperature_k' },
//     { label: 'Dew Point (K)', value: 'dewpoint_k' },
//     { label: 'Pressure (kPa)', value: 'pressure_kpa' },
//     { label: 'Relative Humidity (%)', value: 'relhumidity_pct' },
//     { label: 'Wind Direction (°)', value: 'winddir_deg' },
//     { label: 'Wind Speed (m/s)', value: 'windspeed_mps' },
//     { label: 'PWV (mm)', value: 'pwv_mm' },
//     { label: 'Phaser MS (°)', value: 'phaserms_deg' },
//     { label: 'Tau 183 GHz', value: 'tau183ghz' },
//     { label: 'Tau 215 GHz', value: 'tau215ghz' },
//     { label: 'Tau 225 GHz', value: 'tau225ghz' },
//   ];

//   if (loading) return <p className="text-center mt-10">Loading...</p>;
//   if (error) return <p className="text-center mt-10 text-red-500">Error: {error.message}</p>;

//   return (
//     <div className="flex h-screen">
//       {/* Sidebar */}
//       <div className="w-1/4 bg-gray-100 p-4 overflow-auto">
//         <h2 className="text-xl font-semibold mb-4">Variables</h2>
//         <div className="flex flex-col space-y-2">
//           {variables.map(varItem => (
//             <button
//               key={varItem.value}
//               onClick={() => handleVariableClick(varItem.value)}
//               className={`px-4 py-2 rounded ${
//                 selectedVariable === varItem.value
//                   ? 'bg-blue-500 text-white'
//                   : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//               }`}
//             >
//               {varItem.label}
//             </button>
//           ))}
//         </div>

//         {/* Moving Average Toggle */}
//         {selectedVariable && (
//           <div className="mt-6">
//             <button
//               onClick={handleMovingAverageToggle}
//               className="w-full px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
//             >
//               {showMovingAverage ? 'Hide Moving Average' : 'Show Moving Average'}
//             </button>
//           </div>
//         )}

//         {/* Date Range Selector */}
//         <div className="mt-6">
//           <h3 className="text-lg font-semibold mb-2">Select Date Range</h3>
//           <div className="flex flex-col space-y-2">
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Start Date:</label>
//               <DatePicker
//                 selected={startDate}
//                 onChange={(date) => setStartDate(date)}
//                 showTimeSelect
//                 dateFormat="Pp"
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
//                 placeholderText="Select start date"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">End Date:</label>
//               <DatePicker
//                 selected={endDate}
//                 onChange={(date) => setEndDate(date)}
//                 showTimeSelect
//                 dateFormat="Pp"
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
//                 placeholderText="Select end date"
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="w-3/4 p-6 overflow-auto">
//         {selectedVariable ? (
//           <div className="bg-white p-4 rounded shadow">
//             <Line data={getChartData()} />
//           </div>
//         ) : (
//           <p className="text-center text-gray-500">Select a variable to display the graph.</p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default App;


// src/App.js
import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_WEATHER_DATA } from './queries';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

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
      limit: 100000,
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
      if (i < windowSize - 1) {
        averages.push(null); // Not enough data to calculate average
        continue;
      }
      const window = data.slice(i - windowSize + 1, i + 1);
      const sum = window.reduce((acc, curr) => acc + (curr[selectedVariable] || 0), 0);
      averages.push(sum / windowSize);
    }
    return averages;
  };

//   const getChartData = () => {
//     if (!data || !selectedVariable) return {};

//     // Filter data based on selected date range
//     const filteredData = data.getWeatherData.filter(entry => {
//       const entryDate = new Date(entry.wdatetime);
//       if (startDate && entryDate < startDate) return false;
//       if (endDate && entryDate > endDate) return false;
//       return true;
//     });

//     const labels = filteredData.map(entry => new Date(entry.wdatetime).toLocaleString());
//     const values = filteredData.map(entry => entry[selectedVariable]);

//     const chartData = {
//       labels,
//       datasets: [
//         {
//           label: selectedVariable,
//           data: values,
//           fill: false,
//           backgroundColor: 'rgba(75,192,192,0.4)',
//           borderColor: 'rgba(75,192,192,1)',
//           tension: 0.1, // Smooth curves
//         },
//       ],
//     };

//     if (showMovingAverage) {
//       const movingAverage = calculateMovingAverage(filteredData, 5); // Window size of 5
//       chartData.datasets.push({
//         label: `${selectedVariable} (5-point MA)`,
//         data: movingAverage,
//         fill: false,
//         backgroundColor: 'rgba(255,99,132,0.4)',
//         borderColor: 'rgba(255,99,132,1)',
//         tension: 0.1,
//       });
//     }

//     return chartData;
//   };

const getChartData = () => {
  if (!data || !selectedVariable) return {};

  // Filter data based on selected date range
  const filteredData = data.getWeatherData.filter(entry => {
    const entryDate = new Date(Number(entry.wdatetime)); // Convert string to number
    if (startDate && entryDate < startDate) return false;
    if (endDate && entryDate > endDate) return false;
    return true;
  });

  const labels = filteredData.map(entry => new Date(Number(entry.wdatetime)).toLocaleString());
  const values = filteredData.map(entry => entry[selectedVariable]);

  // Debugging logs
  console.log('Filtered Data:', filteredData);
  console.log('Labels:', labels);
  console.log('Values:', values);

  const chartData = {
    labels,
    datasets: [
      {
        label: selectedVariable,
        data: values,
        fill: false,
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
        tension: 0.1, // Smooth curves
      },
    ],
  };

  if (showMovingAverage) {
    const movingAverage = calculateMovingAverage(filteredData, 5); // Window size of 5
    console.log('Moving Average:', movingAverage);
    chartData.datasets.push({
      label: `${selectedVariable} (5-point MA)`,
      data: movingAverage,
      fill: false,
      backgroundColor: 'rgba(255,99,132,0.4)',
      borderColor: 'rgba(255,99,132,1)',
      tension: 0.1,
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
    <div className="flex flex-col md:flex-row h-screen">
      {/* Sidebar */}
      <div className="md:w-1/4 bg-gray-100 p-4 overflow-auto border-r">
        <h2 className="text-xl font-semibold mb-4">Variables</h2>
        <div className="flex flex-col space-y-2">
          {variables.map(varItem => (
            <button
              key={varItem.value}
              onClick={() => handleVariableClick(varItem.value)}
              className={`px-4 py-2 rounded text-left ${
                selectedVariable === varItem.value
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
              className={`w-full px-4 py-2 rounded text-left ${
                showMovingAverage
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
              />
            </div>
          </div>
        </div>
      </div>
        {/* Main Content */}
        <div className="md:w-3/4 p-6 overflow-auto">
        {selectedVariable ? (
            <div className="bg-white p-4 rounded shadow" style={{ height: '500px' }}>
            <Line data={getChartData()} options={{
                responsive: true,
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
                },
                y: {
                    title: {
                    display: true,
                    text: selectedVariable.replace('_', ' ').toUpperCase(),
                    },
                },
                },
            }} />
            </div>
        ) : (
            <p className="text-center text-gray-500">Select a variable to display the graph.</p>
        )}
        </div>

    </div>
  );
}

export default App;
