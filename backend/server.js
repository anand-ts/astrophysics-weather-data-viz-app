// server.js
const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const mongoose = require('mongoose');
const cors = require('cors'); // Add CORS support

// Connect to MongoDB
mongoose.connect('mongodb://mongodb:27017/data_stream', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Mongoose Schema (shared by all collections)
const weatherSchema = new mongoose.Schema({
  wdatetime: String, // Kept as String
  temperature_k: Number,
  dewpoint_k: Number,
  pressure_kpa: Number,
  relhumidity_pct: Number,
  winddir_deg: Number,
  windspeed_mps: Number,
  pwv_mm: Number,
  phaserms_deg: Number,
  tau183ghz: Number,
  tau215ghz: Number,
  tau225ghz: Number,
}, { collection: 'apex_2006_2023' });

// Define Models for Each Collection (only creating models for the ones we have data for)
const WeatherApex = mongoose.model('WeatherApex', weatherSchema, 'apex_2006_2023');
const WeatherGlt = mongoose.model('WeatherGlt', weatherSchema, 'glt_2017_2022');

// Add placeholder models for other telescopes (these would be replaced with real data when available)
const weatherModelMap = {
  'apex_2006_2023': WeatherApex,
  'glt_2017_2022': WeatherGlt,
  // When real data becomes available, replace these lines:
  'jcmt_data': WeatherApex, // Using Apex as placeholder
  'sma_data': WeatherApex,  // Using Apex as placeholder
  'smt_data': WeatherApex,  // Using Apex as placeholder
  'lmt_data': WeatherApex,  // Using Apex as placeholder
  'alma_data': WeatherApex,  // Using Apex as placeholder
};

// GraphQL Type Definitions
const typeDefs = gql`
  enum CollectionName {
    apex_2006_2023
    glt_2017_2022
    jcmt_data
    sma_data
    smt_data
    lmt_data
    alma_data
  }

  type Weather {
    wdatetime: String
    temperature_k: Float
    dewpoint_k: Float
    pressure_kpa: Float
    relhumidity_pct: Float
    winddir_deg: Float
    windspeed_mps: Float
    pwv_mm: Float
    phaserms_deg: Float
    tau183ghz: Float
    tau215ghz: Float
    tau225ghz: Float
  }

  type Query {
    getWeatherData(collection: CollectionName!, limit: Int, startDate: String, endDate: String): [Weather]
    getWeatherByDate(collection: CollectionName!, wdatetime: String!): Weather
  }
`;

// GraphQL Resolvers
const resolvers = {
  Query: {
    getWeatherData: async (_, { collection, limit, startDate, endDate }) => {
      try {
        console.log('Received collection:', collection);
        console.log('Received startDate:', startDate);
        console.log('Received endDate:', endDate);

        const WeatherModel = weatherModelMap[collection];
        if (!WeatherModel) {
          throw new Error('Invalid collection name');
        }

        const filter = {};
        if (startDate) {
          filter.wdatetime = { $gte: startDate };
        }
        if (endDate) {
          filter.wdatetime = filter.wdatetime || {};
          filter.wdatetime.$lte = endDate;
        }

        // Optional: Sort in ascending order based on wdatetime
        const data = await WeatherModel.find(filter)
          .limit(limit || 1000) // Default limit of 1000 if none provided
          .sort({ wdatetime: 1 });

        console.log(`Fetched ${data.length} records from the ${collection} collection.`);

        // Return data as is since wdatetime is a string
        return data.map(entry => ({
          ...entry.toObject(),
          wdatetime: entry.wdatetime.toString(),
        }));
      } catch (err) {
        console.error('Error in getWeatherData resolver:', err);
        return [];
      }
    },
    getWeatherByDate: async (_, { collection, wdatetime }) => {
      try {
        const WeatherModel = weatherModelMap[collection];
        if (!WeatherModel) {
          throw new Error('Invalid collection name');
        }

        const data = await WeatherModel.findOne({ wdatetime });
        if (data) {
          return {
            ...data.toObject(),
            wdatetime: data.wdatetime.toString(),
          };
        }
        return null;
      } catch (err) {
        console.error('Error in getWeatherByDate resolver:', err);
        return null;
      }
    },
  },
};

// Initialize Apollo Server
const server = new ApolloServer({ typeDefs, resolvers });

// Apply Middleware to Express App
const app = express();

// Enable CORS for all routes
app.use(cors());

server.start().then(res => {
  server.applyMiddleware({ app });

  // Start the Server
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server ready at http://localhost:${PORT}${server.graphqlPath}`);
  });
});
