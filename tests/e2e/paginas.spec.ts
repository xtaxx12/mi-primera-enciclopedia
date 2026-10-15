import { test, expect } from '@playwright/test';
import { revisarAccesibilidad } from './ayuda';

test('Acerca de no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/acerca');
  await expect(page.getByRole('heading', { level: 1 })).toHaveClass(/titulo-articulo/);
  await revisarAccesibilidad(page);
});

test('la 404 no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/no-existe');
  await expect(page.getByRole('link', { name: 'Ir a Inicio' })).toHaveClass(/boton/);
  await revisarAccesibilidad(page);
});

test('la ficha de un país sin artículo no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/pais/RUS');
  await expect(page.getByRole('heading', { level: 1 })).toHaveClass(/titulo-articulo/);
  await expect(page.getByRole('link', { name: 'Volver al atlas' })).toBeVisible();
  await revisarAccesibilidad(page);
});
