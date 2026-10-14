import { test, expect } from '@playwright/test';
import { MENSAJES } from '../../src/lib/guia';

test('Lumi habla según la pantalla y persiste al navegar', async ({ page }) => {
  await page.goto('/');
  const globo = page.locator('#globo-guia');
  await expect(globo).not.toBeEmpty();
  expect(MENSAJES.inicio).toContain(await globo.textContent());
  await page.evaluate(() => {
    (window as unknown as { guia: Element | null }).guia = document.querySelector('.guia');
  });
  await page.getByRole('navigation', { name: 'Barra de herramientas' }).getByRole('link', { name: 'Acerca de' }).click();
  await expect(page).toHaveURL(/\/acerca$/);
  await expect(globo).toHaveText(MENSAJES.acerca[0]);
  expect(await page.evaluate(() => (window as unknown as { guia: Element | null }).guia === document.querySelector('.guia'))).toBe(true);
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
