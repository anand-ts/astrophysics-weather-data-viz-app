import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import components
import HomeScreen from './components/HomeScreen';
import VariableView from './components/VariableView';
import TelescopeView from './components/TelescopeView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/variables" element={<VariableView />} />
        <Route path="/telescopes" element={<TelescopeView />} />
      </Routes>
    </Router>
  );
}

export default App;
