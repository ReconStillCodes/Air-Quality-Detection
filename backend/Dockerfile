FROM python:3.10-slim

# Set the working directory
WORKDIR /app

# Install build tools needed for packages like eventlet/gevent
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc g++ && \
    rm -rf /var/lib/apt/lists/*

    # Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Clean up build tools to minimize image size
RUN apt-get purge -y --auto-remove gcc g++

# Copy the rest of the application code
COPY . .

# Expose the port Flask/Gunicorn will run on (internal to the Docker network)
EXPOSE 5000

# Command to run the application using Gunicorn with eventlet workers
CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "-b", "0.0.0.0:5000", "aiq-backend:app"]

