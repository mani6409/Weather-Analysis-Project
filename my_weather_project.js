// Data: State to Cities
const stateCityData = {
  "Jammu and Kashmir": ["SRINAGAR"],
  "Punjab": ["AMRITSAR", "PATIALA"],
  "Haryana": ["HISSAR", "SAFDARJUNG (actually in Delhi, see below)"],
  "Delhi (NCT)": ["SAFDARJUNG (New Delhi)"],
  "Rajasthan": ["BIKANER", "JAISALMER", "JODHPUR", "KOTA"],
  "Uttar Pradesh": ["BAREILLY", "AGRA", "GWALIOR", "LUCKNOW"],
  "Assam": ["DIBRUGARH", "GUWAHATI INTL"],
  "Bihar": ["PATNA", "GAYA"],
  "Madhya Pradesh": ["BHOPAL", "JABALPUR", "SATNA", "DEVI AHILYABAI HOLKAR (Indore)", "PENDRA ROAD"],
  "Jharkhand": ["BIRSA MUNDA (Ranchi)", "JAMSHEDPUR"],
  "Tripura": ["AGARTALA"],
  "Gujarat": ["BHUJ", "AHMEDABAD", "RAJKOT", "SURAT", "VERAVAL"],
  "West Bengal": ["NETAJI SUBHASH CHANDRA BOSE INTL (Kolkata)"],
  "Chhattisgarh": ["JAGDALPUR", "PENDRA ROAD", "DR AMBEDKAR INTL (Raipur)"],
  "Odisha": ["JHARSUGUDA", "BALASORE", "BHUBANESHWAR"],
  "Maharashtra": ["CHHATRAPATI SHIVAJI INTL (Mumbai)", "AURANGABAD", "PUNE", "RATNAGIRI", "SHOLAPUR"],
  "Telangana": ["RAMGUNDAM", "BEGUMPET AIRPORT (Hyderabad)"],
  "Andhra Pradesh": ["KAKINADA", "PBO ANANTAPUR", "NELLORE"],
  "Goa": ["GOA or PANJIM"],
  "Karnataka": ["BELGAUM", "GADAG", "CHITRADURGA", "BANGALORE", "MANGALORE"],
  "Tamil Nadu": ["CHENNAI INTL", "COIMBATORE", "CUDDALORE", "TIRUCHIRAPPALLI"],
  "Kerala": ["KOZHIKODE", "THIRUVANANTHAPURAM"],
  "Andaman and Nicobar Islands": ["PORT BLAIR"],
  "Lakshadweep": ["MINICOY"]
};

// Sample weather data for demonstration
const sampleWeatherData = {
  "temperature": {
    "avg": 28.5,
    "min": 15.2,
    "max": 42.8,
    "trend": "+1.2°C over 50 years"
  },
  "rainfall": {
    "annual": 1200,
    "monsoon": 850,
    "nonMonsoon": 350,
    "trend": "Increasing variability"
  },
  "extremeEvents": {
    "heatwaves": "Increasing frequency",
    "heavyRain": "More intense",
    "droughts": "Longer duration"
  }
};

// Initialize DOM elements and event listeners when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const introSection = document.getElementById("intro");
  const mainContent = document.getElementById("mainContent");
  const startBtn = document.getElementById("startBtn");
  const homeBtn = document.getElementById("homeBtn");
  const infoBtn = document.getElementById("infoBtn");
  const teamBtn = document.getElementById("teamBtn");
  const infoModal = document.getElementById("infoModal");
  const teamModal = document.getElementById("teamModal");
  const closeBtns = document.querySelectorAll(".close-btn");
  const stateSelect = document.getElementById("stateSelect");
  const citySelect = document.getElementById("citySelect");
  const searchBtn = document.getElementById("searchBtn");

  // Note: graphArea is used in charts.js, but we don't need it here

  // Log elements to check if they're found
  console.log("DOM Elements loaded successfully");

  // Show main content when "Get Started" is clicked
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      console.log("Start button clicked");
      introSection.classList.add("hidden");
      mainContent.classList.remove("hidden");
    });
  }

  // Home button functionality
  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      console.log("Home button clicked");
      mainContent.classList.add("hidden");
      introSection.classList.remove("hidden");
    });
  }

  // Info button to show modal
  if (infoBtn && infoModal) {
    infoBtn.addEventListener("click", () => {
      console.log("Info button clicked");
      infoModal.classList.remove("hidden");
      infoModal.classList.add("show");
    });
  }

  // Team button to show team modal
  if (teamBtn && teamModal) {
    teamBtn.addEventListener("click", () => {
      console.log("Team button clicked");
      teamModal.classList.remove("hidden");
      teamModal.classList.add("show");
    });
  }

  // Close buttons for modals
  closeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      console.log("Close button clicked");

      // Find the parent modal
      const modal = btn.closest('.modal');
      if (modal) {
        modal.classList.remove("show");
        setTimeout(() => {
          modal.classList.add("hidden");
        }, 300);
      }
    });
  });

  // Close modals when clicking outside of them
  window.addEventListener("click", (event) => {
    if (event.target.classList.contains('modal')) {
      event.target.classList.remove("show");
      setTimeout(() => {
        event.target.classList.add("hidden");
      }, 300);
    }
  });

  // Populate state dropdown
  if (stateSelect) {
    // Clear any existing options except the first one
    while (stateSelect.options.length > 1) {
      stateSelect.remove(1);
    }

    // Add state options
    for (const state in stateCityData) {
      const option = document.createElement("option");
      option.value = state;
      option.textContent = state;
      stateSelect.appendChild(option);
    }

    console.log("✅ State dropdown populated with", Object.keys(stateCityData).length, "states");
  } else {
    console.error("❌ Could not find stateSelect element");
  }

  // Handle state selection to populate city dropdown
  if (stateSelect && citySelect) {
    stateSelect.addEventListener("change", () => {
      const selectedState = stateSelect.value;
      console.log("State selected:", selectedState);

      // Clear city dropdown
      while (citySelect.options.length > 0) {
        citySelect.remove(0);
      }

      // If no state is selected, disable city dropdown
      if (!selectedState) {
        citySelect.disabled = true;
        citySelect.innerHTML = '<option value="">-- First Select a State --</option>';
        monthSelectContainer.style.display = 'none';
        return;
      }

      // Enable city dropdown and add default option
      citySelect.disabled = false;
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = `-- Select a city in ${selectedState} --`;
      citySelect.appendChild(defaultOption);

      // Add cities for the selected state
      if (stateCityData[selectedState]) {
        stateCityData[selectedState].forEach(city => {
          const option = document.createElement("option");
          option.value = city;
          option.textContent = city;
          citySelect.appendChild(option);
        });

        console.log(`✅ City dropdown populated with ${stateCityData[selectedState].length} cities for ${selectedState}`);
      }
    });

    // Log when city is selected
    citySelect.addEventListener("change", () => {
      const selectedCity = citySelect.value;
      console.log("City selected:", selectedCity);
    });
  }

  // Display selected city data on click
  if (searchBtn) {
    console.log("Search button found, adding event listener");

    searchBtn.addEventListener("click", () => {
      console.log("Search button clicked");
      const selectedState = stateSelect.value;
      const selectedCity = citySelect.value;
      // Use default values for data type and month
      const selectedDataType = 'annual';
      const selectedMonth = 'all';

      if (!selectedState) {
        alert("Please select a state.");
        return;
      }

      if (!selectedCity) {
        alert("Please select a city.");
        return;
      }

      console.log("Selected:", selectedState, selectedCity);

      try {
        // Make sure the displayWeatherCharts function exists
        if (typeof displayWeatherCharts !== 'function') {
          console.error("ERROR: displayWeatherCharts function not found!");
          alert("Error: Could not find the displayWeatherCharts function. Please refresh the page and try again.");
          return;
        }

        console.log("Calling displayWeatherCharts with:", {
          selectedState,
          selectedCity,
          selectedDataType,
          selectedMonth
        });

        // Display weather charts using the charts.js functionality
        displayWeatherCharts(selectedState, selectedCity, selectedDataType, selectedMonth);
      } catch (error) {
        console.error("Error displaying weather charts:", error);
        alert("An error occurred while trying to display the weather charts. Please check the console for details.");
      }
    });
  } else {
    console.error("ERROR: Search button not found!");
  }
});
