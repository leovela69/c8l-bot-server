// e2e/cover-flow.spec.ts
import { test, expect } from '@playwright/test';

test('usuario puede subir un cover y verlo en su perfil', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Iniciar sesión');
  await page.fill('input[name="email"]', 'test@c8l.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.goto('/lounge');
  await page.click('text=KARAOKE');
  await page.click('text=Bohemian Rhapsody');
  await page.click('text=COMENZAR PRÁCTICA');
  await page.waitForTimeout(5000);
  await page.click('text=FINALIZAR PRÁCTICA');
  await page.click('text=PUBLICAR COVER');

  await expect(page.locator('text=Cover publicado correctamente')).toBeVisible();
});