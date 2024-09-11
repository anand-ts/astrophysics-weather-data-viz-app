from pymongo import MongoClient


def connect_to_mongodb():
    client = MongoClient("mongodb://localhost:27017/")
    db = client["mydatabase"]  # Replace with your DB name
    return db


def store_data_in_mongodb(data):
    db = connect_to_mongodb()
    collection = db["mycollection"]  # Replace with your collection name
    collection.insert_many(data)
    print("Data inserted into MongoDB")
