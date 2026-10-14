import { test, expect } from '@playwright/test';
import { revisarAccesibilidad } from './ayuda';

test('Inicio muestra la ventana y las 8 categorías', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.barra-titulo')).toContainText('Mi Primera Enciclopedia');
  await expect(page.getByRole('navigation', { name: 'Barra de herramientas' })).toBeVisible();
  await expect(page.locator('.mosaico')).toHaveCount(8);
  await expect(page.locator('#dato-curioso')).not.toBeEmpty();
});

test('Acerca de muestra el aviso de homenaje y las licencias', async ({ page }) => {
  await page.goto('/acerca');
  await expect(page.getByText('Homenaje a Mi Primera Encarta (2009). Proyecto no afiliado a Microsoft.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'CC BY-SA 3.0' })).toBeVisible();
});

test('una ruta inexistente muestra la página 404', async ({ page }) => {
  const respuesta = await page.goto('/no-existe');
  expect(respuesta?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: '¡Ups! Esta página se perdió' })).toBeVisible();
});

test('Inicio no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/');
  await revisarAccesibilidad(page);
});

test.describe('en celular', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('oculta la barra de título y lleva la barra de herramientas abajo', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.barra-titulo')).toBeHidden();
    const caja = await page.locator('.barra-herramientas').boundingBox();
    expect(caja!.y + caja!.height).toBeGreaterThan(800);
    await expect(page.getByRole('link', { name: 'Buscar' })).toBeVisible();
  });
});
