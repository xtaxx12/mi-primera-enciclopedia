import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export async function revisarAccesibilidad(page: Page): Promise<void> {
  const resultado = await new AxeBuilder({ page }).analyze();
  const graves = resultado.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(graves.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
}
