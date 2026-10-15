import { defineConfig, devices } from '@playwright/test';

// Puerto propio: así las pruebas siempre usan el build de producción y no un `astro dev` abierto en el 4321.
const PUERTO = 4329;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: `http://localhost:${PUERTO}` },
  webServer: {
    // node directo y --ignore-lock: Astro 7 manda preview a segundo plano si detecta un agente, y Playwright no podría cerrarlo.
    command: `npm run build && node node_modules/astro/bin/astro.mjs preview --port ${PUERTO} --ignore-lock`,
    url: `http://localhost:${PUERTO}`,
    // Nunca reutilizar: un servidor viejo haría probar un build desactualizado.
    reuseExistingServer: false,
    timeout: 300_000,
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 820, height: 1180 }, hasTouch: true } },
  ],
});
