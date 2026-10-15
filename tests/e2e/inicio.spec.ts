import { test, expect, type Page } from '@playwright/test';
import { revisarAccesibilidad } from './ayuda';

/** Espera a que el script del inicio convierta las placas en botones. */
async function abrirInicio(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Animales' })).toHaveAttribute('aria-expanded', 'false');
}

test('Inicio muestra las 10 placas en dos columnas', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.placa-inicio')).toHaveCount(10);
  await expect(page.locator('.columna.izquierda .placa-inicio')).toHaveText(['Animales', 'Planeta Tierra', 'Espacio', 'Cuerpo humano', 'Historia']);
  await expect(page.locator('.columna.derecha .placa-inicio')).toHaveText(['Arte y música', 'Ciencia y tecnología', 'Países', 'Atlas', 'Juega y aprende']);
  await expect(page.getByRole('heading', { level: 1, name: 'Mi Primera Enciclopedia' })).toBeVisible();
});

test('clic en una placa abre el panel con sus subcategorías', async ({ page }) => {
  await abrirInicio(page);
  const animales = page.getByRole('button', { name: 'Animales' });
  await animales.click();
  await expect(animales).toHaveAttribute('aria-expanded', 'true');
  const panel = page.locator('#panel-placas');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('link')).toHaveText(['Mamíferos', 'Aves', 'Reptiles y dinosaurios', 'Animales del mar', 'Insectos']);
  await panel.getByRole('link', { name: 'Aves' }).click();
  await expect(page).toHaveURL(/\/categoria\/animales\/aves$/);
});

test('otra placa cambia el panel y solo una queda abierta', async ({ page }) => {
  await abrirInicio(page);
  await page.getByRole('button', { name: 'Animales' }).click();
  await page.getByRole('button', { name: 'Atlas' }).click();
  await expect(page.locator('.placa-inicio[aria-expanded="true"]')).toHaveCount(1);
  await expect(page.locator('#panel-placas').getByRole('link').first()).toHaveText('Mundo');
});

test('con el teclado: Enter abre el panel y Escape lo cierra', async ({ page }) => {
  await abrirInicio(page);
  const espacio = page.getByRole('button', { name: 'Espacio' });
  await espacio.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#panel-placas').getByRole('link', { name: 'Sistema solar' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#panel-placas')).toBeHidden();
  await expect(espacio).toBeFocused();
});

test('al volver al inicio con Atrás se puede abrir otra placa', async ({ page }) => {
  await abrirInicio(page);
  await page.getByRole('button', { name: 'Animales' }).click();
  await page.locator('#panel-placas').getByRole('link', { name: 'Aves' }).click();
  await expect(page).toHaveURL(/\/categoria\/animales\/aves$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#panel-placas')).toBeHidden();
  await page.getByRole('button', { name: 'Espacio' }).click();
  await expect(page.locator('.placa-inicio[aria-expanded="true"]')).toHaveCount(1);
  await expect(page.locator('#panel-placas').getByRole('link').first()).toHaveText('Sistema solar');
});

test('al pasar a celular con el panel abierto, la placa lleva a su categoría', async ({ page }) => {
  await abrirInicio(page);
  await page.getByRole('button', { name: 'Animales' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#panel-placas')).toBeHidden();
  await page.getByRole('link', { name: 'Planeta Tierra' }).click();
  await expect(page).toHaveURL(/\/categoria\/planeta-tierra$/);
});

test('al pasar el mouse, la voz dice el nombre después del primer clic', async ({ page }) => {
  await page.addInitScript(() => {
    const dichas: string[] = [];
    (window as unknown as { dichas: string[] }).dichas = dichas;
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => [{ lang: 'es-ES', name: 'Prueba' }],
        cancel() {},
        speak(f: { text: string }) {
          dichas.push(f.text);
        },
      },
    });
  });
  await abrirInicio(page);
  await page.mouse.click(4, 400);
  await page.getByRole('button', { name: 'Espacio' }).hover();
  await expect.poll(() => page.evaluate(() => (window as unknown as { dichas: string[] }).dichas)).toContain('Espacio');
});

test('sin JavaScript la placa lleva a su categoría', async ({ browser }) => {
  const contexto = await browser.newContext({ javaScriptEnabled: false });
  const pagina = await contexto.newPage();
  await pagina.goto('/');
  await pagina.getByRole('link', { name: 'Animales' }).click();
  await expect(pagina).toHaveURL(/\/categoria\/animales$/);
  await contexto.close();
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

test('Inicio no tiene problemas graves de accesibilidad, cerrado y abierto', async ({ page }) => {
  await abrirInicio(page);
  await revisarAccesibilidad(page);
  await page.getByRole('button', { name: 'Historia' }).click();
  await revisarAccesibilidad(page);
});

test.describe('en celular', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('las placas van en una columna y llevan directo a la categoría', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#panel-placas')).toBeHidden();
    const animales = page.getByRole('link', { name: 'Animales' });
    await expect(animales).not.toHaveAttribute('role', 'button');
    await animales.click();
    await expect(page).toHaveURL(/\/categoria\/animales$/);
  });
});
