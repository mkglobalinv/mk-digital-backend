# NINBVNPORTAL Provider Evaluation

This document presents the findings from the strict, isolated live testing of the NINBVNPORTAL API. The evaluation focuses on API functionality, documentation accuracy, and overall reliability.

## 1. Documentation Quality
- **Accuracy:** The documentation does not clearly specify that the request payloads for `/nin-verification` and `/bvn-verification` must use keys `"nin"` and `"bvn"` respectively, instead of a generalized `"number"` field.
- **Completeness:** Exact response schemas and error codes are poorly documented and had to be mapped through live interaction.

## 2. API Stability and Speed
- **Basic Verification (`/nin-verification`, `/bvn-verification`):** These endpoints respond quickly (under 2 seconds) but appropriately reject invalid inputs with a `400` status code.
- **Wallet Balance (`/balance`):** Responds quickly with accurate wallet metrics (e.g., `₦975.10`, API limit: 1000).
- **Phone to NIN (`/nin-phone`):** **SEVERE FAILURE.** The endpoint consistently times out (>20 seconds per request). This indicates extreme instability or a non-functional upstream service.
- **Phone to BVN (`/bvn-phone`):** **FAILURE.** The endpoint immediately returns a `503 Service Unavailable` status with the message `"BVN phone search service is currently unavailable"`.

## 3. Error Handling
- **Missing Fields:** Returns a clean `400 Bad Request` (e.g., `Field 'nin' is required`).
- **No Record Found:** Returns a generic `400` error: `"No record found/Invalid Input. Check your details and try again later"`. Note that it combines invalid inputs and missing records into a single generic error code, which makes it harder to programmatically differentiate between a bad format and a non-existent identity.

## 4. Wallet Behavior
- The API accurately tracks `api_requests_today` and overall `api_limit`. 
- Balance formatting is returned correctly, though no live deductions were tested due to the inability to produce a successful identity match with dummy data.

## 5. Support Quality & Production Readiness
The complete failure of the Phone Search endpoints (`/nin-phone` and `/bvn-phone`), coupled with the massive timeouts, means this provider is **not production-ready**. If integrated as a primary provider, users attempting phone searches would experience 60+ second hangs (accounting for standard backend retries) before ultimately failing.
