import { test, expect } from '@playwright/test';
import { revisarAccesibilidad } from './ayuda';

const barra = (page: import('@playwright/test').Page) => page.getByRole('navigation', { name: 'Barra de herramientas' });

test('la barra verde está en todas las páginas y persiste al navegar', async ({ page }) => {
  await page.goto('/acerca');
  await expect(page.locator('header.barra')).toBeVisible();
  await page.evaluate(() => {
    (window as unknown as { barra: Element | null }).barra = document.querySelector('header.barra');
  });
  await barra(page).getByRole('link', { name: 'Inicio' }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => (window as unknown as { barra: Element | null }).barra === document.querySelector('header.barra'))).toBe(true);
});

test('Atrás vuelve a la página anterior', async ({ page }) => {
  await page.goto('/');
  await barra(page).getByRole('link', { name: 'Acerca de' }).click();
  await expect(page).toHaveURL(/\/acerca$/);
  await barra(page).getByRole('button', { name: 'Atrás' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('el botón de sonido recuerda la preferencia', async ({ page }) => {
  await page.goto('/');
  const boton = page.getByRole('button', { name: 'Sonido' });
  await expect(boton).toHaveAttribute('aria-pressed', 'true');
  await boton.click();
  await expect(boton).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sonido' })).toHaveAttribute('aria-pressed', 'false');
});

test('ya no hay ventana estilo Vista ni personaje guía', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.barra-titulo')).toHaveCount(0);
  await expect(page.locator('.guia')).toHaveCount(0);
});

test('la barra no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/acerca');
  await revisarAccesibilidad(page);
});

test.describe('en celular', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('la lupa despliega el buscador', async ({ page }) => {
    await page.goto('/');
    const campo = barra(page).getByRole('combobox');
    await expect(campo).toBeHidden();
    await barra(page).getByRole('button', { name: 'Mostrar el buscador' }).click();
    await expect(campo).toBeVisible();
    await expect(campo).toBeFocused();
  });

  test('sin JavaScript el buscador se ve siempre', async ({ browser }) => {
    const contexto = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const pagina = await contexto.newPage();
    await pagina.goto('/');
    await expect(barra(pagina).getByRole('combobox')).toBeVisible();
    await contexto.close();
  });
});
