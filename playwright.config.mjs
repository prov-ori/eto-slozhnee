import {defineConfig, devices} from '@playwright/test';
const port = process.env.ETO_TEST_PORT || '4173';
const baseURL = 'http://127.0.0.1:' + port + '/eto-slozhnee/';
export default defineConfig({
  testMatch: 'browser.spec.mjs',
  timeout: 90_000,
  workers: 2,
  use: {baseURL, locale:'ru-RU'},
  projects: [
    {name:'mobile-chromium',use:{...devices['Pixel 7'],viewport:{width:360,height:780}}},
    {name:'mobile-webkit',use:{...devices['iPhone 13 Mini'],viewport:{width:320,height:720}}},
    {name:'desktop',use:{...devices['Desktop Chrome'],viewport:{width:1280,height:850}}}
  ],
  webServer: {command:'node test-server.mjs',url:baseURL,reuseExistingServer:false}
});
