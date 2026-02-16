import { test, expect } from '@playwright/test';

test.describe('Authentication Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page on initial load', async ({ page }) => {
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('ion-button:has-text("Login")')).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.click('text=Register');
    await expect(page).toHaveURL(/.*registration/);
    await expect(page.locator('ion-card-title:has-text("Register")')).toBeVisible();
  });

  test('should navigate to login screen from login page', async ({ page }) => {
    await page.goto('/login');
    // Assuming there's a way to navigate to loginscreen from login page
    await page.click('text=Login');
    await expect(page).toHaveURL(/.*loginscreen/);
  });

  test('should show validation errors on empty email/password login', async ({ page }) => {
    await page.goto('/loginscreen');
    await page.click('ion-button[type="submit"]');
    // Form should prevent submission or show errors
    await expect(page.locator('ion-button[type="submit"]')).toBeDisabled();
  });

  test('should enable login button when form is valid', async ({ page }) => {
    await page.goto('/loginscreen');
    
    // Fill in email and password
    await page.fill('ion-input[formControlName="email"] input', 'test@example.com');
    await page.fill('ion-input[formControlName="password"] input', 'password123');
    
    // Button should be enabled
    await expect(page.locator('ion-button[type="submit"]')).toBeEnabled();
  });

  test('should show forgot password page', async ({ page }) => {
    await page.goto('/loginscreen');
    await page.click('text=Forgot password?');
    await expect(page).toHaveURL(/.*forgotpwd/);
    await expect(page.locator('ion-card-title:has-text("Forgot password")')).toBeVisible();
  });

  test('should show validation errors on empty registration', async ({ page }) => {
    await page.goto('/registration');
    await page.click('ion-button[type="submit"]');
    await expect(page.locator('ion-button[type="submit"]')).toBeDisabled();
  });

  test('should enable registration button when all required fields are filled', async ({ page }) => {
    await page.goto('/registration');
    
    await page.fill('ion-input[formControlName="firstName"] input', 'John');
    await page.fill('ion-input[formControlName="lastName"] input', 'Doe');
    await page.fill('ion-input[formControlName="email"] input', 'john@example.com');
    await page.fill('ion-input[formControlName="password"] input', 'password123');
    await page.fill('ion-input[formControlName="confirmPassword"] input', 'password123');
    
    await expect(page.locator('ion-button[type="submit"]')).toBeEnabled();
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await page.goto('/registration');
    
    await page.fill('ion-input[formControlName="firstName"] input', 'John');
    await page.fill('ion-input[formControlName="lastName"] input', 'Doe');
    await page.fill('ion-input[formControlName="email"] input', 'john@example.com');
    await page.fill('ion-input[formControlName="password"] input', 'password123');
    await page.fill('ion-input[formControlName="confirmPassword"] input', 'different');
    
    await expect(page.locator('ion-button[type="submit"]')).toBeDisabled();
  });

  test('should have social login buttons', async ({ page }) => {
    await page.goto('/loginscreen');
    
    await expect(page.locator('ion-button:has(ion-img[src*="google"])')).toBeVisible();
    await expect(page.locator('ion-button:has(ion-img[src*="facebook"])')).toBeVisible();
    await expect(page.locator('ion-button:has(ion-img[src*="apple"])')).toBeVisible();
  });

  test('should submit password reset with valid email', async ({ page }) => {
    await page.goto('/forgotpwd');
    
    await page.fill('ion-input[formControlName="email"] input', 'test@example.com');
    await expect(page.locator('ion-button[type="submit"]')).toBeEnabled();
  });
});
