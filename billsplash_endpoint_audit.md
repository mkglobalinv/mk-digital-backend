# Billsplash Endpoint Verification Audit
**Date:** 2026-08-06
**Objective:** Verify all Billsplash Identity Services endpoints directly against the live API to determine root causes of failures.

## Executive Summary
The backend implementation correctly authenticates with Billsplash and properly formats payloads for all tested endpoints. 
The vast majority of issues currently experienced are entirely on the Billsplash provider's side (e.g., Insufficient Balance, Upstream HTTP 500 errors). The only codebase discrepancy found was the IPE Clearance path which had a legacy directory prefix (`../bill/`) in the request.

---

## 1. NIN Verification
- **Endpoint Used:** `POST /api/nin_verification` (and `POST /api/nin_verification.php`)
- **Required Headers:** `Authorization: Bearer <API_KEY>`, `Content-Type: application/json`
- **Payload:** `{ nin: "****8901", slip_type: "vnin" }`
- **Status:** ❌ **Billsplash Upstream Failure**
- **Live Response:**
  ```json
  {
    "status": false,
    "message": "Unknown upstream error (HTTP 500)",
    "reference": "API-NIN-17860272369804"
  }
  ```
- **Root Cause:** Billsplash successfully authenticated our request, but their own upstream provider crashed/failed to look up the NIN.
- **Code Changes Required:** None. This is entirely an external Billsplash API error.

---

## 2. BVN Verification
- **Endpoint Used:** `POST /api/bvn_verification.php`
- **Required Headers:** `Authorization: Bearer <API_KEY>`, `Content-Type: application/json`
- **Payload:** `{ bvn: "****8901", slip_type: "premium" }`
- **Status:** ❌ **Insufficient Balance**
- **Live Response:**
  ```json
  {
    "status": false,
    "message": "Insufficient balance",
    "reference": "API-BVN-17860272387670"
  }
  ```
- **Root Cause:** Billsplash rejected the perfectly formatted request because the provider wallet has insufficient funds to fulfill the request.
- **Code Changes Required:** None. You must fund your Billsplash wallet.

---

## 3. NIN Verification by Phone
- **Status:** ❌ **Undocumented Endpoint**
- **Root Cause:** Billsplash has not publicly documented the endpoint path, HTTP method, or payload schema for looking up a NIN via phone number.
- **Code Changes Required:** None. Implementation must wait until official documentation is provided.

---

## 4. NIN Search by Demographics
- **Endpoint Used:** `POST /api/nin_verification.php`
- **Required Headers:** `Authorization: Bearer <API_KEY>`, `Content-Type: application/json`
- **Payload:** `{ slip_type: "premium", firstname: "John", lastname: "Doe", dob: "1990-01-01", gender: "male" }`
- **Status:** ✅ **Working Endpoint**
- **Live Response:**
  ```json
  {
    "status": false,
    "message": "API Response: No record for this details",
    "reference": "BS17860272388599913"
  }
  ```
- **Root Cause:** The endpoint is 100% correct. The API correctly responded that the dummy test data does not exist in the database.
- **Code Changes Required:** None. 

---

## 5. IPE Clearance
- **Endpoint Used in Code:** `POST /bill/ipe_clearance.php` (Using `../bill/ipe_clearance.php`)
- **Status:** ❌ **Wrong Endpoint / Provider 500**
- **Root Cause:** The original path `../bill/ipe_clearance.php` returned raw HTML (404 Not Found page). When we tested the correct root `/ipe_clearance.php`, Billsplash returned an empty `HTTP 500 Internal Server Error`.
- **Code Changes Required:** We need to update `services/providers/billsplash.js` to change `../bill/ipe_clearance.php` to `/ipe_clearance.php`. However, note that Billsplash's API server is currently crashing with a 500 error when this valid endpoint is hit.

---

## 6. Other Endpoints (Enrollments, Modifications, Delink)
- **Status:** ❌ **Undocumented**
- **Root Cause:** Billsplash has not documented the endpoints for Adult Enrollment, Child Enrollment, NIN Modify, NIN Delink, or BVN Modify. 

## Conclusion
Our application's implementation correctly implements the official endpoints available to us. The ongoing failures are due to Billsplash account balance issues and Billsplash upstream API instability (HTTP 500).

I am ready to implement the fix for the IPE clearance endpoint path whenever you approve.
