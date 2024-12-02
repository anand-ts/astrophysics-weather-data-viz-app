// server.js
const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/data_stream', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Mongoose Schema (shared by both collections)
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

// Define Models for Each Collection
const WeatherApex = mongoose.model('WeatherApex', weatherSchema, 'apex_2006_2023');
const WeatherGlt = mongoose.model('WeatherGlt', weatherSchema, 'glt_2017_2022');

// GraphQL Type Definitions
const typeDefs = gql`
  enum CollectionName {
    apex_2006_2023
    glt_2017_2022
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

        let WeatherModel;
        switch (collection) {
          case 'apex_2006_2023':
            WeatherModel = WeatherApex;
            break;
          case 'glt_2017_2022':
            WeatherModel = WeatherGlt;
            break;
          default:
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
          .limit(limit)
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
        let WeatherModel;
        switch (collection) {
          case 'apex_2006_2023':
            WeatherModel = WeatherApex;
            break;
          case 'glt_2017_2022':
            WeatherModel = WeatherGlt;
            break;
          default:
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
server.start().then(res => {
  server.applyMiddleware({ app });

  // Start the Server
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server ready at http://localhost:${PORT}${server.graphqlPath}`);
  });
});
