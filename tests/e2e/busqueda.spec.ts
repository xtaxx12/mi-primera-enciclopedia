import { test, expect } from '@playwright/test';
import { revisarAccesibilidad } from './ayuda';

const campoDeLaBarra = (page: import('@playwright/test').Page) =>
  page.getByRole('navigation', { name: 'Barra de herramientas' }).getByRole('combobox');

test('el autocompletado lleva al artículo elegido', async ({ page }) => {
  await page.goto('/');
  const campo = campoDeLaBarra(page);
  await campo.click();
  await campo.fill('mexi');
  await expect(page.getByRole('option', { name: 'México' })).toBeVisible();
  await campo.press('ArrowDown');
  await expect(page.getByRole('option', { name: 'México' })).toHaveAttribute('aria-selected', 'true');
  await campo.press('Enter');
  await expect(page).toHaveURL(/\/articulo\/mexico$/);
});

test('Enter sin elegir abre los resultados con el término resaltado', async ({ page }) => {
  await page.goto('/');
  const campo = campoDeLaBarra(page);
  await campo.click();
  await campo.fill('mexico');
  await campo.press('Enter');
  await expect(page).toHaveURL(/\/buscar\?q=mexico$/);
  await expect(page.locator('.resultados li').first()).toBeVisible();
  await expect(page.locator('.resultados mark').first()).toHaveText('México');
});

test('sin resultados muestra el aviso y las categorías', async ({ page }) => {
  await page.goto('/buscar?q=zzzzqqq');
  await expect(page.getByText('No encontré nada para «zzzzqqq»')).toBeVisible();
  await expect(page.locator('.categorias-sugeridas a')).toHaveCount(8);
  await expect(page.locator('#globo-guia')).toContainText('no encontré nada');
});

test('la búsqueda no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/buscar?q=mexico');
  await expect(page.locator('.resultados li').first()).toBeVisible();
  await revisarAccesibilidad(page);
});
