FROM python:3.11-slim

# Set working directory in container
WORKDIR /app

# Set environment variables
# 1. Prevents Python from writing pyc files to disc
ENV PYTHONDONTWRITEBYTECODE=1
# 2. Prevents Python from buffering stdout and stderr (helps with real-time logging)
ENV PYTHONUNBUFFERED=1

# Copy requirements first to leverage Docker caching
COPY requirements.txt /app/

# Install python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend application code
COPY . /app/

# Expose port 8000 for FastAPI
EXPOSE 8000

# Run the FastAPI application using uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
