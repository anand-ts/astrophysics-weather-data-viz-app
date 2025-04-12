# Use a newer Python image to address vulnerabilities
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Create requirements.txt if it doesn't exist
RUN touch requirements.txt

# Install dependencies if requirements.txt has content
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt || true

# Copy the rest of the application
COPY . .

# Expose any ports your app needs
EXPOSE 8000

# Make the entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# Use JSON format for CMD as recommended
CMD ["./entrypoint.sh"]
