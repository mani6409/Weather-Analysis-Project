# Weather Analysis Project

A web-based application for visualizing 50 years of weather data across various states and cities in India. This application provides interactive charts, including a dynamic 3D visualization of temperature trends.

## Features

- Interactive UI with state and city selection
- **NEW: 3D temperature visualization** showing seasonal patterns and long-term trends
- Traditional charts for temperature, rainfall, and extreme weather events
- Data summary with key statistics and insights
- Project information modal with detailed explanations
- Responsive design for desktop and mobile

## Project Structure

- `indexme.html` - Main HTML file
- `my_project.css` - CSS styles
- `my_weather_project.js` - Main JavaScript file
- `charts.js` - Chart rendering and data visualization
- `app.py` - Flask backend for serving data from CSV files
- `check_data.py` - Script to check data files
- `run_app.py` - Launcher script for the application

## Quick Start

The easiest way to run the application is to use the launcher script:

```bash
python run_app.py
```

This will:
1. Check if all required dependencies are installed
2. Verify that your data folder exists and contains CSV files
3. Run a data check to identify any missing city data
4. Start the Flask server
5. Open the application in your web browser

## Manual Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Check Your Data

```bash
python check_data.py
```

This will check if all cities have corresponding data files and analyze the structure of your CSV files.

### 3. Start the Flask Server

```bash
python app.py
```

### 4. Open the Application

Open your web browser and navigate to:

```
http://localhost:5000
```

## Data Requirements

The application expects your weather data to be in CSV files in the "processed data" folder. Each city should have its own CSV file with the following structure:

- A "Year" column with years from 1970 to 2020
- Temperature data (yearly or monthly)
- Rainfall/precipitation data
- Extreme weather events data (if available)

If some of this data is missing, the application will generate synthetic data to fill the gaps.

## Customization

### City Name Mapping

If your CSV files have different names than the cities in the frontend, you can update the `CITY_NAME_MAPPING` dictionary in `app.py`.

### CSV Structure

If your CSV files have a different structure than expected, you can modify the data processing logic in the `process_csv_data` function in `app.py`.

## Troubleshooting

See the [SETUP_GUIDE.md](SETUP_GUIDE.md) file for detailed troubleshooting instructions.

## Browser Compatibility

This application works in all modern browsers:
- Chrome
- Firefox
- Safari
- Edge

## Credits

- Weather data sourced from the Indian Meteorological Department
- Charts created using Chart.js and Plotly.js
- Icons from Font Awesome
- 3D visualization powered by Plotly.js
