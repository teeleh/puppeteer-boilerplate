const express = require("express");

import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export default defineComponent({
  async run({ steps, $ }) {
    // Launch a headless browser
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    try {
      // Open a new page
      const page = await browser.newPage();
      
      // Set user agent to avoid bot detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to Finst.com USDC page
      await page.goto('https://app.finst.com/assets/USDC?chartType=line&chartDuration=P1W', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Wait for the rate element to appear (adjust timeout as needed)
      await page.waitForSelector('.gtekqm5J', { timeout: 15000 });
      
      // Extract the rate text
      const rateText = await page.evaluate(() => {
        const element = document.querySelector('.gtekqm5J');
        return element ? element.textContent : null;
      });
      
      // Process the rate text
      if (rateText) {
        // Remove euro symbol and non-breaking spaces
        let cleanRate = rateText.replace(/€/g, '').replace(/\u00A0/g, '').trim();
        
        // Replace comma with period
        cleanRate = cleanRate.replace(',', '.');
        
        // Convert to number
        const numericRate = parseFloat(cleanRate);
        
        // Return the formatted result
        return {
          success: true,
          rate: numericRate,
          rateFormatted: numericRate.toFixed(5),
          source: "Finst.com",
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error('Rate element not found on page');
      }
    } catch (error) {
      console.error('Scraping error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    } finally {
      // Always close the browser
      await browser.close();
    }
  }
});
