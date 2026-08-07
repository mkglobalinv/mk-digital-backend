# AY Global Data Endpoint Mapping

This document maps the documented structure of the AY Global Data API.

## Base Information
- **Base URL:** `https://ayglobaldata.com`
- **Authentication:** Header `Authorization: Token {API_KEY}`
- **Content Type:** `application/json` (except SMS and CAC)

## 1. User / Wallet Services
- **Endpoint:** `GET /api/user/`
- **Purpose:** Retrieve user profile, wallet balance, and API limits.
- **Payload:** None.

## 2. Identity Services
- **Endpoint:** `POST /api/verify/`
- **Purpose:** Verify NIN, BVN, or Phone number.
- **Payload:**
  ```json
  {
    "type": "nin|bvn",
    "method": "nin|bvn|phone",
    "value": "11_digit_string",
    "slip_type": "information|standard|premium"
  }
  ```

## 3. VTU Services

### 3.1 Airtime Topup
- **Endpoint:** `POST /api/airtime/`
- **Payload:**
  ```json
  {
    "network": "1|2|3|4|5",
    "phone": "08012345678",
    "amount": 100,
    "ref": "UNIQUE_REF",
    "ported_number": "false"
  }
  ```

### 3.2 Data Topup
- **Endpoint:** `POST /api/data/`
- **Payload:**
  ```json
  {
    "network": "1|2|3|4|5",
    "phone": "08012345678",
    "data_plan": "PLAN_ID",
    "ref": "UNIQUE_REF"
  }
  ```

### 3.3 Electricity Verification & Payment
- **Verify:** `POST /api/electricity/verify/`
  ```json
  {
    "provider": "DISCO_ID",
    "meternumber": "1234567890",
    "metertype": "prepaid|postpaid"
  }
  ```
- **Pay:** `POST /api/electricity/`
  ```json
  {
    "provider": "DISCO_ID",
    "meternumber": "1234567890",
    "metertype": "prepaid|postpaid",
    "amount": 1000,
    "ref": "UNIQUE_REF"
  }
  ```

### 3.4 Cable TV Verification & Payment
- **Verify:** `POST /api/cabletv/verify/`
  ```json
  {
    "provider": "PROVIDER_ID",
    "iucnumber": "1234567890"
  }
  ```
- **Pay:** `POST /api/cabletv/`
  ```json
  {
    "provider": "PROVIDER_ID",
    "iucnumber": "1234567890",
    "plan": "PLAN_ID",
    "ref": "UNIQUE_REF"
  }
  ```

### 3.5 Exam PINs
- **Endpoint:** `POST /api/exam/`
- **Payload:**
  ```json
  {
    "provider": "PROVIDER_ID",
    "quantity": 1,
    "ref": "UNIQUE_REF"
  }
  ```

## 4. Bulk SMS
- **Endpoint:** `POST /api/sms/` (application/x-www-form-urlencoded)
- **Payload:**
  ```text
  sender_id=STRING&phone_numbers=CSV&message_body=TEXT
  ```

## 5. CAC Registration
- **Endpoint:** `POST /api/cac/` (multipart/form-data)
- **Payload:**
  - `type` (business_name, company_1m, ngo)
  - `owner_fullname` (string)
  - `passport` (File Upload)
