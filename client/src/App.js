import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { Line } from 'react-chartjs-2';

const GET_HELLO = gql`
  query GetHello {
    hello
  }
`;

const App = () => {
  const { loading, error, data } = useQuery(GET_HELLO);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  // Example data for Chart.js (you'll replace this with your API data)
  const chartData = {
    labels: ['January', 'February', 'March', 'April'],
    datasets: [
      {
        label: 'Sample Data',
        data: [12, 19, 3, 5],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
    ],
  };

  return (
    <div className="App">
      <h1 className="text-3xl font-bold underline">{data.hello}</h1>
      <Line data={chartData} />
    </div>
  );
};

export default App;
