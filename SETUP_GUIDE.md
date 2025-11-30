# Weather Analysis Project Setup Guide

This guide will help you set up and run the Weather Analysis Project with your data.

## Prerequisites

- Python 3.7 or higher
- pip (Python package installer)
- Your weather data CSV files in the "processed data" folder

## Setup Steps

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Prepare Your Data

1. Make sure your "processed data" folder is in the same directory as the app.py file
2. Ensure your CSV files are named according to the city names or update the CITY_NAME_MAPPING in app.py
3. Check that your CSV files have the expected columns (Year, temperature, rainfall, etc.)

### 3. Run the Flask Backend

```bash
python app.py
```

This will start the Flask server on http://localhost:5000. The server will:
- Check if your data folder exists
- List any cities that might be missing data files
- Start serving your data to the frontend

### 4. Open the Web Application

Open your web browser and navigate to:

```
http://localhost:5000
```

This will load the application directly from the Flask server.

## Troubleshooting

### Missing Data Files

If you see warnings about missing city data files, you have two options:

1. Add the missing CSV files to your "processed data" folder
2. Update the CITY_NAME_MAPPING dictionary in app.py to map the frontend city names to your actual file names

### CSV Format Issues

If you encounter errors related to CSV parsing:

1. Check the structure of your CSV files
2. Update the data processing logic in the `process_csv_data` function in app.py to match your CSV structure

### CORS Issues

If you see CORS errors in the browser console:

1. Make sure Flask-CORS is installed: `pip install flask-cors`
2. Verify that CORS is enabled in app.py with `CORS(app)`

## Customizing the Application

### Adjusting Data Processing

If your CSV files have a different structure than expected:

1. Open app.py
2. Locate the `process_csv_data` function
3. Modify the column name detection and data extraction logic to match your CSV structure

### Adding More Cities

If you want to add more cities to the frontend:

1. Update the stateCityData object in my_weather_project.js
2. Add the corresponding CSV files to your "processed data" folder
3. Update the CITY_NAME_MAPPING in app.py if needed

## Data Format Requirements

For optimal visualization, your CSV files should ideally contain:

- A "Year" column with years from 1970 to 2020
- Temperature data (yearly or monthly)
- Rainfall/precipitation data
- Extreme weather events data (if available)

If some of this data is missing, the application will generate synthetic data to fill the gaps.
