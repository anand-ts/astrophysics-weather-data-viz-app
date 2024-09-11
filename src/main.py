import schedule
import time
from api_data_fetch import fetch_data_from_api
from mongodb_interaction import store_data_in_mongodb
from generate_reports import generate_charts
from send_email import send_email


def daily_task():
    print("Running daily task")
    data = fetch_data_from_api()
    if data:
        store_data_in_mongodb(data)
        generate_charts(data)


def weekly_task():
    print("Running weekly task")
    send_email("Weekly Report", "Everything is working fine!")


# Schedule tasks
schedule.every().day.at("10:00").do(daily_task)  # Run daily at 10 AM
schedule.every().monday.at("10:00").do(weekly_task)  # Run every Monday at 10 AM

while True:
    schedule.run_pending()
    time.sleep(1)
