// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client'; 
import './index.css';
import App from './App';
import { ApolloProvider } from '@apollo/client';
import client from './apolloClient';

// Locate the root element in your HTML
const container = document.getElementById('root');

// Create a root.
const root = ReactDOM.createRoot(container);

// Initial render: Render the App component wrapped with ApolloProvider
root.render(
  <React.StrictMode>
    <ApolloProvider client={client}>  
      <App />
    </ApolloProvider>
  </React.StrictMode>
);
