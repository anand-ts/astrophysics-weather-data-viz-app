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

// Define Mongoose Schema and Model
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

const Weather = mongoose.model('Weather', weatherSchema);

// GraphQL Type Definitions
const typeDefs = gql`
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
    getWeatherData(limit: Int, startDate: String, endDate: String): [Weather]
    getWeatherByDate(wdatetime: String!): Weather
  }
`;

// GraphQL Resolvers
const resolvers = {
  Query: {
    getWeatherData: async (_, { limit, startDate, endDate }) => {
      try {
        console.log('Received startDate:', startDate);
        console.log('Received endDate:', endDate);

        const filter = {};
        if (startDate) {
          filter.wdatetime = { $gte: startDate };
        }
        if (endDate) {
          filter.wdatetime = filter.wdatetime || {};
          filter.wdatetime.$lte = endDate;
        }

        // Optional: Sort in ascending order based on wdatetime
        const data = await Weather.find(filter)
          .limit(limit)
          .sort({ wdatetime: 1 });

        console.log(`Fetched ${data.length} records from the database.`);

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
    getWeatherByDate: async (_, { wdatetime }) => {
      try {
        const data = await Weather.findOne({ wdatetime });
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
