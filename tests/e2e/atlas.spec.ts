import { test, expect } from '@playwright/test';
import { revisarAccesibilidad } from './ayuda';
import { readFileSync } from 'node:fs';

// Espera a que la isla del atlas termine de hidratarse antes de interactuar con el mapa.
async function abrirAtlas(page: import('@playwright/test').Page) {
  await page.goto('/atlas');
  await expect(page.locator('astro-island:has(.atlas)')).not.toHaveAttribute('ssr');
}

// Se usa dispatchEvent('click') porque el centro geométrico de un país puede caer en el mar.
test('México abre su artículo y Atrás vuelve al atlas', async ({ page }) => {
  await abrirAtlas(page);
  await page.locator('[data-adm0="MEX"]').dispatchEvent('click');
  await expect(page).toHaveURL(/\/articulo\/mexico$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/atlas$/);
  await expect(page.locator('[data-adm0="MEX"]')).toBeVisible();
});

test('un país sin artículo abre su ficha', async ({ page }) => {
  await abrirAtlas(page);
  const pais = page.locator('[data-tiene-articulo="false"]').first();
  const nombre = (await pais.getAttribute('aria-label'))!;
  await pais.dispatchEvent('click');
  await expect(page).toHaveURL(/\/pais\/[A-Z]{3}$/);
  await expect(page.getByRole('heading', { level: 1, name: nombre })).toBeVisible();
  await expect(page.getByText('Continente', { exact: true })).toBeVisible();
});

test('se abre un país con el teclado', async ({ page }) => {
  await abrirAtlas(page);
  await page.locator('[data-adm0="MEX"]').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/articulo\/mexico$/);
});

test('los botones de continente acercan el mapa', async ({ page }) => {
  await abrirAtlas(page);
  const mapa = page.getByRole('group', { name: 'Mapa del mundo' });
  await expect(mapa).toHaveAttribute('viewBox', '0 0 960 500');
  await page.getByRole('button', { name: 'Europa' }).click();
  await expect(mapa).not.toHaveAttribute('viewBox', '0 0 960 500');
});

test('el atlas no tiene problemas graves de accesibilidad', async ({ page }) => {
  await abrirAtlas(page);
  await revisarAccesibilidad(page);
});

test('?vista=africa abre el atlas acercado a África', async ({ page }) => {
  const vistas = JSON.parse(readFileSync('src/data/atlas/vistas.json', 'utf8')) as Record<string, number[]>;
  await page.goto('/atlas?vista=africa');
  await expect(page.locator('astro-island:has(.atlas)')).not.toHaveAttribute('ssr');
  await expect(page.getByRole('group', { name: 'Mapa del mundo' })).toHaveAttribute('viewBox', vistas.africa.join(' '));
});

test('una vista desconocida muestra el mundo', async ({ page }) => {
  await page.goto('/atlas?vista=marte');
  await expect(page.locator('astro-island:has(.atlas)')).not.toHaveAttribute('ssr');
  await expect(page.getByRole('group', { name: 'Mapa del mundo' })).toHaveAttribute('viewBox', '0 0 960 500');
});
