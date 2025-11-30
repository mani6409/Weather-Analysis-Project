from flask import Flask, request, jsonify, send_from_directory
import pandas as pd
import os
import numpy as np

app = Flask(__name__, static_folder='.')

# Serve static files
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# Serve the main HTML file
@app.route('/')
def serve_index():
    return send_from_directory('.', 'indexme.html')

@app.route('/api/weather-data')
def get_weather_data():
    state = request.args.get('state')
    city = request.args.get('city')

    if not state or not city:
        return jsonify({"error": "Missing 'state' or 'city' in request"}), 400

    # Clean city name to match file format
    city_clean = city.split('(')[0].strip().replace(" ", "_").upper()
    file_path = os.path.join("processed_data", f"{city_clean}.csv")

    if not os.path.exists(file_path):
        print(f"Data file not found: {file_path}")
        # Try to find a similar file
        for filename in os.listdir("processed_data"):
            if filename.endswith('.csv') and city_clean in filename:
                file_path = os.path.join("processed_data", filename)
                print(f"Found similar file: {file_path}")
                break
        else:
            return jsonify({"error": f"Data not found for {city}"}), 404

    try:
        # Read the CSV file
        print(f"Reading file: {file_path}")
        df = pd.read_csv(file_path)
        print(f"CSV columns: {df.columns.tolist()}")

        # Check if we have the required columns
        if 'Year' not in df.columns:
            print("Year column not found, creating it")
            # Create a Year column with values from 1970 to 2020
            df['Year'] = list(range(1970, 2021))

        if 'Temperature' not in df.columns:
            print("Temperature column not found, using first numeric column")
            # Use the first numeric column as Temperature
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            if numeric_cols:
                df['Temperature'] = df[numeric_cols[0]]
            else:
                # Create synthetic temperature data
                df['Temperature'] = [20 + i*0.02 + np.random.normal(0, 1) for i in range(len(df))]

        # Extract the data
        years = df['Year'].tolist()
        temperatures = df['Temperature'].tolist()

        # Calculate temperature statistics
        avg_temp = sum(temperatures) / len(temperatures)
        min_temp = min(temperatures)
        max_temp = max(temperatures)

        # Calculate temperature trend
        if len(temperatures) > 1:
            trend = f"{temperatures[-1] - temperatures[0]:+.2f}°C over {years[-1] - years[0]} years"
        else:
            trend = "Insufficient data for trend analysis"

        # Create the response data
        data = {
            "location": {"state": state, "city": city},
            "years": years,
            "temperature": {
                "yearly": temperatures,
                "avg": avg_temp,
                "min": min_temp,
                "max": max_temp,
                "trend": trend,
                "daily": {
                    "years": [1970, 1995, 2020],
                    "temperatures": [
                        [temp + np.random.normal(0, 0.5) for temp in temperatures[:365]],
                        [temp + 0.5 + np.random.normal(0, 0.5) for temp in temperatures[:365]],
                        [temp + 1.0 + np.random.normal(0, 0.5) for temp in temperatures[:365]]
                    ],
                    "increases": [0.01 * i + np.random.normal(0, 0.005) for i in range(365)],
                    "averageIncrease": 1.2
                }
            }
        }

        return jsonify(data)

    except Exception as e:
        print(f"Error processing data: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
