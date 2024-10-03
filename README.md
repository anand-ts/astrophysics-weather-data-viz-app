# MongoDB data pipeline

## This is W.I.P

## Create Conda environment for the MongoDB Data Pipeline

```
conda create --name data_stream python=3.10
conda activate data_stream
```

## Install the required packages

``` 
conda install -c anaconda pymongo requests -c conda-forge matplotlib -y
pip install schedule
```

## Install the required dependencies for the backend
```
npm install express apollo-server-express mongoose graphql node-cron
npm install --save-dev nodemon
```

## Install the required dependencies for the frontend

```
cd client
npm install @apollo/client graphql tailwindcss chart.js
```

## Start the mongodb service

```
brew services start mongodb-community@6.0
```

## Check if it's running

```
brew services list 
```

check if the data has been imported using mongo shell:
    mongosh
    use data_stream (this is the database name)
    show collections
    db.weather_data.find().pretty() (shows a bit of the document)

backend: npm start
frontend: npm start