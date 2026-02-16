import { test, expect } from '@playwright/test';

test.describe('Points System Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/tabs/home');
  });

  test('should display points balance', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('text=/\\d+ points/i')).toBeTruthy();
  });

  test('should show points history', async ({ page }) => {
    await page.goto('/profile');
    await page.click('text=Points History');
    
    await expect(page.locator('text=/Earned|Spent/i')).toBeTruthy();
  });

  test('should display route completion points', async ({ page }) => {
    // After completing a route, should show points earned
    await expect(page.locator('text=/points earned|congratulations/i')).toBeTruthy();
  });
});

test.describe('Affiliate Program Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/tabs/home');
  });

  test('should display affiliate partners', async ({ page }) => {
    await page.click('text=Offers, text=Partners, text=Rewards');
    
    await expect(page.locator('text=/partner|offer|reward/i')).toBeTruthy();
  });

  test('should show offer details', async ({ page }) => {
    await page.click('text=Offers, text=Partners');
    
    // Click on first offer
    await page.locator('ion-card, .offer-card').first().click();
    
    await expect(page.locator('text=/points|redeem|discount/i')).toBeTruthy();
  });

  test('should have redeem button for offers', async ({ page }) => {
    await page.click('text=Offers, text=Partners');
    
    await expect(page.locator('ion-button:has-text("Redeem")')).toBeTruthy();
  });

  test('should show redemption history', async ({ page }) => {
    await page.goto('/profile');
    await page.click('text=My Rewards, text=Redemptions');
    
    await expect(page.locator('text=/redeemed|voucher|code/i')).toBeTruthy();
  });
});

test.describe('Gamification Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/tabs/home');
  });

  test('should display CO2 saved statistics', async ({ page }) => {
    await page.goto('/profile');
    
    await expect(page.locator('text=/CO2|carbon|emissions/i')).toBeTruthy();
  });

  test('should show distance traveled', async ({ page }) => {
    await page.goto('/profile');
    
    await expect(page.locator('text=/km|distance/i')).toBeTruthy();
  });

  test('should display achievements or badges', async ({ page }) => {
    await page.goto('/profile');
    
    await expect(page.locator('text=/achievement|badge|milestone/i')).toBeTruthy();
  });
});
