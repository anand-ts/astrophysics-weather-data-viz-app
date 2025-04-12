#!/bin/bash

echo "===========================================" 
echo "  Weather Data Visualization Application"
echo "===========================================" 
echo ""
echo "To start the application, please run:"
echo ""
echo "  docker-compose up"
echo ""
echo "Frontend will be available at: http://localhost:3000"
echo "Backend will be available at: http://localhost:4000/graphql"
echo ""
echo "NOTE: Make sure Docker Compose is installed on your system."
echo "===========================================" 

# Create package.json files if they don't exist to avoid errors
if [ ! -f "backend/package.json" ]; then
    mkdir -p backend
    echo '{
  "name": "data-stream-backend",
  "version": "1.0.0",
  "description": "Backend for the Weather Data Visualization app",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.17.1",
    "apollo-server-express": "^3.3.0",
    "mongoose": "^6.0.5",
    "cors": "^2.8.5"
  }
}' > backend/package.json
fi

if [ ! -f "frontend/package.json" ]; then
    mkdir -p frontend
    echo '{
  "name": "data-stream-frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@apollo/client": "^3.3.21",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "chart.js": "^3.5.1",
    "react-chartjs-2": "^3.0.5",
    "graphql": "^15.5.1",
    "tailwindcss": "^3.0.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  }
}' > frontend/package.json
fi

# Keep the container running so users can inspect it
echo "Keeping container alive for inspection..."
sleep infinity
