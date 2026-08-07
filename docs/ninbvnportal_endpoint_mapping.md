# NINBVNPORTAL Endpoint Mapping

*This document is populated based on observed live behavior as per the strict testing guidelines.*

## Overview
- **Base URL:** `https://ninbvnportal.com.ng/api`
- **Authentication Method:** API Key via Headers
- **Content Type:** `application/json`
- **Mandatory Fields:** `"consent": true` in all verification payloads

## 1. Wallet Balance (`/balance`)
- **HTTP Method:** GET
- **Headers Required:** `x-api-key`
- **Payload:** None
- **Observed Response Format:** 
  ```json
  {
    "status": "success",
    "reportID": null,
    "message": "Balance retrieved successfully",
    "data": {
      "user_id": 62755,
      "username": "9jasub",
      "balance": 975.1,
      "formatted_balance": "₦975.10",
      "user_type": "regular",
      "api_requests_today": 5,
      "api_limit": 1000
    }
  }
  ```

## 2. NIN Verification (`/nin-verification`)
- **HTTP Method:** POST
- **Payload Structure:** 
  ```json
  {
    "nin": "NIN_NUMBER_HERE",
    "consent": true
  }
  ```
- **Observed Error Response (Invalid Input):** 
  ```json
  {
    "status": "error",
    "message": "No record found/Invalid Input. Check your details and try again later",
    "code": 400
  }
  ```

## 3. BVN Verification (`/bvn-verification`)
- **HTTP Method:** POST
- **Payload Structure:** 
  ```json
  {
    "bvn": "BVN_NUMBER_HERE",
    "consent": true
  }
  ```
- **Observed Error Response (Invalid Input):** 
  ```json
  {
    "status": "error",
    "message": "No record found/Invalid Input. Check your details and try again later",
    "code": 400
  }
  ```

## 4. NIN by Phone (`/nin-phone`)
- **HTTP Method:** POST
- **Payload Structure:** 
  ```json
  {
    "number": "PHONE_NUMBER",
    "consent": true
  }
  ```
- **Observed Response Format:** *[To be populated after live test]*

## 5. BVN by Phone (`/bvn-phone`)
- **HTTP Method:** POST
- **Payload Structure:** 
  ```json
  {
    "number": "PHONE_NUMBER",
    "consent": true
  }
  ```
- **Observed Response Format:** *[To be populated after live test]*

## 6. NIN by Tracking ID (`/nin-tracking`)
- **HTTP Method:** POST
- **Payload Structure:** 
  ```json
  {
    "number": "TRACKING_ID",
    "consent": true
  }
  ```
- **Observed Response Format:** *[To be populated after live test]*

## 7. NIN by Demography (`/nin-demography`)
- **HTTP Method:** POST
- **Payload Structure:** *[To be discovered via live API testing or assumed fields if documented later]*
- **Observed Response Format:** *[To be populated after live test]*

## Error Handling Map
- **Invalid Key:** Returns standard network errors or 4xx.
- **Invalid Input / No Record:** `400` status with `"message": "No record found/Invalid Input. Check your details and try again later"`.
- **Missing Field:** `400` status with `"message": "Field 'nin' is required"`.
- **System Timeout:** Fails to respond within 20+ seconds on heavy operations like phone search.
