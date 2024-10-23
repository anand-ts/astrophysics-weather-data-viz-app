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
  wdatetime: Date,
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
}, { collection: 'weather_data' });

const Weather = mongoose.model('Weather', weatherSchema);

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

const resolvers = {
  Query: {
    getWeatherData: async (_, { limit, startDate, endDate }) => {
      try {
        const filter = {};
        if (startDate) {
          filter.wdatetime = { $gte: new Date(startDate) };
        }
        if (endDate) {
          filter.wdatetime = filter.wdatetime || {};
          filter.wdatetime.$lte = new Date(endDate);
        }
        const data = await Weather.find(filter)
          .limit(limit)
          .sort({ wdatetime: 1 });
        return data;
      } catch (err) {
        console.error(err);
        return [];
      }
    },
    getWeatherByDate: async (_, { wdatetime }) => {
      try {
        const date = new Date(wdatetime);
        const data = await Weather.findOne({ wdatetime: date });
        return data;
      } catch (err) {
        console.error(err);
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

