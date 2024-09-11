import matplotlib.pyplot as plt


def generate_charts(data):
    # Simple example to generate a chart
    x_values = [item["date"] for item in data]
    y_values = [item["value"] for item in data]  # Replace 'value' as per your data structure

    plt.plot(x_values, y_values)
    plt.xlabel("Date")
    plt.ylabel("Value")
    plt.title("API Data Over Time")
    plt.savefig("chart.png")  # Save the chart as a PNG file
    plt.show()
