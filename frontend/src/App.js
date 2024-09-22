// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;


// src/App.js
import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_WEATHER_DATA } from './queries';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

function App() {
  const [selectedVariable, setSelectedVariable] = useState(null);
  const { loading, error, data } = useQuery(GET_WEATHER_DATA, {
    variables: { limit: 1000 }, // Adjust the limit as needed
  });

  const handleButtonClick = (variable) => {
    setSelectedVariable(variable);
  };

  const getChartData = () => {
    if (!data || !selectedVariable) return {};

    const labels = data.getWeatherData.map(entry => new Date(entry.wdatetime).toLocaleString());
    const values = data.getWeatherData.map(entry => entry[selectedVariable]);

    return {
      labels,
      datasets: [
        {
          label: selectedVariable,
          data: values,
          fill: false,
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
        },
      ],
    };
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
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Weather Data Visualization</h1>
      <div className="flex flex-wrap justify-center mb-6">
        {variables.map(varItem => (
          <button
            key={varItem.value}
            onClick={() => handleButtonClick(varItem.value)}
            className={`m-2 px-4 py-2 rounded ${
              selectedVariable === varItem.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {varItem.label}
          </button>
        ))}
      </div>
      {selectedVariable ? (
        <div className="bg-white p-4 rounded shadow">
          <Line data={getChartData()} />
        </div>
      ) : (
        <p className="text-center text-gray-500">Select a variable to display the graph.</p>
      )}
    </div>
  );
}

export default App;
