import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { revisarAccesibilidad } from './ayuda';

const explicacionesLeon = (
  JSON.parse(readFileSync('src/content/cuestionarios/animales.json', 'utf8')) as { preguntas: { articulo: string; explicacion: string }[] }
).preguntas
  .filter((p) => p.articulo === 'leon')
  .map((p) => p.explicacion);

test('de la categoría al artículo sin recargar la barra', async ({ page }) => {
  await page.goto('/categoria/animales');
  await page.evaluate(() => {
    (window as unknown as { barra: Element | null }).barra = document.querySelector('header.barra');
  });
  await page.locator('.celda-tema', { hasText: 'León' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'León' })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { barra: Element | null }).barra === document.querySelector('header.barra'))).toBe(true);
});

test('el artículo muestra texto, recuadros, dato curioso, relacionados y prueba', async ({ page }) => {
  await page.goto('/articulo/leon');
  await expect(page.locator('.miga')).toContainText('Animales');
  await expect(page.locator('.miga')).toContainText('Mamíferos');
  await expect(page.locator('.texto-articulo p').first()).not.toBeEmpty();
  await expect(page.locator('.recuadro')).toHaveCount(2);
  await expect(page.getByRole('link', { name: /Contempla las imágenes/ })).toHaveAttribute('href', '/articulo/leon/imagenes');
  const dato = (await page.locator('.sabias-que p').textContent())!.trim();
  expect(explicacionesLeon).toContain(dato);
  await expect(page.locator('.relacionados a')).toHaveText(['India', 'México', 'Abeja']);
  await expect(page.getByRole('link', { name: /Pon a prueba lo que sabes/ })).toHaveAttribute('href', '/juegos/cuestionario/animales');
  await expect(page.locator('.atribucion')).toContainText('de Vikidia');
  await expect(page.locator('.atribucion')).toContainText('CC BY-SA 3.0');
});

test('un artículo sin imágenes no ofrece la vista de imágenes', async ({ page }) => {
  await page.goto('/articulo/lobo');
  await expect(page.getByRole('heading', { level: 1, name: 'Lobo' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Contempla las imágenes/ })).toHaveCount(0);
  await expect(page.locator('.recuadro')).toHaveCount(0);
});

test('el artículo no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/articulo/mexico');
  await revisarAccesibilidad(page);
});

test.describe('en celular', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('las imágenes van debajo del texto', async ({ page }) => {
    await page.goto('/articulo/leon');
    const texto = await page.locator('.texto-articulo').boundingBox();
    const lateral = await page.locator('.lateral').boundingBox();
    expect(lateral!.y).toBeGreaterThan(texto!.y);
  });
});
