import { test, expect } from '@playwright/test';
import { revisarAccesibilidad } from './ayuda';

test('Contempla las imágenes abre la galería y Lee el artículo vuelve', async ({ page }) => {
  await page.goto('/articulo/leon');
  await page.getByRole('link', { name: /Contempla las imágenes/ }).click();
  await expect(page).toHaveURL(/\/articulo\/leon\/imagenes$/);
  await expect(page.locator('#medio-1')).toBeVisible();
  await expect(page.locator('#medio-2')).toBeHidden();
  await page.getByRole('link', { name: /Lee el artículo/ }).click();
  await expect(page).toHaveURL(/\/articulo\/leon$/);
});

test('elegir otro recuadro lo muestra grande', async ({ page }) => {
  await page.goto('/articulo/leon/imagenes');
  await page.locator('.tira .recuadro').nth(1).click();
  await expect(page).toHaveURL(/#medio-2$/);
  await expect(page.locator('#medio-2')).toBeVisible();
  await expect(page.locator('#medio-1')).toBeHidden();
});

test('al abrir con un ancla se ve ese medio', async ({ page }) => {
  await page.goto('/articulo/leon/imagenes#medio-2');
  await expect(page.locator('#medio-2')).toBeVisible();
  await expect(page.locator('#medio-1')).toBeHidden();
});

test('el recuadro del artículo abre su medio en la galería', async ({ page }) => {
  await page.goto('/articulo/leon');
  await page.locator('.recuadro').nth(1).click();
  await expect(page).toHaveURL(/\/articulo\/leon\/imagenes#medio-2$/);
  await expect(page.locator('#medio-2')).toBeVisible();
});

test('cada medio muestra su autor y licencia', async ({ page }) => {
  await page.goto('/articulo/leon/imagenes');
  const pie = page.locator('#medio-1 figcaption');
  await expect(pie).toContainText(/CC BY-SA|CC BY|CC0|Dominio público/);
  await expect(pie.getByRole('link')).toHaveAttribute('href', /^https:\/\/commons\.wikimedia\.org\//);
});

test('un artículo sin imágenes no tiene galería', async ({ page }) => {
  const respuesta = await page.goto('/articulo/lobo/imagenes');
  expect(respuesta?.status()).toBe(404);
});

test('la galería no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/articulo/leon/imagenes');
  await revisarAccesibilidad(page);
});
