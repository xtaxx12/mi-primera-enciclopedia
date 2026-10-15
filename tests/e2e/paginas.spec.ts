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

test.describe('títulos naranjas sobre las curvas, en celular', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const ruta of ['/categoria/ciencia-y-tecnologia', '/juegos', '/juegos/cuestionario/animales', '/articulo/sistema-solar/imagenes', '/articulo/wolfgang-amadeus-mozart']) {
    test(`el título de ${ruta} va sobre fondo blanco`, async ({ page }) => {
      await page.goto(ruta);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    });
  }

  test('el título de los resultados de búsqueda va sobre fondo blanco', async ({ page }) => {
    await page.goto('/buscar?q=sol');
    await expect(page.locator('.titulo-resultados')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  });
});
