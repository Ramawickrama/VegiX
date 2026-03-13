const cron = require('node-cron');
const forecastService = require('../services/forecastService');
const marketPriceService = require('../services/marketPriceService');

const startForecastScheduler = () => {
  console.log('[Scheduler] Forecast scheduler initialized');

  cron.schedule('0 0 * * *', async () => {
    console.log('[Scheduler] Running daily forecast generation at midnight...');
    try {
      if (typeof forecastService.generateDemoDataIfEmpty === 'function') {
        await forecastService.generateDemoDataIfEmpty();
      }
      await forecastService.generateAllForecasts();
      console.log('[Scheduler] Daily forecast generation completed successfully');
    } catch (error) {
      console.error('[Scheduler] Error running daily forecast:', error.message);
    }
  });

  console.log('[Scheduler] Scheduled: Daily forecast at midnight (00:00)');
};

const startMarketPriceScheduler = () => {
  console.log('[Scheduler] Market price scheduler initialized');

  cron.schedule('*/30 * * * *', async () => {
    console.log('[Scheduler] Running market price fetch (every 30 minutes)...');
    try {
      await marketPriceService.fetchMarketPrices();
      console.log('[Scheduler] Market price fetch completed successfully');
    } catch (error) {
      console.error('[Scheduler] Error fetching market prices:', error);
    }
  });

  console.log('[Scheduler] Scheduled: Market prices every 30 minutes');
};

const runInitialForecast = async () => {
  console.log('[Scheduler] Running initial forecast generation...');
  try {
    if (typeof forecastService.generateDemoDataIfEmpty === 'function') {
      await forecastService.generateDemoDataIfEmpty();
    } else {
      console.warn('[Scheduler] forecastService.generateDemoDataIfEmpty not available — skipping demo generation');
    }
    await forecastService.generateAllForecasts();
    console.log('[Scheduler] Initial forecast generation completed');
  } catch (error) {
    console.error('[Scheduler] Error running initial forecast:', error.message);
  }
};

const runInitialMarketPrices = async () => {
  console.log('[Scheduler] Running initial market prices fetch...');
  try {
    await marketPriceService.fetchMarketPrices();
    console.log('[Scheduler] Initial market prices fetch completed');
  } catch (error) {
    console.error('[Scheduler] Error running initial market prices:', error);
  }
};

module.exports = { 
  startForecastScheduler, 
  startMarketPriceScheduler,
  runInitialForecast, 
  runInitialMarketPrices 
};
