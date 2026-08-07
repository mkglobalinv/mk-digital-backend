# CheckMyNINBVN API Endpoint Mapping

This mapping is strictly derived from the official API documentation at `https://checkmyninbvn.com.ng/documentation`.
No endpoints have been guessed or hallucinated.

## Base Configuration
- **Base URL:** `https://checkmyninbvn.com.ng/api`
- **Authentication Method:** Header `x-api-key: YOUR_API_KEY_HERE` OR `Authorization: Bearer YOUR_API_KEY_HERE`
- **Content-Type:** `application/json`
- **Strict Requirement:** All verification payloads MUST include `"consent": true`.

## Supported Endpoints

### 1. NIN Verification
- **Method & Path:** `POST /nin-verification`
- **Payload Schema:** 
  ```json
  { "nin": "11_digit_string", "consent": true }
  ```
- **Response Schema:** 
  `status`, `reportID`, `message`, `data` (firstname, middlename, surname, telephoneno, residence_*, birth*, gender, nin, birthdate, photo)

### 2. NIN Phone Search
- **Method & Path:** `POST /nin-phone`
- **Payload Schema:** 
  ```json
  { "phone": "11_digit_string", "consent": true }
  ```

### 3. NIN Tracking
- **Method & Path:** `POST /nin-tracking`
- **Payload Schema:** 
  ```json
  { "tracking_id": "string", "consent": true }
  ```

### 4. NIN Demography Search
- **Method & Path:** `POST /nin-demography`
- **Payload Schema:** 
  ```json
  { "firstname": "string", "lastname": "string", "gender": "string", "dob": "YYYY-MM-DD", "consent": true }
  ```

### 5. BVN Verification
- **Method & Path:** `POST /bvn-verification`
- **Payload Schema:** 
  ```json
  { "bvn": "11_digit_string", "consent": true }
  ```

### 6. BVN Phone Search
- **Method & Path:** `POST /bvn-phone`
- **Payload Schema:** 
  ```json
  { "phone": "11_digit_string", "consent": true }
  ```

### 7. Account Balance
- **Method & Path:** `GET /balance`
- **Payload Schema:** None (Header auth only)
- **Response Schema:** `data.balance`, `data.formatted_balance`, `data.user_type`, `data.api_limit`

### 8. NIN Modification Orders
- **Method & Path:** `POST /nin-modification`
- **Payload Schema (General):** 
  ```json
  { "service_type": "enum", ..., "consent": true }
  ```
  *Service Types Supported:* `nin_name_modification`, `nin_phone_modification`, `nin_address_modification`, `nin_validation`.

### 9. Modification Order Status
- **Method & Path:** `GET /nin-modification-status?reference_id=STRING`
- **Payload Schema:** Query parameter `reference_id`
- **Response Schema:** `data.status` (pending/completed), `data.status_detail`

## Unsupported / Undocumented Features
- No dedicated API Health endpoint (will use `/balance` for health polling).
- No Webhook definitions.
- No Wallet Topup via API endpoints documented.
