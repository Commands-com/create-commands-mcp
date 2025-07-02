import { Tool, MCPError } from '../types';

/**
 * Weather Tool - Demonstrates API integration requiring API keys
 * 
 * This tool shows:
 * - Environment variable configuration
 * - API key management
 * - Error handling for missing configuration
 * - Graceful degradation when API is unavailable
 */
export const weatherTool: Tool = {
  name: 'weather',
  description: 'Get current weather information (requires API key configuration)',
  inputSchema: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City name or coordinates (lat,lng)',
        minLength: 2,
        maxLength: 100
      },
      units: {
        type: 'string',
        enum: ['metric', 'imperial', 'kelvin'],
        description: 'Temperature units',
        default: 'metric'
      },
      include_forecast: {
        type: 'boolean',
        description: 'Include basic forecast information',
        default: false
      }
    },
    required: ['location']
  },
  handler: async (args: { location: string; units?: string; include_forecast?: boolean }) => {
    const { location, units = 'metric', include_forecast = false } = args;
    
    // Validate input
    if (!location || typeof location !== 'string' || location.trim().length < 2) {
      throw new MCPError('INVALID_PARAMS', 'Location must be at least 2 characters long');
    }
    
    // Check for API key
    const apiKey = process.env.OPENWEATHER_API_KEY || process.env.WEATHER_API_KEY;
    
    if (!apiKey) {
      // Return helpful error message with setup instructions
      return {
        error: 'Weather API not configured',
        message: 'To use the weather tool, you need to:',
        setup_instructions: [
          '1. Get a free API key from OpenWeatherMap.org',
          '2. Add OPENWEATHER_API_KEY=your_key to your .env file',
          '3. Restart your server'
        ],
        requested: {
          location,
          units,
          include_forecast
        },
        timestamp: new Date().toISOString(),
        available: false
      };
    }
    
    try {
      // Basic weather endpoint
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=${units}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(weatherUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'create-commands-mcp-weather-tool'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new MCPError('UNAUTHORIZED', 'Invalid API key. Check your OPENWEATHER_API_KEY.');
        }
        if (response.status === 404) {
          throw new MCPError('INVALID_PARAMS', `Location "${location}" not found. Try a different city name or coordinates.`);
        }
        throw new Error(`Weather API returned status ${response.status}`);
      }
      
      const weatherData: any = await response.json();
      
      const result: any = {
        location: {
          name: weatherData.name,
          country: weatherData.sys.country,
          coordinates: {
            lat: weatherData.coord.lat,
            lng: weatherData.coord.lon
          }
        },
        current: {
          temperature: Math.round(weatherData.main.temp),
          feels_like: Math.round(weatherData.main.feels_like),
          humidity: weatherData.main.humidity,
          pressure: weatherData.main.pressure,
          description: weatherData.weather[0].description,
          icon: weatherData.weather[0].icon,
          wind: {
            speed: weatherData.wind?.speed || 0,
            direction: weatherData.wind?.deg || 0
          },
          visibility: weatherData.visibility
        },
        units: {
          temperature: units === 'metric' ? '°C' : units === 'imperial' ? '°F' : 'K',
          wind_speed: units === 'metric' ? 'm/s' : 'mph',
          pressure: 'hPa',
          visibility: 'meters'
        },
        timestamp: new Date().toISOString(),
        available: true
      };
      
      // Add forecast if requested
      if (include_forecast) {
        try {
          const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&appid=${apiKey}&units=${units}&cnt=5`;
          const forecastResponse = await fetch(forecastUrl, {
            method: 'GET',
            headers: { 'User-Agent': 'create-commands-mcp-weather-tool' }
          });
          
          if (forecastResponse.ok) {
            const forecastData: any = await forecastResponse.json();
            result.forecast = forecastData.list.map((item: any) => ({
              datetime: item.dt_txt,
              temperature: Math.round(item.main.temp),
              description: item.weather[0].description,
              humidity: item.main.humidity
            }));
          }
        } catch (forecastError) {
          // Forecast is optional, continue without it
          result.forecast_error = 'Forecast data unavailable';
        }
      }
      
      return result;
      
    } catch (error) {
      if (error instanceof MCPError) {
        throw error;
      }
      
      // Network or other errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        error: 'Weather service unavailable',
        message: errorMessage,
        requested: {
          location,
          units,
          include_forecast
        },
        timestamp: new Date().toISOString(),
        available: false,
        suggestion: 'Check your internet connection and API key configuration'
      };
    }
  }
};