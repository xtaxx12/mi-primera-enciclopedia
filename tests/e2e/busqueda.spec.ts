import { test, expect } from '@playwright/test';
import { revisarAccesibilidad } from './ayuda';

const campoDeLaBarra = (page: import('@playwright/test').Page) =>
  page.getByRole('navigation', { name: 'Barra de herramientas' }).getByRole('combobox');

test('el autocompletado lleva al artículo elegido', async ({ page }) => {
  await page.goto('/');
  const campo = campoDeLaBarra(page);
  await campo.click();
  await campo.fill('mexi');
  await expect(page.getByRole('option', { name: 'México' })).toBeVisible();
  await campo.press('ArrowDown');
  await expect(page.getByRole('option', { name: 'México' })).toHaveAttribute('aria-selected', 'true');
  await campo.press('Enter');
  await expect(page).toHaveURL(/\/articulo\/mexico$/);
});

test('Enter sin elegir abre los resultados con el término resaltado', async ({ page }) => {
  await page.goto('/');
  const campo = campoDeLaBarra(page);
  await campo.click();
  await campo.fill('mexico');
  await campo.press('Enter');
  await expect(page).toHaveURL(/\/buscar\?q=mexico$/);
  await expect(page.locator('.resultados li').first()).toBeVisible();
  await expect(page.locator('.resultados mark').first()).toHaveText('México');
  await expect(page.getByRole('heading', { name: 'Resultados para «mexico»' })).toBeVisible();
  await expect(page.locator('.resultados li .miniatura').first()).toBeVisible();
});

test('sin resultados muestra el aviso y las categorías', async ({ page }) => {
  await page.goto('/buscar?q=zzzzqqq');
  await expect(page.getByText('No encontré nada para «zzzzqqq»')).toBeVisible();
  await expect(page.locator('.categorias-sugeridas a')).toHaveCount(8);
});

test('la búsqueda no tiene problemas graves de accesibilidad', async ({ page }) => {
  await page.goto('/buscar?q=mexico');
  await expect(page.locator('.resultados li').first()).toBeVisible();
  await revisarAccesibilidad(page);
});

test('lo escrito antes de que cargue el buscador no se pierde', async ({ page }) => {
  let soltar = () => {};
  const retenido = new Promise<void>((r) => (soltar = r));
  await page.route(/\/Buscador\.[^/]*\.js$/, async (ruta) => {
    await retenido;
    await ruta.continue();
  });
  await page.goto('/');
  const campo = campoDeLaBarra(page);
  await campo.click();
  await campo.fill('mexico');
  soltar();
  await expect(page.locator('astro-island:has(.buscador-barra)')).not.toHaveAttribute('ssr');
  await expect(page.getByRole('option', { name: 'México' })).toBeVisible();
  await campo.press('Enter');
  await expect(page).toHaveURL(/\/buscar\?q=mexico$/);
});

test('sin JavaScript, Enter lleva a los resultados', async ({ browser }) => {
  const contexto = await browser.newContext({ javaScriptEnabled: false });
  const pagina = await contexto.newPage();
  await pagina.goto('/');
  const campo = campoDeLaBarra(pagina);
  await campo.fill('mexico');
  await campo.press('Enter');
  await expect(pagina).toHaveURL(/\/buscar\?q=mexico$/);
  await contexto.close();
});
