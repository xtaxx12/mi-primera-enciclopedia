import { test, expect } from '@playwright/test';
import { revisarAccesibilidad } from './ayuda';

test('de Inicio a una categoría y a un artículo sin recargar la ventana', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    (window as unknown as { barra: Element | null }).barra = document.querySelector('.barra-herramientas');
  });
  await page.locator('.mosaico', { hasText: 'Animales' }).click();
  await expect(page).toHaveURL(/\/categoria\/animales$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Animales' })).toBeVisible();

  const primera = page.locator('.tarjeta').first();
  const titulo = (await primera.locator('.titulo').textContent())!.trim();
  await primera.click();
  await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible();
  await expect(page.locator('.atribucion')).toContainText('de Vikidia');
  await expect(page.locator('.atribucion')).toContainText('CC BY-SA 3.0');
  expect(
    await page.evaluate(() => (window as unknown as { barra: Element | null }).barra === document.querySelector('.barra-herramientas')),
  ).toBe(true);

  await page.getByRole('button', { name: 'Atrás' }).click();
  await expect(page).toHaveURL(/\/categoria\/animales$/);
});

test('el artículo de México muestra texto, imagen principal y relacionados', async ({ page }) => {
  await page.goto('/articulo/mexico');
  await expect(page.locator('.texto-articulo p').first()).not.toBeEmpty();
  await expect(page.locator('.principal img')).toBeVisible();
  await expect(page.locator('.relacionados li').first()).toBeVisible();
});

test('el artículo no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/articulo/mexico');
  await revisarAccesibilidad(page);
});
