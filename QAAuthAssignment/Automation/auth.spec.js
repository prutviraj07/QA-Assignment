/**
 * auth.spec.js
 * Playwright automation for the User Authentication (JWT) feature.
 *
 * Covers the 5 required scenarios:
 *   1. Successful registration
 *   2. Registration with duplicate email
 *   3. Successful login
 *   4. Login with invalid password
 *   5. Access dashboard without login (redirect)
 *
 * NOTE ON SELECTORS / CONFIG:
 * This suite is written against a typical React registration/login form.
 * The selectors below use `data-testid` attributes, which is the recommended,
 * resilient way to target elements in Playwright (CSS class names / structure
 * often change with UI redesigns, testid attributes are stable contracts
 * between dev and QA). If the real application does not yet expose these
 * testids, replace the locators with the actual ones used in the app
 * (see comments inline for CSS-selector fallback examples).
 *
 * Run with:
 *   npx playwright test
 *
 * Config (baseURL, etc.) lives in playwright.config.js in this same folder.
 */

const { test, expect } = require('@playwright/test');

// Helper: generates a unique email per test run so re-runs don't collide
// with previously created accounts (registration is not idempotent).
function uniqueEmail(prefix = 'qa.user') {
  const stamp = Date.now();
  return `${prefix}.${stamp}@example.com`;
}

const VALID_NAME = 'Automation Tester';
const VALID_PASSWORD = 'Passw0rd1234'; // 12+ chars, letters + numbers

test.describe('User Registration', () => {

  test('TC-AUTO-01: Successful registration with valid unique details', async ({ page }) => {
    const email = uniqueEmail('newuser');

    await page.goto('/register');

    await page.getByTestId('register-name').fill(VALID_NAME);
    await page.getByTestId('register-email').fill(email);
    await page.getByTestId('register-password').fill(VALID_PASSWORD);
    await page.getByTestId('register-confirm-password').fill(VALID_PASSWORD);

    // Wait for the API response while triggering navigation/submit
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/register') && res.request().method() === 'POST'),
      page.getByTestId('register-submit').click(),
    ]);

    expect(response.status()).toBe(201);
    await expect(page.getByTestId('register-success-message')).toBeVisible();
  });

  test('TC-AUTO-02: Registration fails with duplicate email (409 Conflict)', async ({ page, request }) => {
    const email = uniqueEmail('dupe');

    // First, register the user once via direct API call for speed/reliability
    const firstAttempt = await request.post('/api/register', {
      data: {
        name: VALID_NAME,
        email,
        password: VALID_PASSWORD,
        confirmPassword: VALID_PASSWORD,
      },
    });
    expect(firstAttempt.status()).toBe(201);

    // Now attempt to register the SAME email again through the UI
    await page.goto('/register');
    await page.getByTestId('register-name').fill('Another Name');
    await page.getByTestId('register-email').fill(email);
    await page.getByTestId('register-password').fill(VALID_PASSWORD);
    await page.getByTestId('register-confirm-password').fill(VALID_PASSWORD);

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/register') && res.request().method() === 'POST'),
      page.getByTestId('register-submit').click(),
    ]);

    expect(response.status()).toBe(409);
    await expect(page.getByTestId('register-error-message')).toContainText(/already registered|already exists/i);
  });
});

test.describe('User Login', () => {

  // Reuse a single pre-registered account for all login tests (created once via API in beforeAll)
  const loginEmail = uniqueEmail('logintest');

  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/register', {
      data: {
        name: VALID_NAME,
        email: loginEmail,
        password: VALID_PASSWORD,
        confirmPassword: VALID_PASSWORD,
      },
    });
    expect(res.status()).toBe(201);
  });

  test('TC-AUTO-03: Successful login redirects to Dashboard and returns JWT', async ({ page }) => {
    await page.goto('/login');

    await page.getByTestId('login-email').fill(loginEmail);
    await page.getByTestId('login-password').fill(VALID_PASSWORD);

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/login') && res.request().method() === 'POST'),
      page.getByTestId('login-submit').click(),
    ]);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.token).toBeTruthy(); // JWT returned in response

    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByTestId('dashboard-user-email')).toHaveText(loginEmail);
  });

  test('TC-AUTO-04: Login fails with invalid password (401 Unauthorized)', async ({ page }) => {
    await page.goto('/login');

    await page.getByTestId('login-email').fill(loginEmail);
    await page.getByTestId('login-password').fill('WrongPassword1');

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/login') && res.request().method() === 'POST'),
      page.getByTestId('login-submit').click(),
    ]);

    expect(response.status()).toBe(401);
    await expect(page).toHaveURL(/.*login/); // stays on login page
    await expect(page.getByTestId('login-error-message')).toBeVisible();
  });
});

test.describe('Protected Route (Dashboard)', () => {

  test('TC-AUTO-05: Accessing Dashboard without login redirects to Login page', async ({ page, context }) => {
    // Ensure a clean, unauthenticated session (no token in storage/cookies)
    await context.clearCookies();
    await page.goto('/'); // load app once so localStorage is accessible
    await page.evaluate(() => localStorage.clear());

    await page.goto('/dashboard');

    // App should redirect unauthenticated users away from the protected route
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByTestId('login-form')).toBeVisible();
  });
});
