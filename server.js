const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const mongoose = require('mongoose');
const cron = require('node-cron');

// Initialize express app
const app = express();

// Sample typeDefs and resolvers for Apollo Server
const typeDefs = gql`
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello, world!',
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
server.applyMiddleware({ app });

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/mydb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => console.log(err));

// Set up a cron job to fetch data (e.g., daily)
cron.schedule('0 0 * * *', () => {
  console.log('Fetching data from API...');
  // Add your data fetching logic here
});

app.listen(4000, () => {
  console.log(`Server running on http://localhost:4000${server.graphqlPath}`);
});
