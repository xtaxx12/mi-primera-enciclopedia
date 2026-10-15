import { test, expect } from '@playwright/test';
import { revisarAccesibilidad } from './ayuda';

test('la categoría muestra su primera subcategoría y sus temas', async ({ page }) => {
  await page.goto('/categoria/animales');
  await expect(page.getByRole('heading', { level: 1, name: 'Animales' })).toBeVisible();
  const menu = page.getByRole('navigation', { name: 'Subcategorías de Animales' });
  await expect(menu.getByRole('link')).toHaveText(['Mamíferos', 'Aves', 'Reptiles y dinosaurios', 'Animales del mar', 'Insectos']);
  await expect(menu.getByRole('link', { name: 'Mamíferos' })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.celda-tema')).toHaveText(['León', 'Elefante', 'Ballena', 'Delfín', 'Gato', 'Perro', 'Lobo', 'Ornitorrinco']);
});

test('otra subcategoría muestra sus propios temas', async ({ page }) => {
  await page.goto('/categoria/animales/aves');
  await expect(page.getByRole('navigation', { name: 'Subcategorías de Animales' }).getByRole('link', { name: 'Aves' })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.celda-tema')).toHaveText(['Guacamayo', 'Pingüino']);
});

test('un artículo sin foto usa el ícono de su subcategoría', async ({ page }) => {
  await page.goto('/categoria/animales');
  await expect(page.locator('.celda-tema', { hasText: 'Lobo' }).locator('.vacia img')).toHaveAttribute('src', '/iconos/1F418.svg');
});

test('una subcategoría inexistente da 404', async ({ page }) => {
  const respuesta = await page.goto('/categoria/animales/no-existe');
  expect(respuesta?.status()).toBe(404);
});

test('de la cuadrícula al artículo y Atrás', async ({ page }) => {
  await page.goto('/categoria/animales');
  await page.locator('.celda-tema', { hasText: 'León' }).click();
  await expect(page).toHaveURL(/\/articulo\/leon$/);
  await page.getByRole('button', { name: 'Atrás' }).click();
  await expect(page).toHaveURL(/\/categoria\/animales$/);
});

test('la categoría no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/categoria/animales/aves');
  await revisarAccesibilidad(page);
});

test.describe('en celular', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('las subcategorías van en una fila', async ({ page }) => {
    await page.goto('/categoria/animales');
    const caja = await page.getByRole('navigation', { name: 'Subcategorías de Animales' }).boundingBox();
    expect(caja!.height).toBeLessThan(90);
  });
});
