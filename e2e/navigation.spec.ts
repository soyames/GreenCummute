import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Skip auth for navigation tests - would need to mock Firebase auth
    await page.goto('/tabs/home');
  });

  test('should display tabs navigation', async ({ page }) => {
    await expect(page.locator('ion-tab-bar')).toBeVisible();
  });

  test('should navigate between tabs', async ({ page }) => {
    // Navigate to home tab
    await page.click('ion-tab-button[tab="home"]');
    await expect(page).toHaveURL(/.*tabs\/home/);
    
    // Navigate to feeds tab
    await page.click('ion-tab-button[tab="feeds"]');
    await expect(page).toHaveURL(/.*tabs\/feeds/);
    
    // Navigate to profile tab
    await page.click('ion-tab-button[tab="profile"]');
    await expect(page).toHaveURL(/.*tabs\/profile/);
  });

  test('should have proper back navigation', async ({ page }) => {
    await page.goto('/tabs/home');
    await page.goto('/profile');
    
    await page.click('ion-back-button');
    await expect(page).toHaveURL(/.*tabs\/home/);
  });
});

test.describe('Route Search Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/tabs/home');
  });

  test('should have route search inputs', async ({ page }) => {
    // Assuming home page has route search
    await expect(page.locator('text=From')).toBeVisible();
    await expect(page.locator('text=To')).toBeVisible();
  });

  test('should display current location button', async ({ page }) => {
    await expect(page.locator('ion-button:has(ion-icon[name="locate"])')).toBeVisible();
  });
});
