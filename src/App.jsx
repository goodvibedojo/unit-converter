import { useState, useEffect } from 'react'
import './App.css'

const unitTypes = {
  length: {
    name: 'Length',
    units: {
      meters: 1,
      kilometers: 1000,
      centimeters: 0.01,
      millimeters: 0.001,
      miles: 1609.34,
      yards: 0.9144,
      feet: 0.3048,
    }
  },
  weight: {
    name: 'Weight',
    units: {
      kilograms: 1,
      grams: 0.001,
      milligrams: 0.000001,
      pounds: 0.453592,
      ounces: 0.0283495,
    }
  },
  temperature: {
    name: 'Temperature',
    units: {
      celsius: 'celsius',
      fahrenheit: 'fahrenheit',
      kelvin: 'kelvin',
    }
  }
}

function CarbonAd() {
  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.type = 'text/javascript';
    script.src = '//cdn.carbonads.com/carbon.js?serve=CESDK53J&placement=a-easy-unit-converternetlifyapp';
    script.id = '_carbonads_js';

    const adContainer = document.getElementById('carbon-ad');
    if (adContainer) {
      while (adContainer.firstChild) {
        adContainer.removeChild(adContainer.firstChild);
      }
      adContainer.appendChild(script);
    }

    return () => {
      const ad = document.getElementById('_carbonads_js');
      if (ad) {
        ad.remove();
      }
    };
  }, []);

  return <div id="carbon-ad" className="carbon-ad" />;
}

function App() {
  const [selectedType, setSelectedType] = useState('length')
  const [fromValue, setFromValue] = useState('')
  const [fromUnit, setFromUnit] = useState('meters')
  const [toUnit, setToUnit] = useState('kilometers')
  const [result, setResult] = useState('')

  // Update default units when conversion type changes
  useEffect(() => {
    const units = Object.keys(unitTypes[selectedType].units)
    setFromUnit(units[0])
    setToUnit(units[1])
    setFromValue('')
    setResult('')
  }, [selectedType])

  const convert = () => {
    if (!fromValue) {
      setResult('')
      return
    }

    const value = parseFloat(fromValue)
    if (isNaN(value)) {
      setResult('Invalid input')
      return
    }

    if (selectedType === 'temperature') {
      let celsius
      // Convert to Celsius first
      if (fromUnit === 'celsius') {
        celsius = value
      } else if (fromUnit === 'fahrenheit') {
        celsius = (value - 32) * 5/9
      } else if (fromUnit === 'kelvin') {
        celsius = value - 273.15
      }

      // Convert from Celsius to target unit
      if (toUnit === 'celsius') {
        setResult(celsius.toFixed(2))
      } else if (toUnit === 'fahrenheit') {
        setResult((celsius * 9/5 + 32).toFixed(2))
      } else if (toUnit === 'kelvin') {
        setResult((celsius + 273.15).toFixed(2))
      }
    } else {
      const baseValue = value * unitTypes[selectedType].units[fromUnit]
      const convertedValue = baseValue / unitTypes[selectedType].units[toUnit]
      setResult(convertedValue.toFixed(6))
    }
  }

  return (
    <div className="app-wrapper">
      <div className="ad-space top-ad">
        <CarbonAd />
      </div>
      
      <div className="ad-space left-ad">
        <div className="affiliate-products">
          <h4>Length & Distance</h4>
          <a href="https://www.amazon.com/Komelon-SL2825-Self-Lock-Power-25-Foot/dp/B000BQKXLE?&linkCode=ll1&tag=YOUR-TAG-20" target="_blank" rel="noopener noreferrer">
            Professional Measuring Tape
          </a>
          <a href="https://www.amazon.com/Calculated-Industries-8025-Construction-Calculator/dp/B00022749Q?&linkCode=ll1&tag=YOUR-TAG-20" target="_blank" rel="noopener noreferrer">
            Construction Calculator
          </a>
        </div>
      </div>

      <div className="converter-container">
        <h1>Unit Converter</h1>
        
        <div className="converter-form">
          <div className="type-selector">
            <label htmlFor="type">Conversion Type:</label>
            <select 
              id="type" 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {Object.entries(unitTypes).map(([key, value]) => (
                <option key={key} value={key}>{value.name}</option>
              ))}
            </select>
          </div>

          <div className="conversion-inputs">
            <div className="input-group">
              <input
                type="number"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
                placeholder="Enter value"
              />
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
              >
                {Object.keys(unitTypes[selectedType].units).map((unit) => (
                  <option key={unit} value={unit}>
                    {unit.charAt(0).toUpperCase() + unit.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <input
                type="text"
                value={result}
                readOnly
                placeholder="Result"
              />
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
              >
                {Object.keys(unitTypes[selectedType].units).map((unit) => (
                  <option key={unit} value={unit}>
                    {unit.charAt(0).toUpperCase() + unit.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={convert}>Convert</button>
        </div>
      </div>

      <div className="ad-space right-ad">
        <div className="affiliate-products">
          <h4>Weight & Temperature</h4>
          <a href="https://www.amazon.com/Etekcity-Kitchen-Stainless-Temperature-Batteries/dp/B0113UZJE2?&linkCode=ll1&tag=YOUR-TAG-20" target="_blank" rel="noopener noreferrer">
            Digital Food Scale
          </a>
          <a href="https://www.amazon.com/ThermoPro-TP03-Digital-Instant-Temperature/dp/B01IHHLB3W?&linkCode=ll1&tag=YOUR-TAG-20" target="_blank" rel="noopener noreferrer">
            Digital Thermometer
          </a>
        </div>
      </div>

      <div className="ad-space bottom-ad">
        <CarbonAd />
      </div>
    </div>
  )
}

export default App
