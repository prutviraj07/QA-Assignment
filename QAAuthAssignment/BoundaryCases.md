# Boundary Test Cases — User Authentication & Authorization (JWT)

Boundary Value Analysis (BVA) applied to Name length, Password length, Email edge cases, and Rate-limit threshold.

---

## 1. Name Length (Rule: 5–24 characters)

| Test Case ID | Title | Input (length) | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|
| TC_BND_NAME_01 | Name below minimum boundary (4 chars) fails | 4 | "Anu1" | 400 Bad Request — "Name must be 5-24 characters" | High |
| TC_BND_NAME_02 | Name at minimum boundary (5 chars) passes | 5 | "Anuj" + 1 char e.g. "Anujj" | 201 Created | High |
| TC_BND_NAME_03 | Name at maximum boundary (24 chars) passes | 24 | "AnujKumarSrivastavaRaoo" (24 chars) | 201 Created | High |
| TC_BND_NAME_04 | Name above maximum boundary (25 chars) fails | 25 | "AnujKumarSrivastavaRaooX" (25 chars) | 400 Bad Request — "Name must be 5-24 characters" | High |

**Note:** Exact 24/25-character strings should be generated programmatically in automation to guarantee precise length (avoid manual miscount).

---

## 2. Password Length (Rule: minimum 12 characters, letters + numbers)

| Test Case ID | Title | Input (length) | Test Data | Expected Result | Priority |
|---|---|---|---|---|---|
| TC_BND_PWD_01 | Password below minimum boundary (11 chars) fails | 11 | "Passw0rd12" (11 chars) | 400 Bad Request — "Password must be at least 12 characters" | High |
| TC_BND_PWD_02 | Password at minimum boundary (12 chars) passes | 12 | "Passw0rd123" + 1 = "Passw0rd1234" (12 chars) | 201 Created | High |
| TC_BND_PWD_03 | Password just above boundary (13 chars) passes | 13 | "Passw0rd12345" | 201 Created | Medium |
| TC_BND_PWD_04 | Very long password (e.g., 128 chars) is accepted or handled gracefully | 128 | Repeated valid pattern to 128 chars | 201 Created (or documented max-length rejection, no crash/500 error) | Medium |

---

## 3. Email Edge Cases

| Test Case ID | Title | Test Data | Expected Result | Priority |
|---|---|---|---|---|
| TC_BND_EMAIL_01 | Uppercase email is accepted and normalized to lowercase | "USER.NAME@EXAMPLE.COM" | 201 Created; stored/compared as "user.name@example.com" | High |
| TC_BND_EMAIL_02 | Email with leading/trailing spaces is trimmed before validation | "  user@example.com  " | 201 Created after trimming (or 400 if strict — behavior must be explicitly defined by dev team) | High |
| TC_BND_EMAIL_03 | Email with spaces in the middle is rejected | "us er@example.com" | 400 Bad Request — invalid format | High |
| TC_BND_EMAIL_04 | Very long email (e.g., 250+ characters) is handled without server error | Local-part + domain totaling 250+ chars | 400 Bad Request if exceeding practical/DB column limit, OR 201 Created if within limit — no 500 error either way | Medium |
| TC_BND_EMAIL_05 | Email missing "@" symbol is rejected | "userexample.com" | 400 Bad Request — invalid format | High |
| TC_BND_EMAIL_06 | Email missing domain extension is rejected | "user@example" | 400 Bad Request — invalid format | Medium |
| TC_BND_EMAIL_07 | Email with valid plus-addressing is accepted | "user+test@example.com" | 201 Created (per RFC 5321 this is a valid address) | Low |

---

## 4. Rate-Limit Threshold (Rule: max 10 attempts/hour/IP)

| Test Case ID | Title | Attempt # | Expected Result | Priority |
|---|---|---|---|---|
| TC_BND_RATE_01 | 10th attempt within the hour is still allowed | 10 | Request processed normally (201/400/409 depending on payload), NOT 429 | High |
| TC_BND_RATE_02 | 11th attempt within the same hour is blocked | 11 | 429 Too Many Requests | High |
| TC_BND_RATE_03 | Attempt exactly at the 1-hour boundary reset | 1 (new window) | Request processed normally once the rolling/fixed window has reset | Medium |

---

## Summary
- Total Boundary Test Cases: **18**
- Technique used: Boundary Value Analysis (BVA) at min-1, min, max, max+1 for each numeric constraint
- All boundary cases should be automated where possible to ensure precise, repeatable input lengths and timing.
