import requests


def fetch_data_from_api():
    url = "https://api.example.com/data"  # Replace with your API URL
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()  # Assuming the API returns JSON data
    else:
        print("Failed to fetch data")
        return None
