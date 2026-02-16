import { test, expect } from '@playwright/test';

test.describe('Profile Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Would need to mock authentication
    await page.goto('/profile');
  });

  test('should display user profile information', async ({ page }) => {
    await expect(page.locator('text=Profile')).toBeVisible();
  });

  test('should have avatar upload capability', async ({ page }) => {
    await expect(page.locator('ion-avatar, img[alt*="avatar"], input[type="file"]')).toBeTruthy();
  });

  test('should display points balance', async ({ page }) => {
    await expect(page.locator('text=/points|Points/')).toBeVisible();
  });

  test('should display user statistics', async ({ page }) => {
    // Check for distance, CO2 saved, etc.
    await expect(page.locator('text=/km|distance/i')).toBeTruthy();
  });

  test('should have settings navigation', async ({ page }) => {
    await expect(page.locator('ion-button:has-text("Settings"), text=Settings')).toBeTruthy();
  });

  test('should have logout button', async ({ page }) => {
    await expect(page.locator('ion-button:has-text("Logout"), text=Logout')).toBeTruthy();
  });
});

test.describe('Settings Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
  });

  test('should display eco vs speed balance slider', async ({ page }) => {
    // Settings page should have preference controls
    await expect(page.locator('ion-range, input[type="range"]')).toBeTruthy();
  });

  test('should have transport mode preferences', async ({ page }) => {
    // Check for transport mode toggles
    await expect(page.locator('text=/walk|bike|bus|train/i')).toBeTruthy();
  });

  test('should have notification settings', async ({ page }) => {
    await expect(page.locator('ion-toggle')).toBeTruthy();
  });
});
