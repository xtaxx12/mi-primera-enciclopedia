import { test, expect } from '@playwright/test';
import { revisarAccesibilidad } from './ayuda';

test('se juega un cuestionario completo y el nombre se guarda como texto', async ({ page }) => {
  await page.goto('/juegos');
  await expect(page.locator('.juego')).toHaveCount(8);
  await page.locator('.juego').first().click();
  await expect(page).toHaveURL(/\/juegos\/cuestionario\/[a-z-]+$/);

  for (let i = 1; i <= 10; i++) {
    await expect(page.getByText(`Pregunta ${i} de 10`)).toBeVisible();
    await page.locator('.opcion').first().click();
    await expect(page.locator('.explicacion')).toBeVisible();
    await expect(page.locator('.opcion').first()).toBeDisabled();
    await page.getByRole('button', { name: i === 10 ? 'Ver resultado' : 'Siguiente' }).click();
  }

  await expect(page.getByRole('heading', { name: '¡Terminaste!' })).toBeVisible();
  await expect(page.locator('.estrellas')).toContainText('de 3 estrellas');
  await page.getByLabel('¡Entraste en la tabla! Escribe tu nombre:').fill('<b>Ana</b>');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('.tabla-puntajes')).toContainText('<b>Ana</b>');
  await expect(page.locator('.tabla-puntajes b')).toHaveCount(0);
});

test('Jugar otra vez reinicia el cuestionario', async ({ page }) => {
  await page.goto('/juegos');
  await page.locator('.juego').first().click();
  for (let i = 1; i <= 10; i++) {
    await page.locator('.opcion').first().click();
    await page.getByRole('button', { name: i === 10 ? 'Ver resultado' : 'Siguiente' }).click();
  }
  await page.getByRole('button', { name: 'Jugar otra vez' }).click();
  await expect(page.getByText('Pregunta 1 de 10')).toBeVisible();
});

test('el cuestionario no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/juegos');
  await page.locator('.juego').first().click();
  await expect(page.locator('.opcion').first()).toBeVisible();
  await revisarAccesibilidad(page);
});

test('la imagen de cada pregunta muestra autor, licencia y enlace a Commons', async ({ page }) => {
  await page.goto('/juegos');
  await page.locator('.juego').first().click();
  const credito = page.locator('.credito');
  await expect(credito).toBeVisible();
  await expect(credito).toContainText(/CC BY-SA|CC BY|CC0|Dominio público/);
  await expect(credito.getByRole('link').first()).toHaveAttribute('href', /^https:\/\/commons\.wikimedia\.org\//);
});
