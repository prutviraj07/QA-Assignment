# Manual Test Cases — User Authentication & Authorization (JWT)

**Application:** React.js (Frontend) + Spring Boot (Backend) + JWT Auth
**Module Coverage:** Registration, Login, Dashboard (Protected Route), JWT, Rate Limiting, Security, Concurrency

**Real-world reference:** The Registration → Login → Protected Dashboard flow tested here mirrors the pattern used by consumer platforms such as [BookMyShow](https://in.bookmyshow.com/) — where a user signs up/logs in with email + password, receives an authenticated session, and is then allowed access to account-specific pages (bookings, profile) only while that session/token is valid. That flow was used as a general real-world reference point when designing the test scenarios below (e.g. duplicate-email handling on sign-up, redirect-to-login when accessing an account page while logged out).

---

## 1. Registration — Positive

| Field | Value |
|---|---|
| **Test Case ID** | TC_REG_001 |
| **Title** | Register with all valid, unique details |
| **Preconditions** | App is up; email not already registered |
| **Steps** | 1. Navigate to Registration page 2. Enter Name = "Ananya Rao" 3. Enter Email = "ananya.rao@example.com" 4. Enter Password = "Passw0rd1234" 5. Enter Confirm Password = "Passw0rd1234" 6. Click Register |
| **Test Data** | Name: Ananya Rao, Email: ananya.rao@example.com, Password: Passw0rd1234 |
| **Expected Result** | 201 Created; success message shown; user can now log in |
| **Priority** | High |

| Field | Value |
|---|---|
| **Test Case ID** | TC_REG_002 |
| **Title** | Registered email is stored in lowercase regardless of input case |
| **Preconditions** | Email "MixedCase@Example.com" not registered |
| **Steps** | 1. Register with Email = "MixedCase@Example.COM" and valid Name/Password 2. Submit 3. Query backend/DB (or attempt duplicate check) for stored email |
| **Test Data** | Email: MixedCase@Example.COM |
| **Expected Result** | 201 Created; email persisted as "mixedcase@example.com" |
| **Priority** | High |

---

## 2. Registration — Field Validation (Negative)

| Field | Value |
|---|---|
| **Test Case ID** | TC_REG_003 |
| **Title** | Registration fails when Name field is empty |
| **Preconditions** | On Registration page |
| **Steps** | 1. Leave Name blank 2. Fill Email, Password, Confirm Password validly 3. Submit |
| **Test Data** | Name: "" |
| **Expected Result** | 400 Bad Request; field-level error "Name is required" |
| **Priority** | High |

| Field | Value |
|---|---|
| **Test Case ID** | TC_REG_004 |
| **Title** | Registration fails when Email format is invalid |
| **Preconditions** | On Registration page |
| **Steps** | 1. Enter Email = "ananya@@example" 2. Fill other fields validly 3. Submit |
| **Test Data** | Email: ananya@@example |
| **Expected Result** | 400 Bad Request; "Invalid email format" error |
| **Priority** | High |

| Field | Value |
|---|---|
| **Test Case ID** | TC_REG_005 |
| **Title** | Registration fails when Password lacks numbers (letters only) |
| **Preconditions** | On Registration page |
| **Steps** | 1. Enter Password = "PasswordOnly" (12+ chars, no digits) 2. Submit |
| **Test Data** | Password: PasswordOnly |
| **Expected Result** | 400 Bad Request; "Password must contain letters and numbers" |
| **Priority** | High |

| Field | Value |
|---|---|
| **Test Case ID** | TC_REG_006 |
| **Title** | Registration fails when Password lacks letters (numbers only) |
| **Preconditions** | On Registration page |
| **Steps** | 1. Enter Password = "123456789012" 2. Submit |
| **Test Data** | Password: 123456789012 |
| **Expected Result** | 400 Bad Request; "Password must contain letters and numbers" |
| **Priority** | High |

| Field | Value |
|---|---|
| **Test Case ID** | TC_REG_007 |
| **Title** | Registration fails when Confirm Password does not match Password |
| **Preconditions** | On Registration page |
| **Steps** | 1. Password = "Passw0rd1234" 2. Confirm Password = "Passw0rd9999" 3. Submit |
| **Test Data** | Password: Passw0rd1234 / Confirm: Passw0rd9999 |
| **Expected Result** | 400 Bad Request; "Passwords do not match" (blocked client-side and re-validated server-side) |
| **Priority** | High |

| Field | Value |
|---|---|
| **Test Case ID** | TC_REG_008 |
| **Title** | Frontend validation blocks submit before hitting API for empty required fields |
| **Preconditions** | On Registration page, JS enabled |
| **Steps** | 1. Leave all fields blank 2. Click Register |
| **Test Data** | N/A |
| **Expected Result** | Inline UI errors shown; no network call fired (verify via dev-tools/Network tab) |
| **Priority** | Medium |

| Field | Value |
|---|---|
| **Test Case ID** | TC_REG_009 |
| **Title** | Backend rejects invalid payload even if frontend validation is bypassed |
| **Preconditions** | Direct API access (Postman/cURL) |
| **Steps** | 1. Send POST /register with Name="" and invalid email directly to API, bypassing UI |
| **Test Data** | Raw JSON with invalid fields |
| **Expected Result** | 400 Bad Request — confirms backend does NOT trust client-only validation |
| **Priority** | High |

---

## 3. Registration — Duplicate Email

| Field | Value |
|---|---|
| **Test Case ID** | TC_REG_010 |
| **Title** | Registration fails for already-registered email |
| **Preconditions** | Email "existing.user@example.com" already registered |
| **Steps** | 1. Attempt registration with the same email and a valid new Name/Password 2. Submit |
| **Test Data** | Email: existing.user@example.com |
| **Expected Result** | 409 Conflict; "Email already registered" |
| **Priority** | High |

| Field | Value |
|---|---|
| **Test Case ID** | TC_REG_011 |
| **Title** | Duplicate check is case-insensitive |
| **Preconditions** | "user@example.com" already registered |
| **Steps** | 1. Attempt registration with Email = "USER@EXAMPLE.COM" |
| **Test Data** | Email: USER@EXAMPLE.COM |
| **Expected Result** | 409 Conflict (treated as duplicate since emails are normalized to lowercase) |
| **Priority** | High |

---

## 4. Registration — Rate Limiting

| Field | Value |
|---|---|
| **Test Case ID** | TC_REG_012 |
| **Title** | 11th registration attempt from same IP within an hour is throttled |
| **Preconditions** | 10 registration attempts already made from same IP within the last hour |
| **Steps** | 1. Perform an 11th registration attempt (any payload) from the same IP within the hour window |
| **Test Data** | Any valid/invalid payload |
| **Expected Result** | 429 Too Many Requests |
| **Priority** | Medium |

| Field | Value |
|---|---|
| **Test Case ID** | TC_REG_013 |
| **Title** | Rate limit resets after the 1-hour window elapses |
| **Preconditions** | IP was throttled (429) after 10 attempts |
| **Steps** | 1. Wait until the 1-hour window has passed 2. Retry registration |
| **Test Data** | Valid payload |
| **Expected Result** | Request is processed normally (201/400/409 as applicable, not 429) |
| **Priority** | Low |

---

## 5. Login — Positive & Negative

| Field | Value |
|---|---|
| **Test Case ID** | TC_LOGIN_001 |
| **Title** | Successful login with valid credentials returns JWT and redirects to Dashboard |
| **Preconditions** | User is registered and active |
| **Steps** | 1. Navigate to Login 2. Enter valid Email + Password 3. Click Login |
| **Test Data** | Email: ananya.rao@example.com, Password: Passw0rd1234 |
| **Expected Result** | 200 OK; JWT returned in response; user redirected to Dashboard |
| **Priority** | High |

| Field | Value |
|---|---|
| **Test Case ID** | TC_LOGIN_002 |
| **Title** | Login fails with incorrect password |
| **Preconditions** | User is registered |
| **Steps** | 1. Enter correct Email, wrong Password 2. Click Login |
| **Test Data** | Email: ananya.rao@example.com, Password: WrongPass1 |
| **Expected Result** | 401 Unauthorized; generic error (does not reveal whether email or password was wrong) |
| **Priority** | High |

| Field | Value |
|---|---|
| **Test Case ID** | TC_LOGIN_003 |
| **Title** | Login fails for non-existent email |
| **Preconditions** | Email not registered |
| **Steps** | 1. Enter unregistered Email + any Password 2. Click Login |
| **Test Data** | Email: nouser@example.com |
| **Expected Result** | 401 Unauthorized; same generic message as TC_LOGIN_002 (prevents user enumeration) |
| **Priority** | High |

| Field | Value |
|---|---|
| **Test Case ID** | TC_LOGIN_004 |
| **Title** | Login is case-insensitive on email |
| **Preconditions** | User registered with "ananya.rao@example.com" |
| **Steps** | 1. Login using Email = "Ananya.Rao@Example.com" with correct password |
| **Test Data** | Email: Ananya.Rao@Example.com |
| **Expected Result** | 200 OK; login succeeds |
| **Priority** | Medium |

| Field | Value |
|---|---|
| **Test Case ID** | TC_LOGIN_005 |
| **Title** | Login fails when password field is empty |
| **Preconditions** | On Login page |
| **Steps** | 1. Enter valid Email, leave Password blank 2. Click Login |
| **Test Data** | Password: "" |
| **Expected Result** | 400 Bad Request or UI-blocked; "Password is required" |
| **Priority** | Medium |

---

## 6. JWT Authentication & Dashboard (Protected Route)

| Field | Value |
|---|---|
| **Test Case ID** | TC_JWT_001 |
| **Title** | Dashboard is accessible with a valid JWT |
| **Preconditions** | User logged in, valid JWT stored |
| **Steps** | 1. Navigate to /dashboard with valid token attached |
| **Test Data** | Valid JWT |
| **Expected Result** | 200 OK; Dashboard displays logged-in user's email and route name |
| **Priority** | High |

| Field | Value |
|---|---|
| **Test Case ID** | TC_JWT_002 |
| **Title** | Accessing Dashboard without a JWT redirects to Login |
| **Preconditions** | User not logged in / no token in storage |
| **Steps** | 1. Directly navigate to /dashboard URL without logging in |
| **Test Data** | No token |
| **Expected Result** | User redirected to Login page; no protected data exposed |
| **Priority** | High |

| Field | Value |
|---|---|
| **Test Case ID** | TC_JWT_003 |
| **Title** | Accessing Dashboard with an expired JWT redirects to Login |
| **Preconditions** | User has an expired token (wait past expiry or use pre-expired test token) |
| **Steps** | 1. Set an expired JWT in storage 2. Navigate to /dashboard |
| **Test Data** | Expired JWT |
| **Expected Result** | 401 Unauthorized from API; frontend redirects to Login |
| **Priority** | High |

| Field | Value |
|---|---|
| **Test Case ID** | TC_JWT_004 |
| **Title** | Accessing Dashboard with a tampered/invalid JWT is rejected |
| **Preconditions** | Valid JWT available |
| **Steps** | 1. Modify one character in the JWT payload/signature 2. Attach to request to /dashboard or a protected API |
| **Test Data** | Tampered JWT string |
| **Expected Result** | 401 Unauthorized; access denied |
| **Priority** | High |

| Field | Value |
|---|---|
| **Test Case ID** | TC_JWT_005 |
| **Title** | Logout invalidates client-side session and blocks further Dashboard access |
| **Preconditions** | User logged in |
| **Steps** | 1. Click Logout 2. Attempt to navigate back to /dashboard (e.g., via browser back button) |
| **Test Data** | N/A |
| **Expected Result** | Token cleared from storage; user redirected to Login; dashboard not accessible |
| **Priority** | High |

| Field | Value |
|---|---|
| **Test Case ID** | TC_JWT_006 |
| **Title** | JWT from one user cannot access another user's data |
| **Preconditions** | Two registered users, User A logged in |
| **Steps** | 1. Use User A's JWT 2. Attempt to request User B's protected resource (if such an endpoint exists, e.g., /api/users/{userB_id}) |
| **Test Data** | User A's JWT, User B's resource ID |
| **Expected Result** | 403 Forbidden (authorization enforced beyond authentication) |
| **Priority** | High |

---

## 7. Security — Basic Malicious Input Handling

| Field | Value |
|---|---|
| **Test Case ID** | TC_SEC_001 |
| **Title** | SQL Injection attempt in Login Email field is safely rejected |
| **Preconditions** | On Login page |
| **Steps** | 1. Enter Email = "' OR '1'='1" 2. Enter any Password 3. Submit |
| **Test Data** | Email: ' OR '1'='1 |
| **Expected Result** | 401 Unauthorized / 400 Bad Request; no authentication bypass; no server error/stack trace leaked |
| **Priority** | High |

| Field | Value |
|---|---|
| **Test Case ID** | TC_SEC_002 |
| **Title** | Script injection (XSS) in Name field is neutralized |
| **Preconditions** | On Registration page |
| **Steps** | 1. Enter Name = "<script>alert(1)</script>" (within/exceeding length rule as applicable) 2. Submit and later view Name on Dashboard |
| **Test Data** | Name: <script>alert(1)</script> |
| **Expected Result** | Input is rejected by validation OR safely escaped/rendered as plain text — script does not execute |
| **Priority** | High |

| Field | Value |
|---|---|
| **Test Case ID** | TC_SEC_003 |
| **Title** | Registration/Login response does not leak sensitive internal details |
| **Preconditions** | Trigger a validation or server error |
| **Steps** | 1. Send a malformed request (e.g., invalid JSON body) to /register or /login |
| **Test Data** | Malformed payload |
| **Expected Result** | Generic error response; no stack trace, DB schema, or internal path disclosed |
| **Priority** | Medium |

---

## 8. Concurrency (Conceptual)

| Field | Value |
|---|---|
| **Test Case ID** | TC_CONC_001 |
| **Title** | Two users submitting registration with the same email simultaneously — only one succeeds |
| **Preconditions** | Email "race@example.com" not yet registered |
| **Steps** | 1. Fire two near-simultaneous POST /register requests with the same email (e.g., via two parallel scripts/tabs) |
| **Test Data** | Email: race@example.com (identical in both requests) |
| **Expected Result** | Exactly one request succeeds with 201 Created; the other receives 409 Conflict — DB-level unique constraint prevents duplicate rows even under a race condition |
| **Priority** | High |

---

## Summary
- Total Test Cases: **26**
- High Priority: 18 | Medium Priority: 6 | Low Priority: 2
- Areas covered: Registration (positive/negative/duplicate/rate-limit), Login (positive/negative), JWT & protected routes, security inputs, concurrency
