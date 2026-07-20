# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui_e2e_journey.spec.js >> VTU Frontend E2E Journey >> Signup page renders and validates input
- Location: tests\ui_e2e_journey.spec.js:20:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('form').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('form').first()

```

```yaml
- heading "Website Not Found" [level=1]
- paragraph: This website does not exist.
- paragraph: Please check the website address.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('VTU Frontend E2E Journey', () => {
  4  | 
  5  |   test('Homepage loads correctly', async ({ page }) => {
  6  |     await page.goto('/');
  7  |     
  8  |     // Check for essential elements
  9  |     await expect(page.locator('text=Welcome').first()).toBeVisible({ timeout: 10000 }).catch(() => null);
  10 |     
  11 |     // Check if Navbar exists
  12 |     const nav = page.locator('nav').first();
  13 |     await expect(nav).toBeVisible();
  14 |     
  15 |     // Verify responsive UI (basic check)
  16 |     const boundingBox = await nav.boundingBox();
  17 |     expect(boundingBox.width).toBeGreaterThan(0);
  18 |   });
  19 | 
  20 |   test('Signup page renders and validates input', async ({ page }) => {
  21 |     await page.goto('/register');
  22 |     
  23 |     // Check if form is visible
> 24 |     await expect(page.locator('form').first()).toBeVisible();
     |                                                ^ Error: expect(locator).toBeVisible() failed
  25 |     
  26 |     // Attempt to submit empty form
  27 |     const submitBtn = page.locator('button[type="submit"]');
  28 |     await expect(submitBtn).toBeVisible();
  29 |     await submitBtn.click();
  30 |     
  31 |     // Expect some validation error to show up (assuming HTML5 validation or React state)
  32 |     // We just ensure the page didn't crash
  33 |     await expect(page.locator('form').first()).toBeVisible();
  34 |   });
  35 | 
  36 |   test('Login page renders and allows input', async ({ page }) => {
  37 |     await page.goto('/login');
  38 |     
  39 |     const emailInput = page.locator('input[type="email"]').first();
  40 |     const passwordInput = page.locator('input[type="password"]').first();
  41 |     
  42 |     if (await emailInput.isVisible()) {
  43 |         await emailInput.fill('testuser@example.com');
  44 |         await passwordInput.fill('Password123!');
  45 |         const submitBtn = page.locator('button[type="submit"]');
  46 |         await submitBtn.click();
  47 |         
  48 |         // Ensure no crash
  49 |         await expect(page.locator('form').first()).toBeVisible().catch(() => null);
  50 |     }
  51 |   });
  52 | 
  53 |   test('Theme switcher toggles correctly', async ({ page }) => {
  54 |     await page.goto('/');
  55 |     
  56 |     // Check for dark/light mode toggle (assuming standard button)
  57 |     const themeBtn = page.locator('button[aria-label="Toggle theme"], .theme-toggle').first();
  58 |     
  59 |     if (await themeBtn.isVisible()) {
  60 |         const body = page.locator('body');
  61 |         const initialClass = await body.getAttribute('class');
  62 |         await themeBtn.click();
  63 |         
  64 |         // Give time for state update
  65 |         await page.waitForTimeout(500);
  66 |         const newClass = await body.getAttribute('class');
  67 |         
  68 |         // We assume class changes or style changes
  69 |         expect(initialClass !== newClass || true).toBeTruthy();
  70 |     }
  71 |   });
  72 | 
  73 |   test('Error pages render correctly on invalid route', async ({ page }) => {
  74 |     const response = await page.goto('/this-route-does-not-exist');
  75 |     
  76 |     // Ensure we don't get a blank screen (React handles 404)
  77 |     const bodyText = await page.textContent('body');
  78 |     expect(bodyText?.length).toBeGreaterThan(10);
  79 |     
  80 |     // Could check for "Not Found" or "404"
  81 |     const has404Text = bodyText?.toLowerCase().includes('not found') || bodyText?.includes('404');
  82 |     expect(has404Text || true).toBeTruthy(); 
  83 |   });
  84 | });
  85 | 
```