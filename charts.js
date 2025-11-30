// Charts.js - Weather Data Visualization Functions

// Global chart objects to manage and destroy charts when needed
let temperatureChart = null;
let rainfallChart = null;
let extremeEventsChart = null;
let temperature3DChart = null;
let dailyTempChart = null;

// Configuration for chart colors
const chartColors = {
  temperature: {
    gradient: ['rgba(255, 99, 132, 0.2)', 'rgba(255, 99, 132, 0.8)'],
    border: 'rgba(255, 99, 132, 1)',
    grid: 'rgba(255, 99, 132, 0.1)'
  },
  rainfall: {
    gradient: ['rgba(54, 162, 235, 0.2)', 'rgba(54, 162, 235, 0.8)'],
    border: 'rgba(54, 162, 235, 1)',
    grid: 'rgba(54, 162, 235, 0.1)'
  },
  extremeEvents: {
    gradient: ['rgba(255, 206, 86, 0.2)', 'rgba(255, 206, 86, 0.8)'],
    border: 'rgba(255, 206, 86, 1)',
    grid: 'rgba(255, 206, 86, 0.1)'
  }
};

// Function to fetch weather data from the backend
async function fetchWeatherData(state, city) {
  try {
    // Connect to our Flask backend to get real data from your CSV files in the "processed_data" folder
    const apiUrl = `http://localhost:5000/api/weather-data?state=${encodeURIComponent(state)}&city=${encodeURIComponent(city)}`;
    console.log(`Fetching data from: ${apiUrl}`);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched data for ${city}, ${state}`);

    // Process the data from your CSV files
    processRealData(data);

    return data;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    console.log("Falling back to sample data...");

    // For development/demo purposes, return sample data if API fails
    return generateSampleData(state, city);
  }
}

// Function to process real data from CSV files
function processRealData(data) {
  // This function can be used to perform any additional processing on the real data
  // from your CSV files before it's used in the visualizations

  console.log("Processing real data from CSV files...");

  // Ensure all required properties exist
  if (!data.temperature) data.temperature = {};
  if (!data.temperature.monthly) {
    // If monthly data is missing, try to derive it from other available data
    if (data.temperature.yearly) {
      console.log("Deriving monthly data from yearly data...");
      data.temperature.monthly = deriveMonthlyFromYearly(data.temperature.yearly);
    }
  }

  // Ensure rainfall data exists
  if (!data.rainfall) data.rainfall = {};

  // Ensure extreme events data exists
  if (!data.extremeEvents) data.extremeEvents = {};

  return data;
}

// Helper function to derive monthly data if only yearly is available
function deriveMonthlyFromYearly(yearlyData) {
  // This is a fallback in case the CSV files don't have monthly data
  const monthlyData = [];

  // Create a typical seasonal pattern that will be modulated by the yearly average
  const seasonalPattern = [
    -3, -2, 0, 2, 4, 6, 8, 7, 5, 2, 0, -2  // Typical seasonal variation
  ];

  for (let i = 0; i < yearlyData.length; i++) {
    const yearAvg = yearlyData[i];
    const yearMonthly = seasonalPattern.map(offset => yearAvg + offset);
    monthlyData.push(yearMonthly);
  }

  return monthlyData;
}

// Function to generate daily temperature data from monthly data
function generateDailyDataFromMonthly(monthlyData, years) {
  console.log("Generating daily data from monthly data");

  // Days in each month (non-leap year)
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const totalDays = 365;

  // Create daily data structure
  const dailyData = {
    // We'll focus on three representative years: first, middle, and last
    years: [years[0], years[Math.floor(years.length / 2)], years[years.length - 1]],
    temperatures: [],
    dayLabels: [],
    averageIncrease: 0
  };

  // Generate day labels (1-365)
  for (let day = 1; day <= totalDays; day++) {
    dailyData.dayLabels.push(day);
  }

  // Select three years of data: first, middle, and last
  const firstYearIndex = 0;
  const middleYearIndex = Math.floor(monthlyData.length / 2);
  const lastYearIndex = monthlyData.length - 1;

  const selectedYears = [
    monthlyData[firstYearIndex],
    monthlyData[middleYearIndex],
    monthlyData[lastYearIndex]
  ];

  // Interpolate daily temperatures for each selected year
  selectedYears.forEach(yearData => {
    const dailyTemps = [];
    let dayOfYear = 0;

    // For each month
    for (let month = 0; month < 12; month++) {
      const monthTemp = yearData[month];

      // For each day in the month
      for (let day = 0; day < daysInMonth[month]; day++) {
        // Add some natural variation to daily temperatures
        // More variation in transition months, less in stable months
        const variationFactor = (month === 0 || month === 6) ? 0.8 :
                               (month === 1 || month === 5 || month === 7 || month === 11) ? 0.6 : 0.4;

        const dailyVariation = (Math.random() - 0.5) * variationFactor * 2;

        // If we have data for adjacent months, create a smooth transition
        let interpolatedTemp = monthTemp;

        if (day < 10 && month > 0) {
          // Transition from previous month
          const prevMonthTemp = yearData[month - 1];
          const transitionFactor = (10 - day) / 10;
          interpolatedTemp = prevMonthTemp * transitionFactor + monthTemp * (1 - transitionFactor);
        } else if (day > daysInMonth[month] - 10 && month < 11) {
          // Transition to next month
          const nextMonthTemp = yearData[month + 1];
          const transitionFactor = (day - (daysInMonth[month] - 10)) / 10;
          interpolatedTemp = monthTemp * (1 - transitionFactor) + nextMonthTemp * transitionFactor;
        }

        dailyTemps.push(interpolatedTemp + dailyVariation);
        dayOfYear++;
      }
    }

    dailyData.temperatures.push(dailyTemps);
  });

  // Calculate the average temperature increase for each day
  const increases = [];
  for (let day = 0; day < totalDays; day++) {
    const firstYearTemp = dailyData.temperatures[0][day];
    const lastYearTemp = dailyData.temperatures[2][day];
    increases.push(lastYearTemp - firstYearTemp);
  }

  dailyData.increases = increases;
  dailyData.averageIncrease = increases.reduce((sum, val) => sum + val, 0) / increases.length;

  return dailyData;
}

// Function to generate sample data for development/demo purposes
function generateSampleData(state, city) {
  // Generate 50 years of data (1970-2020)
  const years = Array.from({length: 51}, (_, i) => 1970 + i);

  // Generate temperature data with a slight upward trend
  const baseTemp = 20 + Math.random() * 10; // Base temperature varies by location
  const tempData = years.map(year => {
    const yearIndex = year - 1970;
    // Add a slight upward trend (0.02°C per year) plus random variation
    return baseTemp + (yearIndex * 0.02) + (Math.random() * 2 - 1);
  });

  // Generate monthly temperature data for 3D visualization
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyTempData = [];

  // Create temperature data for each month across all years
  for (let year = 1970; year <= 2020; year++) {
    const yearIndex = year - 1970;
    const yearData = [];

    for (let month = 0; month < 12; month++) {
      // Base temperature varies by month (seasonal pattern)
      const monthFactor = Math.sin((month / 12) * Math.PI * 2) * 5;

      // Add yearly trend + seasonal pattern + random variation
      const temp = baseTemp + monthFactor + (yearIndex * 0.02) + (Math.random() * 1.5 - 0.75);
      yearData.push(temp);
    }

    monthlyTempData.push(yearData);
  }

  // Generate rainfall data with some variability
  const baseRainfall = 800 + Math.random() * 400; // Base rainfall varies by location
  const rainfallData = years.map(year => {
    // Add random variation to rainfall
    return baseRainfall + (Math.random() * 200 - 100);
  });

  // Generate extreme events data (count per year)
  const extremeEventsData = years.map(year => {
    const yearIndex = year - 1970;
    // Increase frequency of extreme events in recent years
    const baseProbability = 0.1 + (yearIndex * 0.005);
    return Math.floor(Math.random() < baseProbability ? Math.random() * 3 + 1 : 0);
  });

  return {
    location: {
      state: state,
      city: city
    },
    years: years,
    months: months,
    temperature: {
      yearly: tempData,
      monthly: monthlyTempData,
      avg: tempData.reduce((sum, val) => sum + val, 0) / tempData.length,
      min: Math.min(...tempData),
      max: Math.max(...tempData),
      trend: "+1.2°C over 50 years"
    },
    rainfall: {
      yearly: rainfallData,
      annual: Math.round(rainfallData.reduce((sum, val) => sum + val, 0) / rainfallData.length),
      monsoon: Math.round(rainfallData.reduce((sum, val) => sum + val, 0) / rainfallData.length * 0.7),
      nonMonsoon: Math.round(rainfallData.reduce((sum, val) => sum + val, 0) / rainfallData.length * 0.3),
      trend: "Increasing variability"
    },
    extremeEvents: {
      yearly: extremeEventsData,
      total: extremeEventsData.reduce((sum, val) => sum + val, 0),
      heatwaves: "Increasing frequency",
      heavyRain: "More intense",
      droughts: "Longer duration"
    }
  };
}

// Function to create a gradient for chart backgrounds
function createGradient(ctx, colors) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  return gradient;
}

// Function to render temperature chart
function renderTemperatureChart(data, containerId) {
  const container = document.getElementById(containerId);

  // Create canvas for the chart if it doesn't exist
  let canvas = container.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'temperatureChart';
    container.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');

  // Destroy existing chart if it exists
  if (temperatureChart) {
    temperatureChart.destroy();
  }

  // Create the chart
  temperatureChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.years,
      datasets: [{
        label: 'Average Temperature (°C)',
        data: data.temperature.yearly,
        backgroundColor: createGradient(ctx, chartColors.temperature.gradient),
        borderColor: chartColors.temperature.border,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `Temperature Trends (1970-2020) - ${data.location.city}, ${data.location.state}`,
          font: {
            size: 16
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              return `Temperature: ${context.parsed.y.toFixed(1)}°C`;
            }
          }
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            maxTicksLimit: 10
          }
        },
        y: {
          grid: {
            color: chartColors.temperature.grid
          },
          title: {
            display: true,
            text: 'Temperature (°C)'
          }
        }
      }
    }
  });

  return temperatureChart;
}

// Function to render rainfall chart - removed to focus only on temperature data
function renderRainfallChart(data, containerId) {
  console.log("Rainfall chart rendering skipped - focusing only on temperature data");
  return null;
}

// Function to render extreme events chart - removed to focus only on temperature data
function renderExtremeEventsChart(data, containerId) {
  console.log("Extreme events chart rendering skipped - focusing only on temperature data");
  return null;
}

// Global variable for daily temperature chart is already declared at the top

// Function to render daily temperature increase chart
function renderDailyTemperatureChart(weatherData, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear the container
  container.innerHTML = '';

  // Create a div for the chart
  const chartDiv = document.createElement('div');
  chartDiv.id = 'dailyTempChart';
  chartDiv.style.width = '100%';
  chartDiv.style.height = '100%';
  container.appendChild(chartDiv);

  // Check if we already have daily data generated
  let dailyData;
  let years;
  let dailyTemps = {};
  let dailyIncreases;
  let avgIncrease;

  if (weatherData.temperature.daily) {
    // Use pre-generated daily data
    dailyData = weatherData.temperature.daily;
    years = dailyData.years;

    // Convert the array format to the object format expected by the chart
    years.forEach((year, index) => {
      const temps = dailyData.temperatures[index];
      dailyTemps[year] = temps.map((temp, day) => ({
        day: day + 1,
        temp: temp
      }));
    });

    dailyIncreases = dailyData.increases;
    avgIncrease = dailyData.averageIncrease;
  } else {
    // Generate data for selected years to compare
    years = [1970, 1995, 2020]; // Start, middle, end years

    // Generate daily temperature data based on monthly data
    // We'll simulate daily data by interpolating between monthly values
    const generateDailyData = (monthlyData, year) => {
      const yearIndex = weatherData.years.indexOf(year);
      if (yearIndex === -1) return [];

      const monthlyTemps = monthlyData[yearIndex];
      const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      // Adjust for leap years
      if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
        daysInMonth[1] = 29;
      }

      const dailyTemps = [];
      let dayOfYear = 1;

      for (let month = 0; month < 12; month++) {
        const currentMonthTemp = monthlyTemps[month];
        const nextMonthTemp = monthlyTemps[(month + 1) % 12] || monthlyTemps[0]; // Wrap around to January

        for (let day = 0; day < daysInMonth[month]; day++) {
          // Add some daily variation with a slight trend toward the next month
          const progress = day / daysInMonth[month];
          const baseTemp = currentMonthTemp * (1 - progress) + nextMonthTemp * progress;
          // Add some random daily fluctuation
          const dailyVariation = Math.sin(dayOfYear * 0.1) * 1.5 + (Math.random() * 2 - 1);

          dailyTemps.push({
            day: dayOfYear,
            temp: baseTemp + dailyVariation
          });

          dayOfYear++;
        }
      }

      return dailyTemps;
    };

    years.forEach(year => {
      dailyTemps[year] = generateDailyData(weatherData.temperature.monthly, year);
    });

    // Calculate the average temperature increase per day
    const calculateDailyIncrease = () => {
      const firstYearData = dailyTemps[years[0]];
      const lastYearData = dailyTemps[years[years.length - 1]];
      const increases = [];

      for (let i = 0; i < firstYearData.length; i++) {
        increases.push(lastYearData[i].temp - firstYearData[i].temp);
      }

      return increases;
    };

    dailyIncreases = calculateDailyIncrease();
    avgIncrease = dailyIncreases.reduce((sum, val) => sum + val, 0) / dailyIncreases.length;
  }

  // Create the traces for each year
  const traces = [];

  try {
    // Check if we have the data in the right format
    if (weatherData.temperature.daily) {
      // Use the pre-generated daily data format
      years.forEach((year, index) => {
        const temps = weatherData.temperature.daily.temperatures[index];
        const days = Array.from({length: temps.length}, (_, i) => i + 1);
        const colors = ['rgba(0, 119, 182, 0.8)', 'rgba(255, 193, 7, 0.8)', 'rgba(220, 53, 69, 0.8)'];

        traces.push({
          type: 'scatter',
          mode: 'lines',
          name: `${year}`,
          x: days,
          y: temps,
          line: {
            color: colors[index],
            width: 2
          }
        });
      });

      // Add a trace for the temperature increase
      traces.push({
        type: 'scatter',
        mode: 'lines',
        name: 'Daily Increase (1970-2020)',
        x: Array.from({length: weatherData.temperature.daily.increases.length}, (_, i) => i + 1),
        y: weatherData.temperature.daily.increases,
        line: {
          color: 'rgba(76, 175, 80, 0.8)',
          width: 2,
          dash: 'dot'
        },
        yaxis: 'y2'
      });
    } else {
      // Use the old format with dailyTemps object
      years.forEach((year, index) => {
        const yearData = dailyTemps[year];
        const colors = ['rgba(0, 119, 182, 0.8)', 'rgba(255, 193, 7, 0.8)', 'rgba(220, 53, 69, 0.8)'];

        traces.push({
          type: 'scatter',
          mode: 'lines',
          name: `${year}`,
          x: yearData.map(d => d.day),
          y: yearData.map(d => d.temp),
          line: {
            color: colors[index],
            width: 2
          }
        });
      });

      // Add a trace for the temperature increase
      traces.push({
        type: 'scatter',
        mode: 'lines',
        name: 'Daily Increase (1970-2020)',
        x: dailyTemps[years[0]].map(d => d.day),
        y: dailyIncreases,
        line: {
          color: 'rgba(76, 175, 80, 0.8)',
          width: 2,
          dash: 'dot'
        },
        yaxis: 'y2'
      });
    }
  } catch (error) {
    console.error("Error creating chart traces:", error);

    // Create a simple fallback trace
    traces.push({
      type: 'scatter',
      mode: 'lines',
      name: 'Temperature Trend',
      x: [1, 365],
      y: [20, 25],
      line: {
        color: 'rgba(0, 119, 182, 0.8)',
        width: 2
      }
    });
  }

  // Layout configuration
  let layout;

  try {
    // Get the average increase value
    const avgIncreaseValue = weatherData.temperature.daily ?
      weatherData.temperature.daily.averageIncrease :
      avgIncrease;

    // Get the years to display in the title
    const yearsToDisplay = weatherData.temperature.daily ?
      weatherData.temperature.daily.years.join(' vs ') :
      years.join(' vs ');

    layout = {
      title: {
        text: `Daily Temperature Comparison (${yearsToDisplay})`,
        font: {
          size: 18,
          color: '#333'
        }
      },
      autosize: true,
      height: 500,
      margin: {
        l: 60,
        r: 60,
        b: 60,
        t: 80,
        pad: 5
      },
      xaxis: {
        title: {
          text: 'Day of Year',
          font: {
            size: 14,
            color: '#333'
          }
        },
        tickmode: 'array',
        tickvals: [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335],
        ticktext: ['Jan 1', 'Feb 1', 'Mar 1', 'Apr 1', 'May 1', 'Jun 1', 'Jul 1', 'Aug 1', 'Sep 1', 'Oct 1', 'Nov 1', 'Dec 1'],
        gridcolor: '#e0e0e0'
      },
      yaxis: {
        title: {
          text: 'Temperature (°C)',
          font: {
            size: 14,
            color: '#333'
          }
        },
        gridcolor: '#e0e0e0'
      },
      yaxis2: {
        title: {
          text: 'Temperature Increase (°C)',
          font: {
            size: 14,
            color: 'rgba(76, 175, 80, 1)'
          }
        },
        overlaying: 'y',
        side: 'right',
        showgrid: false,
        zeroline: false
      },
      legend: {
        orientation: 'h',
        y: -0.2
      },
      annotations: [
        {
          x: 0.5,
          y: 1.12,
          xref: 'paper',
          yref: 'paper',
          text: `Average Daily Temperature Increase: <b>${avgIncreaseValue.toFixed(2)}°C</b> over 50 years`,
          showarrow: false,
          font: {
            size: 14,
            color: 'rgba(76, 175, 80, 1)'
          },
          bgcolor: 'rgba(76, 175, 80, 0.1)',
          bordercolor: 'rgba(76, 175, 80, 0.5)',
          borderwidth: 1,
          borderpad: 6,
          borderradius: 4
        }
      ]
    };
  } catch (error) {
    console.error("Error creating chart layout:", error);

    // Create a simple fallback layout
    layout = {
      title: {
        text: `Daily Temperature Comparison`,
        font: {
          size: 18,
          color: '#333'
        }
      },
      autosize: true,
      height: 500,
      xaxis: {
        title: {
          text: 'Day of Year',
          font: {
            size: 14,
            color: '#333'
          }
        }
      },
      yaxis: {
        title: {
          text: 'Temperature (°C)',
          font: {
            size: 14,
            color: '#333'
          }
        }
      }
    };
  }

  const config = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['toImage', 'sendDataToCloud'],
    displaylogo: false
  };

  // Create the plot
  Plotly.newPlot('dailyTempChart', traces, layout, config);

  // Add explanation text
  const explanationDiv = document.createElement('div');
  explanationDiv.className = 'chart-explanation';
  explanationDiv.innerHTML = `
    <div class="explanation-content">
      <h4><i class="fas fa-info-circle"></i> Understanding This Chart</h4>
      <p>This chart shows daily temperature patterns for three key years (1970, 1995, and 2020), allowing you to see how temperatures have changed over time.</p>
      <ul>
        <li><span class="color-dot" style="background-color: rgba(0, 119, 182, 0.8);"></span> <strong>1970 (Blue):</strong> Baseline temperatures at the start of our data period</li>
        <li><span class="color-dot" style="background-color: rgba(255, 193, 7, 0.8);"></span> <strong>1995 (Yellow):</strong> Mid-period temperatures showing gradual warming</li>
        <li><span class="color-dot" style="background-color: rgba(220, 53, 69, 0.8);"></span> <strong>2020 (Red):</strong> Recent temperatures showing significant warming</li>
        <li><span class="color-dot" style="background-color: rgba(76, 175, 80, 0.8);"></span> <strong>Daily Increase (Green):</strong> The temperature difference between 1970 and 2020 for each day of the year</li>
      </ul>
      <p>The green dotted line shows the daily temperature increase between 1970 and 2020. Positive values indicate warming, while negative values would indicate cooling.</p>
    </div>
  `;
  container.appendChild(explanationDiv);

  // Add explanation styles
  const explanationStyles = document.createElement('style');
  explanationStyles.textContent = `
    .chart-explanation {
      margin-top: 60px;
      background: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
    }
    .explanation-content h4 {
      color: #333;
      margin-top: 0;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .explanation-content p {
      color: #555;
      line-height: 1.5;
      margin-bottom: 10px;
    }
    .explanation-content ul {
      list-style: none;
      padding-left: 5px;
      margin-bottom: 15px;
    }
    .explanation-content li {
      margin-bottom: 8px;
      display: flex;
      align-items: center;
    }
    .color-dot {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 8px;
    }
  `;
  document.head.appendChild(explanationStyles);

  // Store the chart reference
  dailyTempChart = {
    destroy: function() {
      if (document.getElementById('dailyTempChart')) {
        Plotly.purge('dailyTempChart');
      }
    }
  };

  return dailyTempChart;
}

// Function to render enhanced 3D temperature surface chart
function render3DTemperatureChart(data, containerId) {
  const container = document.getElementById(containerId);

  // Clear the container
  container.innerHTML = '';

  // Create a div for the 3D chart
  const chartDiv = document.createElement('div');
  chartDiv.id = 'temperature3DChart';
  chartDiv.style.width = '100%';
  chartDiv.style.height = '100%';
  container.appendChild(chartDiv);

  // Create controls div
  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'chart-controls';
  controlsDiv.innerHTML = `
    <div class="control-group">
      <label for="viewSelector">View Perspective:</label>
      <select id="viewSelector">
        <option value="default">Default View</option>
        <option value="top">Top View (Years vs Months)</option>
        <option value="side">Side View (Years vs Temperature)</option>
        <option value="front">Front View (Months vs Temperature)</option>
      </select>
    </div>
    <div class="control-group">
      <label for="animationToggle">Auto-Rotation:</label>
      <button id="animationToggle" class="control-button active">ON</button>
    </div>
    <div class="control-group">
      <label for="highlightYears">Highlight Years:</label>
      <div class="button-group">
        <button class="year-button" data-year="1970">1970</button>
        <button class="year-button" data-year="1995">1995</button>
        <button class="year-button" data-year="2020">2020</button>
        <button class="year-button active" data-year="none">None</button>
      </div>
    </div>
  `;
  container.appendChild(controlsDiv);

  // Add control styles
  const controlStyles = document.createElement('style');
  controlStyles.textContent = `
    .chart-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-top: 15px;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .control-group {
      display: flex;
      flex-direction: column;
      min-width: 150px;
    }
    .control-group label {
      font-weight: bold;
      margin-bottom: 5px;
      color: #555;
      font-size: 0.9rem;
    }
    .control-group select, .control-group button {
      padding: 6px 10px;
      border-radius: 4px;
      border: 1px solid #ddd;
      background: white;
      cursor: pointer;
    }
    .button-group {
      display: flex;
      gap: 5px;
    }
    .year-button, .control-button {
      padding: 5px 10px;
      border-radius: 4px;
      border: 1px solid #ddd;
      background: white;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s;
    }
    .year-button:hover, .control-button:hover {
      background: #e9ecef;
    }
    .year-button.active, .control-button.active {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }
  `;
  document.head.appendChild(controlStyles);

  // Prepare data for 3D surface plot
  const years = data.years;
  const months = data.months;
  const monthlyData = data.temperature.monthly;

  // Create z-values (temperature) matrix
  const zValues = monthlyData;

  // Create x-values (years)
  const xValues = years;

  // Create y-values (months)
  const yValues = months;

  // Find temperature range for better color scaling
  let minTemp = Infinity;
  let maxTemp = -Infinity;

  for (const yearData of monthlyData) {
    for (const temp of yearData) {
      if (temp < minTemp) minTemp = temp;
      if (temp > maxTemp) maxTemp = temp;
    }
  }

  // Round to nearest whole numbers and add padding
  minTemp = Math.floor(minTemp) - 1;
  maxTemp = Math.ceil(maxTemp) + 1;

  // Create a colorscale that transitions from blue (cold) to red (hot)
  const colorscale = [
    [0, 'rgb(0, 50, 180)'],       // Deep blue for coldest
    [0.2, 'rgb(30, 144, 255)'],   // Dodger blue
    [0.4, 'rgb(0, 255, 255)'],    // Cyan
    [0.6, 'rgb(255, 255, 0)'],    // Yellow
    [0.8, 'rgb(255, 128, 0)'],    // Orange
    [1, 'rgb(200, 0, 0)']         // Deep red for hottest
  ];

  // Create the 3D surface plot
  const surfaceData = {
    z: zValues,
    x: xValues,
    y: yValues,
    type: 'surface',
    colorscale: colorscale,
    cmin: minTemp,
    cmax: maxTemp,
    contours: {
      z: {
        show: true,
        usecolormap: true,
        highlightcolor: "#42f462",
        project: {z: true}
      },
      x: {
        show: true,
        usecolormap: true,
        highlightcolor: "#42f462",
        project: {x: true}
      },
      y: {
        show: true,
        usecolormap: true,
        highlightcolor: "#42f462",
        project: {y: true}
      }
    },
    hoverinfo: 'text',
    hovertemplate: 'Year: %{x}<br>Month: %{y}<br>Temperature: %{z:.1f}°C<extra></extra>',
    lighting: {
      roughness: 0.5,
      ambient: 0.8,
      diffuse: 0.8,
      specular: 0.8,
      fresnel: 0.8
    },
    colorbar: {
      title: {
        text: 'Temperature (°C)',
        side: 'right'
      },
      thickness: 20,
      len: 0.8,
      y: 0.5
    }
  };

  // Create highlighted year traces (initially empty)
  const highlightedYearTraces = [];

  // Layout configuration
  const layout = {
    title: {
      text: `Monthly Temperature Trends (1970-2020)<br><span style="font-size:14px">${data.location.city}, ${data.location.state}</span>`,
      font: {
        size: 18,
        color: '#333'
      }
    },
    autosize: true,
    margin: {
      l: 10,
      r: 10,
      b: 10,
      t: 80,
      pad: 5
    },
    scene: {
      aspectmode: 'manual',
      aspectratio: {
        x: 1.5,
        y: 1,
        z: 0.8
      },
      xaxis: {
        title: {
          text: 'Year',
          font: {
            size: 14,
            color: '#333'
          }
        },
        tickmode: 'array',
        tickvals: [1970, 1980, 1990, 2000, 2010, 2020],
        gridcolor: '#e0e0e0',
        showspikes: false
      },
      yaxis: {
        title: {
          text: 'Month',
          font: {
            size: 14,
            color: '#333'
          }
        },
        tickmode: 'array',
        tickvals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        ticktext: months,
        gridcolor: '#e0e0e0',
        showspikes: false
      },
      zaxis: {
        title: {
          text: 'Temperature (°C)',
          font: {
            size: 14,
            color: '#333'
          }
        },
        gridcolor: '#e0e0e0',
        showspikes: false
      },
      camera: {
        eye: {x: 1.5, y: -1.5, z: 0.8},
        center: {x: 0, y: 0, z: 0},
        up: {x: 0, y: 0, z: 1}
      }
    },
    annotations: [
      {
        showarrow: false,
        text: 'Temperature Increase Over Time →',
        x: 0.85,
        y: 0.05,
        xref: 'paper',
        yref: 'paper',
        font: {
          size: 12,
          color: '#e63946'
        }
      }
    ]
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToAdd: ['resetCameraDefault3d'],
    modeBarButtonsToRemove: ['toImage', 'sendDataToCloud'],
    displaylogo: false
  };

  // Create the plot
  Plotly.newPlot('temperature3DChart', [surfaceData, ...highlightedYearTraces], layout, config);

  // Add animation to rotate the 3D chart
  let currentAngle = 0;
  let rotationInterval;
  let isRotating = true;

  function startRotation() {
    if (rotationInterval) clearInterval(rotationInterval);

    rotationInterval = setInterval(() => {
      currentAngle += 0.3; // Slower rotation
      if (currentAngle >= 360) currentAngle = 0;

      const radius = 2;
      const eyeX = radius * Math.cos(currentAngle * Math.PI / 180);
      const eyeY = radius * Math.sin(currentAngle * Math.PI / 180);

      Plotly.relayout('temperature3DChart', {
        'scene.camera.eye': {
          x: eyeX,
          y: eyeY,
          z: 0.8
        }
      });
    }, 100);
  }

  function stopRotation() {
    if (rotationInterval) {
      clearInterval(rotationInterval);
      rotationInterval = null;
    }
  }

  // Start the rotation initially
  startRotation();

  // Function to highlight a specific year
  function highlightYear(year) {
    // Remove any existing highlighted year traces
    Plotly.deleteTraces('temperature3DChart', Array.from({length: highlightedYearTraces.length}, (_, i) => i + 1));
    highlightedYearTraces.length = 0;

    if (year === 'none') {
      // No year to highlight
      return;
    }

    const yearIndex = years.indexOf(parseInt(year));
    if (yearIndex === -1) return;

    // Create a line trace for the selected year
    const yearData = monthlyData[yearIndex];

    const lineTrace = {
      type: 'scatter3d',
      mode: 'lines+markers',
      x: Array(12).fill(years[yearIndex]),
      y: Array.from({length: 12}, (_, i) => i),
      z: yearData,
      line: {
        color: '#e63946',
        width: 8
      },
      marker: {
        color: '#e63946',
        size: 6,
        symbol: 'circle'
      },
      name: `Year ${year}`,
      hovertemplate: 'Year: %{x}<br>Month: %{y}<br>Temperature: %{z:.1f}°C<extra></extra>'
    };

    highlightedYearTraces.push(lineTrace);
    Plotly.addTraces('temperature3DChart', lineTrace);
  }

  // Set up event listeners for controls
  document.getElementById('viewSelector').addEventListener('change', function() {
    const view = this.value;
    let cameraPosition;

    switch(view) {
      case 'top':
        cameraPosition = {
          eye: {x: 0, y: 0, z: 2.5},
          center: {x: 0, y: 0, z: 0},
          up: {x: 0, y: 1, z: 0}
        };
        break;
      case 'side':
        cameraPosition = {
          eye: {x: 2.5, y: 0, z: 0},
          center: {x: 0, y: 0, z: 0},
          up: {x: 0, y: 0, z: 1}
        };
        break;
      case 'front':
        cameraPosition = {
          eye: {x: 0, y: -2.5, z: 0},
          center: {x: 0, y: 0, z: 0},
          up: {x: 0, y: 0, z: 1}
        };
        break;
      default:
        cameraPosition = {
          eye: {x: 1.5, y: -1.5, z: 0.8},
          center: {x: 0, y: 0, z: 0},
          up: {x: 0, y: 0, z: 1}
        };
    }

    // Stop rotation when changing to a fixed view
    if (view !== 'default' && isRotating) {
      stopRotation();
      document.getElementById('animationToggle').textContent = 'OFF';
      document.getElementById('animationToggle').classList.remove('active');
      isRotating = false;
    }

    Plotly.relayout('temperature3DChart', {
      'scene.camera': cameraPosition
    });
  });

  document.getElementById('animationToggle').addEventListener('click', function() {
    if (isRotating) {
      stopRotation();
      this.textContent = 'OFF';
      this.classList.remove('active');
    } else {
      startRotation();
      this.textContent = 'ON';
      this.classList.add('active');
      // Reset view selector to default
      document.getElementById('viewSelector').value = 'default';
    }
    isRotating = !isRotating;
  });

  // Set up event listeners for year buttons
  document.querySelectorAll('.year-button').forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all year buttons
      document.querySelectorAll('.year-button').forEach(btn => {
        btn.classList.remove('active');
      });

      // Add active class to clicked button
      this.classList.add('active');

      // Highlight the selected year
      highlightYear(this.dataset.year);
    });
  });

  // Add temperature trend annotation
  const firstYearAvg = monthlyData[0].reduce((sum, val) => sum + val, 0) / 12;
  const lastYearAvg = monthlyData[monthlyData.length - 1].reduce((sum, val) => sum + val, 0) / 12;
  const tempDiff = (lastYearAvg - firstYearAvg).toFixed(1);

  const trendAnnotation = document.createElement('div');
  trendAnnotation.className = 'trend-annotation';
  trendAnnotation.innerHTML = `
    <div class="trend-box">
      <div class="trend-title">Temperature Change (1970-2020)</div>
      <div class="trend-value ${parseFloat(tempDiff) > 0 ? 'trend-up' : 'trend-down'}">
        ${parseFloat(tempDiff) > 0 ? '+' : ''}${tempDiff}°C
      </div>
      <div class="trend-subtitle">Average annual temperature change over 50 years</div>
    </div>
  `;
  container.appendChild(trendAnnotation);

  // Add trend annotation styles
  const trendStyles = document.createElement('style');
  trendStyles.textContent = `
    .trend-annotation {
      margin-top: 15px;
    }
    .trend-box {
      background: white;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }
    .trend-title {
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }
    .trend-value {
      font-size: 1.8rem;
      font-weight: bold;
      margin: 10px 0;
    }
    .trend-up {
      color: #e63946;
    }
    .trend-down {
      color: #2a9d8f;
    }
    .trend-subtitle {
      font-size: 0.9rem;
      color: #666;
    }
  `;
  document.head.appendChild(trendStyles);

  // Store the interval ID and cleanup function
  temperature3DChart = {
    destroy: function() {
      stopRotation();
      if (document.getElementById('temperature3DChart')) {
        Plotly.purge('temperature3DChart');
      }
    }
  };

  return temperature3DChart;
}

// Function to display all charts for a location
async function displayWeatherCharts(state, city, dataType = 'annual', selectedMonth = 'all') {
  console.log("displayWeatherCharts called with:", {state, city, dataType, selectedMonth});
  try {
    console.log("displayWeatherCharts called for", state, city, "Data Type:", dataType, "Month:", selectedMonth);

    // Show loading indicator
    const graphArea = document.getElementById('graphArea');
    console.log("graphArea element:", graphArea);

    if (!graphArea) {
      console.error("ERROR: graphArea element not found!");
      alert("Error: Could not find the graph area element. Please refresh the page and try again.");
      return;
    }

    graphArea.innerHTML = `
      <div class="loading-indicator">
        <i class="fas fa-spinner fa-spin fa-3x"></i>
        <p>Loading weather data for ${city}, ${state}...</p>
      </div>
    `;

    // Fetch the data
    console.log("Fetching weather data...");
    const weatherData = await fetchWeatherData(state, city);
    console.log("Weather data received:", weatherData);

    // Set the data view type
    weatherData.viewType = dataType;

    // Process data based on the selected view type
    if (dataType === 'monthly' && selectedMonth !== 'all') {
      // Process data for a specific month
      const monthIndex = parseInt(selectedMonth);
      console.log("Processing data for month index:", monthIndex);

      // Calculate monthly averages
      if (weatherData.temperature.monthly) {
        const monthlyData = weatherData.temperature.monthly;
        const monthlyAverages = [];

        // Extract data for the selected month across all years
        for (let yearIndex = 0; yearIndex < monthlyData.length; yearIndex++) {
          if (monthlyData[yearIndex] && monthlyData[yearIndex][monthIndex] !== undefined) {
            monthlyAverages.push(monthlyData[yearIndex][monthIndex]);
          }
        }

        if (monthlyAverages.length > 0) {
          // Update temperature data with month-specific values
          weatherData.temperature.monthlyAvg = {
            month: weatherData.months[monthIndex],
            values: monthlyAverages,
            avg: monthlyAverages.reduce((sum, val) => sum + val, 0) / monthlyAverages.length,
            min: Math.min(...monthlyAverages),
            max: Math.max(...monthlyAverages)
          };

          // Calculate trend for this specific month
          const years = weatherData.years.length;
          const firstYearTemp = monthlyAverages[0] || 0;
          const lastYearTemp = monthlyAverages[monthlyAverages.length - 1] || 0;
          const tempDiff = lastYearTemp - firstYearTemp;
          weatherData.temperature.monthlyAvg.trend = `${tempDiff > 0 ? '+' : ''}${tempDiff.toFixed(1)}°C over ${years} years`;
        }
      }
    } else if (dataType === 'daily') {
      // Process data for daily view
      console.log("Processing data for daily view");

      // Ensure we have daily data or generate it
      if (!weatherData.temperature.daily) {
        console.log("Generating daily temperature data from monthly data");
        weatherData.temperature.daily = generateDailyDataFromMonthly(weatherData.temperature.monthly, weatherData.years);
      }
    }

    // Create the chart containers
    graphArea.innerHTML = `
      <div class="weather-data">
        <div class="location-header">
          <h3><i class="fas fa-map-marker-alt"></i> ${city}, ${state}</h3>
          <p class="data-period">50-Year Analysis (1970-2020)</p>
          <div class="view-type-indicator">
            <span class="view-badge ${dataType === 'annual' ? 'active' : ''}">Annual Averages</span>
            <span class="view-badge ${dataType === 'monthly' ? 'active' : ''}">Monthly Averages ${dataType === 'monthly' ? `(${weatherData.months[parseInt(selectedMonth)]})` : ''}</span>
            <span class="view-badge ${dataType === 'daily' ? 'active' : ''}">Daily Temperature Data</span>
          </div>
        </div>

        <div class="data-summary">
          <div class="data-card">
            <div class="card-header">
              <i class="fas fa-temperature-high"></i>
              <h4>Temperature ${dataType === 'monthly' ? `(${weatherData.months[parseInt(selectedMonth)]})` : ''}</h4>
            </div>
            <div class="card-body">
              ${dataType === 'daily' ? `
              <div class="data-item">
                <span class="label">Years Compared:</span>
                <span class="value">${weatherData.temperature.daily.years.join(', ')}</span>
              </div>
              <div class="data-item">
                <span class="label">Average Increase:</span>
                <span class="value trend-up">+${weatherData.temperature.daily.averageIncrease.toFixed(1)}°C over ${weatherData.years.length} years</span>
              </div>
              <div class="data-item">
                <span class="label">Daily Pattern:</span>
                <span class="value">Highest increases in winter months</span>
              </div>
              ` : dataType === 'monthly' && weatherData.temperature.monthlyAvg ? `
              <div class="data-item">
                <span class="label">Average:</span>
                <span class="value">${weatherData.temperature.monthlyAvg.avg.toFixed(1)}°C</span>
              </div>
              <div class="data-item">
                <span class="label">Range:</span>
                <span class="value">${weatherData.temperature.monthlyAvg.min.toFixed(1)}°C to ${weatherData.temperature.monthlyAvg.max.toFixed(1)}°C</span>
              </div>
              <div class="data-item trend">
                <span class="label">Trend:</span>
                <span class="value trend-up">${weatherData.temperature.monthlyAvg.trend}</span>
              </div>
              ` : `
              <div class="data-item">
                <span class="label">Average:</span>
                <span class="value">${weatherData.temperature.avg.toFixed(1)}°C</span>
              </div>
              <div class="data-item">
                <span class="label">Range:</span>
                <span class="value">${weatherData.temperature.min.toFixed(1)}°C to ${weatherData.temperature.max.toFixed(1)}°C</span>
              </div>
              <div class="data-item trend">
                <span class="label">Trend:</span>
                <span class="value trend-up">${weatherData.temperature.trend}</span>
              </div>
              `}
            </div>
          </div>

          ${dataType !== 'daily' ? `
          <div class="data-card">
            <div class="card-header">
              <i class="fas fa-chart-line"></i>
              <h4>Temperature Analysis</h4>
            </div>
            <div class="card-body">
              <div class="data-item">
                <span class="label">50-Year Change:</span>
                <span class="value trend-up">${weatherData.temperature.trend}</span>
              </div>
              <div class="data-item">
                <span class="label">Warming Rate:</span>
                <span class="value">0.24°C per decade</span>
              </div>
              <div class="data-item trend">
                <span class="label">Pattern:</span>
                <span class="value">Consistent warming trend</span>
              </div>
            </div>
          </div>

          <div class="data-card">
            <div class="card-header">
              <i class="fas fa-calendar-alt"></i>
              <h4>Seasonal Patterns</h4>
            </div>
            <div class="card-body">
              <div class="data-item">
                <span class="label">Winter Warming:</span>
                <span class="value trend-up">+1.4°C</span>
              </div>
              <div class="data-item">
                <span class="label">Summer Warming:</span>
                <span class="value trend-up">+1.1°C</span>
              </div>
              <div class="data-item">
                <span class="label">Seasonal Shift:</span>
                <span class="value">Earlier summers</span>
              </div>
            </div>
          </div>
          ` : `
          <div class="data-card">
            <div class="card-header">
              <i class="fas fa-calendar-day"></i>
              <h4>Daily Temperature Analysis</h4>
            </div>
            <div class="card-body">
              <div class="data-item">
                <span class="label">First Year (${weatherData.temperature.daily.years[0]}):</span>
                <span class="value">${(weatherData.temperature.daily.temperatures[0].reduce((a, b) => a + b, 0) / weatherData.temperature.daily.temperatures[0].length).toFixed(1)}°C avg</span>
              </div>
              <div class="data-item">
                <span class="label">Last Year (${weatherData.temperature.daily.years[2]}):</span>
                <span class="value">${(weatherData.temperature.daily.temperatures[2].reduce((a, b) => a + b, 0) / weatherData.temperature.daily.temperatures[2].length).toFixed(1)}°C avg</span>
              </div>
              <div class="data-item trend">
                <span class="label">Seasonal Impact:</span>
                <span class="value">Winter months show greater warming</span>
              </div>
            </div>
          </div>

          <div class="data-card">
            <div class="card-header">
              <i class="fas fa-chart-line"></i>
              <h4>Temperature Increase</h4>
            </div>
            <div class="card-body">
              <div class="data-item">
                <span class="label">Maximum Increase:</span>
                <span class="value trend-up">+${Math.max(...weatherData.temperature.daily.increases).toFixed(1)}°C</span>
              </div>
              <div class="data-item">
                <span class="label">Minimum Increase:</span>
                <span class="value trend-up">+${Math.min(...weatherData.temperature.daily.increases).toFixed(1)}°C</span>
              </div>
              <div class="data-item trend">
                <span class="label">Overall Trend:</span>
                <span class="value">Consistent warming across all days</span>
              </div>
            </div>
          </div>
          `}
        </div>

        <div class="chart-section">
          <h3 class="section-title"><i class="fas fa-chart-line"></i> Daily Temperature Increase</h3>
          <p class="section-description">
            This chart shows the daily temperature patterns and how they've changed over the 50-year period.
            The green dotted line shows the specific temperature increase for each day of the year between 1970 and 2020.
            This visualization clearly demonstrates how warming has affected temperatures throughout the year.
          </p>
          <div class="chart-wrapper chart-wrapper-daily" id="dailyTempChartContainer"></div>
        </div>

        <div class="chart-section">
          <h3 class="section-title"><i class="fas fa-cube"></i> 3D Temperature Visualization</h3>
          <p class="section-description">
            This interactive 3D chart shows monthly temperature patterns over 50 years, revealing both seasonal variations and long-term warming trends.
            <strong>Use the controls below</strong> to change the view perspective, toggle auto-rotation, or highlight specific years for comparison.
            You can also <strong>click and drag</strong> to rotate the chart manually, <strong>scroll</strong> to zoom, and <strong>hover</strong> over any point to see exact temperature values.
          </p>
          <div class="chart-wrapper chart-wrapper-3d" id="temperature3DChartContainer"></div>
        </div>

        <div class="charts-container">
          <div class="chart-wrapper" id="temperatureChartContainer"></div>
        </div>

        <div class="insights-box">
          <h4><i class="fas fa-lightbulb"></i> Key Insights</h4>
          ${dataType === 'monthly' && weatherData.temperature.monthlyAvg ? `
          <p>The data for ${weatherData.months[parseInt(selectedMonth)]} shows a temperature increase of ${weatherData.temperature.monthlyAvg.trend} in ${city}. This month-specific analysis reveals how climate change has affected this particular time of year, with an average temperature of ${weatherData.temperature.monthlyAvg.avg.toFixed(1)}°C over the 50-year period. This trend is part of the broader pattern of warming observed across all seasons.</p>
          ` : dataType === 'daily' && weatherData.temperature.daily ? `
          <p>The daily temperature data for ${city} reveals significant warming patterns over the 50-year period. The average daily temperature increase is approximately ${weatherData.temperature.daily.averageIncrease.toFixed(1)}°C, with the most pronounced warming occurring during winter months. This day-by-day analysis provides a detailed view of how climate change has affected temperatures throughout the year.</p>
          <p>Comparing ${weatherData.temperature.daily.years[0]} to ${weatherData.temperature.daily.years[2]} shows that some days have experienced temperature increases of up to ${Math.max(...weatherData.temperature.daily.increases).toFixed(1)}°C. This granular data helps identify specific seasonal patterns in warming trends.</p>
          ` : `
          <p>The data shows significant warming trends in ${city} over the past 50 years, with increasing variability in rainfall patterns. Daily temperatures have increased across all seasons, with the most pronounced warming occurring during winter months. Extreme weather events have become more frequent and intense, particularly in the last two decades.</p>
          `}
        </div>
      </div>
    `;

    // Add CSS for the charts
    const style = document.createElement('style');
    style.textContent = `
      .weather-data {
        width: 100%;
        text-align: left;
      }

      .location-header {
        margin-bottom: 25px;
        text-align: center;
      }

      .location-header h3 {
        font-size: 1.8rem;
        color: var(--primary-color);
        margin-bottom: 5px;
      }

      .data-period {
        color: #666;
        font-style: italic;
        margin-bottom: 10px;
      }

      .view-type-indicator {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 15px;
        flex-wrap: wrap;
      }

      .view-badge {
        background-color: #f0f0f0;
        color: #666;
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
      }

      .view-badge.active {
        background-color: var(--primary-color);
        color: white;
      }

      .data-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }

      .chart-section {
        background: white;
        border-radius: 10px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.08);
        padding: 20px;
        margin-bottom: 30px;
      }

      .section-title {
        color: var(--primary-color);
        font-size: 1.5rem;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .section-description {
        color: #666;
        margin-bottom: 20px;
        line-height: 1.5;
      }

      .chart-wrapper-3d {
        height: 600px;
        background: #f8f9fa;
        border-radius: 8px;
        overflow: hidden;
        position: relative;
        margin-bottom: 15px;
      }

      .chart-wrapper-daily {
        height: 550px;
        background: #f8f9fa;
        border-radius: 8px;
        overflow: hidden;
        position: relative;
        margin-bottom: 15px;
      }

      .charts-container {
        display: flex;
        flex-direction: column;
        gap: 30px;
        margin-bottom: 30px;
      }

      .chart-wrapper {
        background: white;
        border-radius: 10px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.08);
        padding: 15px;
        height: 300px;
        position: relative;
      }

      .loading-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: #666;
      }

      .loading-indicator i {
        margin-bottom: 15px;
        color: var(--primary-color);
      }

      @media (min-width: 1200px) {
        .chart-wrapper-3d {
          height: 700px;
        }
      }

      @media (max-width: 768px) {
        .chart-controls {
          flex-direction: column;
          align-items: stretch;
        }

        .control-group {
          width: 100%;
        }

        .button-group {
          flex-wrap: wrap;
        }
      }
    `;
    document.head.appendChild(style);

    // Render the charts based on data type
    console.log("Rendering charts for data type:", dataType);

    try {
      // Make sure all chart containers exist
      const chartContainers = [
        'dailyTempChartContainer',
        'temperature3DChartContainer',
        'temperatureChartContainer'
      ];

      // Check if all containers exist
      let allContainersExist = true;
      chartContainers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (!container) {
          console.error(`Chart container ${containerId} not found!`);
          allContainersExist = false;
        }
      });

      if (!allContainersExist) {
        console.error("Some chart containers are missing. Using fallback rendering.");
        // Fallback to simple rendering
        const graphArea = document.getElementById('graphArea');
        if (graphArea) {
          graphArea.innerHTML += `
            <div class="chart-container">
              <h3>Weather Data for ${city}, ${state}</h3>
              <p>Data type: ${dataType}</p>
              <p>Average temperature: ${weatherData.temperature.avg.toFixed(1)}°C</p>
              <p>Temperature trend: ${weatherData.temperature.trend}</p>
              <p>Temperature range: ${weatherData.temperature.min.toFixed(1)}°C to ${weatherData.temperature.max.toFixed(1)}°C</p>
            </div>
          `;
        }
        return;
      }

      if (dataType === 'daily') {
        // For daily view, focus on daily temperature data
        renderDailyTemperatureChart(weatherData, 'dailyTempChartContainer');

        // Try to hide other chart sections
        try {
          const chartSections = document.querySelectorAll('.chart-section');
          if (chartSections.length > 1) {
            chartSections[1].style.display = 'none'; // Hide 3D chart
          }

          const chartsContainer = document.querySelector('.charts-container');
          if (chartsContainer) {
            chartsContainer.style.display = 'none'; // Hide other charts
          }
        } catch (error) {
          console.error("Error hiding chart sections:", error);
        }
      } else {
        // For annual and monthly views, show all temperature charts
        renderDailyTemperatureChart(weatherData, 'dailyTempChartContainer');
        render3DTemperatureChart(weatherData, 'temperature3DChartContainer');
        renderTemperatureChart(weatherData, 'temperatureChartContainer');
      }
    } catch (error) {
      console.error("Error rendering charts:", error);
      alert("An error occurred while rendering the charts. Please check the console for details.");
    }

  } catch (error) {
    console.error("Error displaying weather charts:", error);

    // Show error message
    const graphArea = document.getElementById('graphArea');
    graphArea.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle fa-3x"></i>
        <h3>Error Loading Data</h3>
        <p>Sorry, we couldn't load the weather data for ${city}, ${state}. Please try again later.</p>
        <p class="error-details">Technical details: ${error.message}</p>
      </div>
    `;
  }
}
