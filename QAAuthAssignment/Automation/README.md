# Automation — Setup & Run Instructions

## Prerequisites
- Node.js 18+
- The application (React frontend + Spring Boot backend) running and reachable, with:
  - `/register` and `/login` pages
  - `/api/register` and `/api/login` endpoints
  - `/dashboard` protected route

## Install
```bash
npm install
npx playwright install --with-deps
```

## Configure
Set the `BASE_URL` environment variable to point at the environment under test:
```bash
export BASE_URL=http://localhost:3000
```
(Defaults to `http://localhost:3000` if not set — see `playwright.config.js`.)

## Run all tests
```bash
npm test
```

## Run in headed mode (see the browser)
```bash
npm run test:headed
```

## View HTML report (screenshots/videos/traces on failure)
```bash
npm run report
```
Report output and evidence are written to `../Evidence/playwright-report`.

## Selector note
Tests use `data-testid` attributes (e.g. `data-testid="register-email"`) for stable
element targeting. If the actual application does not yet expose these test IDs,
either:
1. Add them to the frontend components (recommended, low-risk change), or
2. Replace the `page.getByTestId(...)` calls in `auth.spec.js` with the real
   selectors (e.g. `page.locator('#email')` or `page.getByLabel('Email')`).
