import{r as N,j as e,l as y,B as x}from"./index-BoMqN3fm.js";import{P as I}from"./PublicLayout-CB6oG5w2.js";import{C as a,A as C}from"./DeveloperFeedback-DEItjeak.js";import"./Logo-BI4uDdi6.js";import"./usePortalBrand-DEfjQ53W.js";import"./LiveChatPanel-D8eGDDCq.js";import"./live-chat.api-qcQyWwO0.js";import"./input-WB93QBKb.js";import"./textarea-BFzYU9HJ.js";import"./shield-check-BzFiScde.js";import"./mail-D3u4iBg2.js";import"./send-DVlK5dyI.js";import"./paperclip-CNXoE0c-.js";import"./user-round-DD9Wl8h4.js";import"./proxy-Bf0H9sS8.js";import"./image-C7g8vrFw.js";import"./circle-check-DZ-FUzDl.js";import"./x-djG_UD7q.js";import"./PortalSocialLinks-JnSB9V2X.js";import"./landing-template-runtime-YTx1yKbj.js";import"./store-tpXKiO0-.js";import"./briefcase-business-B1kDYiXC.js";import"./chevron-down-w5Hc4juU.js";import"./code-xml-BHnJxSr8.js";import"./arrow-up-right-Cw4K5hds.js";import"./copy-CEZLW1J1.js";import"./check-Csb6w58k.js";const m=[{id:"introduction",label:"Introduction",description:"How merchant APIs work"},{id:"authentication",label:"Authentication",description:"API key headers and request rules"},{id:"environments",label:"Environments",description:"Sandbox and live base URLs"},{id:"responses",label:"Responses",description:"Standard success and error shape"},{id:"ip-whitelist",label:"API IP whitelist",description:"Restrict merchant API calls by public IP"},{id:"services",label:"Services & quotes",description:"List services and obtain quote information"},{id:"nin",label:"NIN Verification",description:"NIN JSON verification and request tracking"},{id:"bvn",label:"BVN Verification",description:"BVN JSON verification and request tracking"},{id:"cac",label:"CAC Verification",description:"Name search, basic and advanced business verification"},{id:"tin",label:"TIN Verification",description:"Business TIN verification by TIN or RC/BN/IT number"},{id:"face",label:"Face Verification",description:"Face match and liveness verification"},{id:"liveness-sdk",label:"Liveness SDK",description:"React, Next.js and Flutter integration guide"},{id:"credit",label:"Credit History",description:"BVN-based credit bureau lookup"},{id:"live-address",label:"Live Address Lookup",description:"Instant meter-based address verification"},{id:"address",label:"Manual Address Verification",description:"Create and track field verification requests"},{id:"driver",label:"Driver License",description:"Driver license verification"},{id:"voters",label:"Voters Card",description:"Voter Identification Number lookup"},{id:"digital",label:"Digital Services",description:"Airtime, data, bills, vouchers and requery"},{id:"webhooks",label:"Webhooks",description:"Receive status notifications"},{id:"errors",label:"Errors",description:"Validation, authorization and wallet errors"},{id:"golive",label:"Go-live Checklist",description:"Production readiness checks"}],b="introduction",A=new Set(m.map(s=>s.id));function T(s){const i=s.replace(/^#/,"");return A.has(i)?i:b}function g(){return typeof window>"u"?b:T(window.location.hash)}function Ce(){const[s,i]=N.useState(g),o=m.find(r=>r.id===s)??m[0];N.useEffect(()=>{const r=()=>i(g());return r(),window.addEventListener("hashchange",r),()=>window.removeEventListener("hashchange",r)},[]);const c=r=>{if(i(r),typeof window>"u")return;const u=`#${r}`;window.location.hash!==u&&window.history.replaceState(null,"",`${window.location.pathname}${window.location.search}${u}`)};return e.jsx(I,{children:e.jsxs("main",{className:"min-h-screen bg-gradient-to-b from-background via-muted/20 to-background",children:[e.jsx("section",{className:"border-b border-border/70 bg-background/95 pt-10",children:e.jsxs("div",{className:"mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8",children:[e.jsx("p",{className:"text-xs font-semibold text-primary",children:"API Docs"}),e.jsxs("div",{className:"mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between",children:[e.jsxs("div",{className:"max-w-3xl",children:[e.jsx("h1",{className:"text-3xl font-bold tracking-tight text-foreground sm:text-4xl",children:"Developer documentation"}),e.jsx("p",{className:"mt-3 text-sm leading-6 text-muted-foreground sm:text-base",children:"Build merchant integrations with stable Identro JSON responses for identity, business, credit, biometric, address and digital services."})]}),e.jsxs("div",{className:"rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground",children:["Base path:"," ",e.jsx("code",{className:"rounded bg-background px-1.5 py-0.5 font-mono text-foreground",children:"/merchant-api"})]})]})]})}),e.jsxs("div",{className:"mx-auto flex max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8",children:[e.jsx("aside",{className:"hidden w-72 shrink-0 lg:block",children:e.jsxs("div",{className:"sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-border/70 bg-card/90 p-3 shadow-card",children:[e.jsx("p",{className:"px-3 pb-2 text-xs font-semibold text-muted-foreground",children:"Documentation"}),e.jsx("nav",{className:"space-y-1",children:m.map(r=>e.jsxs("button",{type:"button",onClick:()=>c(r.id),"aria-current":s===r.id?"page":void 0,className:y("w-full rounded-xl px-3 py-2.5 text-left transition-colors",s===r.id?"bg-primary text-primary-foreground shadow-sm":"text-muted-foreground hover:bg-muted hover:text-foreground"),children:[e.jsx("span",{className:"block text-sm font-semibold",children:r.label}),e.jsx("span",{className:y("mt-0.5 block text-xs",s===r.id?"text-primary-foreground/75":"text-muted-foreground"),children:r.description})]},r.id))})]})}),e.jsxs("section",{id:s,className:"min-w-0 flex-1","aria-labelledby":"docs-active-section-title",children:[e.jsxs("div",{className:"mb-4 lg:hidden",children:[e.jsx("label",{className:"mb-2 block text-xs font-semibold text-muted-foreground",children:"Documentation section"}),e.jsx("select",{value:s,onChange:r=>c(r.target.value),className:"w-full rounded-xl border border-border bg-card px-3 py-3 text-sm outline-none focus:border-primary",children:m.map(r=>e.jsx("option",{value:r.id,children:r.label},r.id))})]}),e.jsxs("div",{className:"overflow-hidden rounded-3xl border border-border/70 bg-card shadow-card",children:[e.jsxs("header",{className:"border-b border-border/70 bg-gradient-to-r from-primary/10 via-background to-background p-5 sm:p-7",children:[e.jsx("p",{className:"text-xs font-semibold text-primary",children:o.label}),e.jsx("h2",{id:"docs-active-section-title",className:"mt-2 text-2xl font-bold tracking-tight text-foreground",children:o.description})]}),e.jsxs("div",{className:"min-w-0 p-4 sm:p-6 lg:p-8",children:[s==="introduction"&&e.jsx(S,{}),s==="authentication"&&e.jsx(j,{}),s==="environments"&&e.jsx(R,{}),s==="responses"&&e.jsx(P,{}),s==="ip-whitelist"&&e.jsx(O,{}),s==="services"&&e.jsx(w,{}),s==="nin"&&e.jsx(D,{}),s==="bvn"&&e.jsx(k,{}),s==="cac"&&e.jsx(q,{}),s==="tin"&&e.jsx(L,{}),s==="face"&&e.jsx(B,{}),s==="liveness-sdk"&&e.jsx(_,{}),s==="credit"&&e.jsx(V,{}),s==="live-address"&&e.jsx(F,{}),s==="address"&&e.jsx(M,{}),s==="driver"&&e.jsx(U,{}),s==="voters"&&e.jsx(K,{}),s==="digital"&&e.jsx(G,{}),s==="webhooks"&&e.jsx(H,{}),s==="errors"&&e.jsx(Y,{}),s==="golive"&&e.jsx(J,{})]})]})]})]})]})})}function n({title:s,children:i}){return e.jsxs("div",{className:"rounded-2xl border border-border/70 bg-background/70 p-4",children:[e.jsx("h3",{className:"font-semibold text-foreground",children:s}),e.jsx("div",{className:"mt-2 text-sm leading-6 text-muted-foreground",children:i})]})}function S(){return e.jsxs("div",{className:"space-y-5",children:[e.jsx("p",{className:"text-sm leading-6 text-muted-foreground",children:"Merchant APIs are designed for server-to-server integration. Use your API key from the dashboard, send customer consent details where required and store the returned reference for tracking or webhook reconciliation."}),e.jsxs("div",{className:"grid gap-4 md:grid-cols-3",children:[e.jsxs(n,{title:"API-key only",children:["All merchant endpoints require ",e.jsx("code",{children:"x-api-key"}),". Do not expose your key in mobile apps or browsers."]}),e.jsx(n,{title:"Clean JSON",children:"Merchant API responses focus on result data and avoid dashboard-only internal objects."}),e.jsx(n,{title:"Wallet powered",children:"Requests debit the merchant wallet where a paid service is used."})]}),e.jsx(a,{language:"http",code:`Base URL: https://api.identro.ng
Merchant API prefix: /merchant-api
Internal dashboard API prefix: /api/v1`})]})}function j(){return e.jsxs("div",{className:"space-y-5",children:[e.jsx(t,{method:"POST",path:"/merchant-api/nin/verify",title:"Authenticated merchant request",desc:"Send x-api-key with every merchant API request. Use idempotencyKey for safe retries.",req:`{
  "nin": "12345678901",
  "forceRefresh": false,
  "consentCaptured": true,
  "consentReference": "APP-CONSENT-001",
  "idempotencyKey": "NIN-VERIFY-001"
}`,res:v}),e.jsx(E,{examples:[{lang:"cURL",code:`curl -X POST https://api.identro.ng/merchant-api/nin/verify \\
  -H "x-api-key: $IDENTRO_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"nin":"12345678901","consentCaptured":true,"consentReference":"APP-CONSENT-001"}'`},{lang:"JavaScript",code:`const response = await fetch("https://api.identro.ng/merchant-api/nin/verify", {
  method: "POST",
  headers: {
    "x-api-key": process.env.IDENTRO_API_KEY!,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    nin: "12345678901",
    consentCaptured: true,
    consentReference: "APP-CONSENT-001",
    idempotencyKey: "NIN-VERIFY-001"
  })
});

const result = await response.json();`},{lang:"PHP",code:`$payload = [
  "nin" => "12345678901",
  "consentCaptured" => true,
  "consentReference" => "APP-CONSENT-001"
];

$ch = curl_init("https://api.identro.ng/merchant-api/nin/verify");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => ["x-api-key: $apiKey", "Content-Type: application/json"],
  CURLOPT_POSTFIELDS => json_encode($payload),
  CURLOPT_RETURNTRANSFER => true,
]);
$response = curl_exec($ch);`}]})]})}function R(){return e.jsxs("div",{className:"space-y-4",children:[e.jsx(n,{title:"Sandbox",children:e.jsx("code",{children:"https://sandbox.api.identro.ng/api/v1"})}),e.jsx(n,{title:"Live",children:e.jsx("code",{children:"https://api.identro.ng/api/v1"})}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Use sandbox keys while testing. Switch to live keys only after approval, IP whitelist and webhook testing are complete."})]})}function P(){return e.jsxs("div",{className:"space-y-5",children:[e.jsx("p",{className:"text-sm leading-6 text-muted-foreground",children:"Successful merchant responses use a consistent Identro wrapper. Provider changes do not alter the merchant response contract, and upstream provider names are never exposed. Identro checks its normalized central cache before making a live call. Internal cache flags, provider metadata, wallet transaction IDs and pricing internals are not returned."}),e.jsx(a,{language:"json",code:`{
  "success": true,
  "code": "SUCCESS",
  "message": "Request successful",
  "data": {
    "nin": "12345678901",
    "firstName": "KEHINDE",
    "middleName": "",
    "lastName": "OYENUGA",
    "dateOfBirth": "1992-04-02",
    "gender": "Male",
    "phoneNumber": "09039362222",
    "email": "customer@example.com",
    "address": "12 Example Street, Abuja",
    "state": "FCT",
    "lga": "AMAC",
    "photo": "base64-image-from-verification-source"
  }
}`}),e.jsx(a,{language:"json",code:`{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Invalid request payload",
  "errors": [
    {
      "field": "nin",
      "message": "NIN must be 11 digits"
    }
  ]
}`})]})}function O(){return e.jsxs("div",{className:"space-y-5",children:[e.jsx("p",{className:"text-sm leading-6 text-muted-foreground",children:"Merchants can manage trusted public IPv4 addresses from Dashboard → Settings → API IP whitelist. If the list is empty, any public IP with a valid API key can call merchant APIs. If at least one IP is saved, requests must originate from one of the saved IPs."}),e.jsx(t,{method:"GET",path:"/api/v1/api-keys/ip-whitelist",title:"Get dashboard whitelist",desc:"JWT dashboard endpoint for viewing the current API IP whitelist.",res:`{
  "success": true,
  "data": {
    "accessMode": "IP_RESTRICTED",
    "allowedIps": ["102.89.1.10", "41.190.0.2"],
    "allowedIpCount": 2,
    "affectedApiKeyCount": 3
  }
}`}),e.jsx(t,{method:"PATCH",path:"/api/v1/api-keys/ip-whitelist",title:"Update dashboard whitelist",desc:"JWT dashboard endpoint for replacing the whitelist across merchant API keys.",req:`{
  "allowedIps": ["102.89.1.10", "41.190.0.2"]
}`,res:`{
  "success": true,
  "message": "API IP whitelist updated successfully",
  "data": {
    "accessMode": "IP_RESTRICTED",
    "allowedIps": ["102.89.1.10", "41.190.0.2"],
    "allowedIpCount": 2
  }
}`})]})}function w(){return e.jsxs("div",{className:"space-y-5",children:[e.jsx(t,{method:"GET",path:"/merchant-api/services",title:"List merchant services",desc:"Return available merchant services and customer-facing prices.",res:`{
  "success": true,
  "data": [
    {
      "code": "MERCHANT_NIN_JSON_VERIFICATION",
      "name": "NIN JSON Verification",
      "category": "IDENTITY",
      "amount": "250.00",
      "active": true
    },
    {
      "code": "CAC_NAME_SEARCH",
      "name": "CAC Name Search",
      "category": "BUSINESS",
      "amount": "300.00",
      "active": true
    },
    {
      "code": "CREDIT_HISTORY_LOOKUP",
      "name": "Credit History Lookup",
      "category": "FINANCIAL",
      "amount": "700.00",
      "active": true
    },
    {
      "code": "LIVE_ADDRESS_LOOKUP",
      "name": "Meter Address Lookup",
      "category": "ADDRESS",
      "amount": "300.00",
      "active": true
    }
  ]
}`}),e.jsx(t,{method:"POST",path:"/merchant-api/services/quote",title:"Quote service",desc:"Get the amount payable before submitting a request.",req:`{
  "serviceType": "MERCHANT_BVN_JSON_VERIFICATION"
}`,res:`{
  "success": true,
  "data": {
    "serviceType": "MERCHANT_BVN_JSON_VERIFICATION",
    "serviceName": "BVN JSON Verification",
    "amount": "250.00",
    "currency": "NGN"
  }
}`})]})}function D(){return e.jsxs("div",{className:"space-y-5",children:[e.jsx(t,{method:"POST",path:"/merchant-api/nin/verify",title:"Verify NIN JSON",desc:"Verify NIN and receive the full customer identity payload returned by Identro verification/cache, including phone, address and photo where available.",req:`{
  "nin": "12345678901",
  "forceRefresh": false,
  "consentCaptured": true,
  "consentReference": "APP-CONSENT-001",
  "idempotencyKey": "NIN-VERIFY-001"
}`,res:v}),e.jsx(t,{method:"POST",path:"/merchant-api/nin/requests",title:"Create NIN request",desc:"Create a NIN request that can also be tracked from dashboard/history.",req:`{
  "serviceType": "BASIC_NIN_VERIFICATION",
  "nin": "12345678901",
  "consentCaptured": true,
  "consentReference": "APP-CONSENT-002"
}`,res:`{
  "success": true,
  "message": "Verification completed successfully",
  "data": {
    "reference": "NIN-7D2C9B1A",
    "serviceType": "BASIC_NIN_VERIFICATION",
    "status": "VERIFIED",
    "amount": "500.00",
    "identity": {
      "nin": "12345678901",
      "firstName": "KEHINDE",
      "middleName": "",
      "lastName": "OYENUGA",
      "gender": "M",
      "dateOfBirth": "1994-01-01",
      "phoneNumber": "08030000000"
    },
    "submittedAt": "2026-06-21T12:00:00.000Z",
    "completedAt": "2026-06-21T12:00:02.000Z"
  }
}`}),e.jsx(t,{method:"GET",path:"/merchant-api/nin/requests/:reference",title:"Retrieve NIN request",desc:"Fetch a NIN request result by reference.",res:v})]})}function k(){return e.jsxs("div",{className:"space-y-5",children:[e.jsx(t,{method:"POST",path:"/merchant-api/bvn/verify",title:"Verify BVN JSON",desc:"Verify BVN and receive the full customer identity payload returned by Identro verification/cache, including phone, address and photo where available.",req:`{
  "bvn": "22123456789",
  "forceRefresh": false,
  "consentCaptured": true,
  "consentReference": "APP-CONSENT-003",
  "idempotencyKey": "BVN-VERIFY-001"
}`,res:f}),e.jsx(t,{method:"POST",path:"/merchant-api/bvn/requests",title:"Create BVN request",desc:"Create a BVN verification request for tracking.",req:`{
  "serviceType": "BASIC_BVN_VERIFICATION",
  "bvn": "22123456789",
  "consentCaptured": true,
  "consentReference": "APP-CONSENT-004"
}`,res:f}),e.jsx(t,{method:"GET",path:"/merchant-api/bvn/requests/:reference",title:"Retrieve BVN request",desc:"Fetch a BVN request result by reference.",res:f})]})}function q(){return e.jsxs("div",{className:"space-y-5",children:[e.jsxs("p",{className:"text-sm leading-6 text-muted-foreground",children:["CAC identifiers must include the registration prefix, for example"," ",e.jsx("code",{children:"RC1684989"}),", ",e.jsx("code",{children:"BN1234567"})," or ",e.jsx("code",{children:"IT1234567"}),". Name Search checks exact and similar registered names. CAC Basic returns core company registration details, while CAC Advanced returns the richer company profile, directors, shareholders and other stakeholders where available."]}),e.jsx(t,{method:"GET",path:"/merchant-api/cac/name-search/quote",title:"Quote CAC Name Search",desc:"Return the current merchant price before running a company-name search.",res:`{
  "success": true,
  "data": {
    "serviceType": "CAC_NAME_SEARCH",
    "serviceName": "CAC Name Search",
    "amount": "300.00",
    "currency": "NGN"
  }
}`}),e.jsx(t,{method:"POST",path:"/merchant-api/cac/name-search",title:"Search CAC Business Names",desc:"Search exact and similar CAC business names before registration. This is an indicative search; final approval remains subject to CAC name reservation.",req:`{
  "q": "Syrol Technologies Limited",
  "exact": false,
  "idempotencyKey": "CAC-NAME-001"
}`,res:`{
  "success": true,
  "message": "CAC name search completed",
  "data": {
    "reference": "CAC-SEARCH-7D2C9B1A",
    "status": "COMPLETED",
    "query": "SYROL TECHNOLOGIES LIMITED",
    "exactMatchFound": true,
    "totalMatches": 2,
    "matches": [
      {
        "companyName": "SYROL TECHNOLOGIES LIMITED",
        "registrationNumber": "RC1684989",
        "classification": "COMPANY"
      }
    ]
  }
}`}),e.jsx(t,{method:"POST",path:"/merchant-api/cac/basic",title:"CAC Basic Verification",desc:"Verify a Nigerian business using an RC/BN/IT-prefixed registration number.",req:`{
  "serviceType": "CAC_BASIC_VERIFICATION",
  "registrationNumber": "RC1684989",
  "companyType": "COMPANY",
  "consentCaptured": true,
  "idempotencyKey": "CAC-BASIC-001"
}`,res:`{
  "success": true,
  "message": "Verification completed successfully",
  "data": {
    "reference": "CAC-BASIC-001",
    "status": "COMPLETED",
    "companyName": "SYROL TECHNOLOGIES LIMITED",
    "registrationNumber": "RC1684989",
    "companyType": "COMPANY",
    "registrationStatus": "ACTIVE"
  }
}`}),e.jsx(t,{method:"POST",path:"/merchant-api/cac/advance",title:"CAC Advanced Verification",desc:"Retrieve the normalized Identro company profile with directors, shareholders, persons with significant control, secretary, objectives, share details and report links where available.",req:`{
  "serviceType": "CAC_ADVANCE_VERIFICATION",
  "registrationNumber": "RC1684989",
  "companyType": "COMPANY",
  "consentCaptured": true,
  "idempotencyKey": "CAC-ADV-001"
}`}),e.jsx(t,{method:"GET",path:"/merchant-api/cac/requests",title:"List CAC Requests",desc:"List CAC name searches, basic checks and advanced verification history for this merchant."}),e.jsx(t,{method:"GET",path:"/merchant-api/cac/requests/:reference",title:"Retrieve CAC Request",desc:"Fetch the normalized CAC result by reference."}),e.jsx(t,{method:"GET",path:"/merchant-api/cac/requests/:reference/status-report",title:"Download CAC Status Report",desc:"Retrieve the available CAC status-report PDF as base64 with filename and content type. The endpoint returns a report only when one is available for the completed request."}),e.jsx(a,{language:"text",code:`Company type values:
BUSINESS_NAME
COMPANY
INCORPORATED_TRUSTEES
LIMITED_PARTNERSHIP
LIMITED_LIABILITY_PARTNERSHIP`})]})}function L(){return e.jsxs("div",{className:"space-y-5",children:[e.jsx(t,{method:"POST",path:"/merchant-api/tin/verify",title:"Business TIN Verification",desc:"Verify a company TIN using CAC RC/BN/IT number and company type.",req:`{
  "serviceType": "TIN_VALIDATION",
  "registrationNumber": "RC1684989",
  "companyType": "COMPANY",
  "consentCaptured": true,
  "idempotencyKey": "TIN-VERIFY-001"
}`,res:`{
  "success": true,
  "message": "TIN verification completed successfully",
  "data": {
    "reference": "TIN-F4A1289C",
    "serviceType": "TIN_VALIDATION",
    "status": "VERIFIED",
    "companyName": "SYROL TECHNOLOGIES LIMITED",
    "taxId": "22622199-0001",
    "rcNumber": "1684989",
    "companyType": "COMPANY"
  }
}`}),e.jsx(t,{method:"POST",path:"/merchant-api/tin/requests",title:"Create TIN request",desc:"Create a TIN verification request for tracking. Same payload as /verify."}),e.jsx(t,{method:"GET",path:"/merchant-api/tin/requests",title:"List TIN requests",desc:"List TIN verification history."}),e.jsx(t,{method:"GET",path:"/merchant-api/tin/requests/:reference",title:"Retrieve TIN request",desc:"Fetch TIN request status and result."})]})}function B(){return e.jsxs("div",{className:"space-y-5",children:[e.jsxs("p",{className:"text-sm leading-6 text-muted-foreground",children:["Face verification supports snapshot face match, selfie quality, duplicate face checks and real-time liveness flows. Send"," ",e.jsx("code",{children:"submittedFaceBase64"})," for snapshot checks. For NIN/BVN matching, Identro returns the customer identity payload and result without exposing any underlying provider or technology."]}),e.jsx(t,{method:"POST",path:"/merchant-api/face/requests",title:"Face match against NIN",desc:"Compare submitted face against the NIN photo.",req:`{
  "serviceType": "FACE_MATCH_NIN",
  "sourceType": "NIN",
  "nin": "12345678901",
  "submittedFaceBase64": "data:image/jpeg;base64,...",
  "consentCaptured": true,
  "consentReference": "APP-CONSENT-006",
  "idempotencyKey": "FACE-NIN-001"
}`,res:p("NIN","12345678901")}),e.jsx(t,{method:"POST",path:"/merchant-api/face/requests",title:"Face match against BVN",desc:"Compare submitted face against the BVN photo.",req:`{
  "serviceType": "FACE_MATCH_BVN",
  "sourceType": "BVN",
  "bvn": "22123456789",
  "submittedFaceBase64": "data:image/jpeg;base64,...",
  "consentCaptured": true,
  "consentReference": "APP-CONSENT-007",
  "idempotencyKey": "FACE-BVN-001"
}`,res:p("BVN","22123456789")}),e.jsx(t,{method:"POST",path:"/merchant-api/face/requests",title:"Face match against uploaded reference",desc:"Compare submitted face against a merchant-provided reference image.",req:`{
  "serviceType": "FACE_MATCH_AND_LIVENESS",
  "sourceType": "UPLOADED_REFERENCE",
  "referenceFaceBase64": "data:image/jpeg;base64,...",
  "submittedFaceBase64": "data:image/jpeg;base64,...",
  "consentCaptured": true,
  "consentReference": "APP-CONSENT-008"
}`,res:p("UPLOADED_REFERENCE","UPLOADED-REF-001")}),e.jsx(t,{method:"POST",path:"/merchant-api/face/liveness/sessions",title:"Create liveness session",desc:"Create a secure liveness-only, liveness + NIN, liveness + BVN or liveness + uploaded-reference session.",req:`{
  "serviceType": "FACE_LIVENESS_BVN",
  "sourceType": "BVN",
  "bvn": "22123456789",
  "consentCaptured": true,
  "consentReference": "APP-CONSENT-009",
  "idempotencyKey": "LIVE-BVN-001"
}`,res:W}),e.jsx(t,{method:"POST",path:"/merchant-api/face/liveness/sessions/:reference/credentials",title:"Get capture credentials",desc:"Returns short-lived capture credentials used by the liveness SDK. Do not store them.",res:$}),e.jsx(t,{method:"POST",path:"/merchant-api/face/liveness/sessions/:reference/complete",title:"Complete liveness session",desc:"Finalize the capture and return the liveness and optional face-match result.",res:z}),e.jsx(t,{method:"GET",path:"/merchant-api/face/requests/:reference",title:"Retrieve face request",desc:"Fetch face match or liveness status and result by reference.",res:p("NIN","12345678901")})]})}function _(){const s=["Fullscreen camera with automatic liveness start","Passive guided capture and provider-neutral active mode","Vertical oval guide, stepped corner frame and clear capture area","Brand colours cascade across camera, header, guide and actions","Liveness only, BVN, NIN and reference-image matching","Responsive snapshot controls for short mobile screens"];return e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"rounded-3xl border border-primary/15 bg-primary/5 p-5 sm:p-6",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsx("span",{className:"rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground",children:"React / Next.js SDK v1.3.0"}),e.jsx("span",{className:"rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground",children:"React 18.2 and React 19"})]}),e.jsx("h3",{className:"mt-4 text-xl font-semibold text-foreground",children:"Branded liveness and face-match flows for React, Vite and Next.js"}),e.jsx("p",{className:"mt-2 text-sm leading-6 text-muted-foreground",children:"Version 1.3.0 brings the React package in line with the Flutter capture experience, with automatic start, a fullscreen guided camera, provider-neutral capture modes and deeper branding control."}),e.jsxs("div",{className:"mt-4 flex flex-wrap gap-3",children:[e.jsx(x,{asChild:!0,size:"sm",children:e.jsx("a",{href:"https://www.npmjs.com/package/identro-liveness-react",target:"_blank",rel:"noreferrer",children:"Open npm package"})}),e.jsx(x,{asChild:!0,size:"sm",variant:"outline",children:e.jsx("a",{href:"#sdk-quick-start",children:"Jump to quick start"})})]})]}),e.jsx("div",{className:"grid gap-3 md:grid-cols-2",children:s.map(i=>e.jsx("div",{className:"rounded-2xl border border-border bg-card p-4 text-sm font-medium text-foreground shadow-sm",children:i},i))}),e.jsxs("div",{className:"grid gap-3 md:grid-cols-3",children:[e.jsxs(n,{title:"Default capture",children:[e.jsx("code",{children:'captureMode="passive"'})," uses the packaged fullscreen guided camera and compressed snapshot flow."]}),e.jsxs(n,{title:"Active capture",children:[e.jsx("code",{children:'captureMode="active"'})," renders the configured provider-neutral active-liveness detector inside the same branded shell."]}),e.jsx(n,{title:"Production security",children:"Keep permanent merchant API keys on your backend and connect the SDK through secure handler or proxy functions."})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold",children:"Requirements"}),e.jsxs("ul",{className:"mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground",children:[e.jsx("li",{children:"React 18.2 or React 19."}),e.jsx("li",{children:"A browser with camera support."}),e.jsx("li",{children:"HTTPS in production for camera access."}),e.jsx("li",{children:"An Identro merchant API key or merchant backend proxy."}),e.jsx("li",{children:"Liveness services enabled on the merchant account."})]})]}),e.jsxs("div",{id:"sdk-quick-start",className:"scroll-mt-28",children:[e.jsx("h3",{className:"text-lg font-semibold",children:"Install v1.3.0"}),e.jsx(a,{language:"bash",code:"npm install identro-liveness-react@^1.3.0 react react-dom"})]}),e.jsx("h3",{className:"text-lg font-semibold",children:"React / Vite quick start"}),e.jsx(a,{language:"tsx",code:`import { IdentroLiveness } from 'identro-liveness-react';

export function LivenessPage() {
  return (
    <IdentroLiveness
      baseUrl="https://api.identro.ng/api/v1"
      apiKey="identro_live_xxxxx"
      captureMode="passive"
      request={{
        serviceType: 'FACE_LIVENESS_ONLY',
        sourceType: 'UPLOADED_REFERENCE',
        consentCaptured: true,
        consentReference: 'CUSTOMER-CONSENT-001',
        idempotencyKey: 'LIVE-001'
      }}
      onCompleted={(result) => console.log('Identro result', result)}
      onCancel={() => console.log('User cancelled')}
      onError={(error) => console.error('Identro liveness failed', error)}
    />
  );
}`}),e.jsx("h3",{className:"text-lg font-semibold",children:"Next.js client component"}),e.jsx(a,{language:"tsx",code:`'use client';

import { IdentroLiveness } from 'identro-liveness-react';

export default function LivenessPage() {
  return (
    <IdentroLiveness
      baseUrl={process.env.NEXT_PUBLIC_IDENTRO_BASE_URL!}
      captureMode="passive"
      request={{
        serviceType: 'FACE_LIVENESS_NIN',
        sourceType: 'NIN',
        nin: '12345678901',
        consentCaptured: true,
        consentReference: 'WEB-CONSENT-001',
        idempotencyKey: 'LIVE-NIN-001'
      }}
      handlers={merchantProxyHandlers}
    />
  );
}`}),e.jsx("h3",{className:"text-lg font-semibold",children:"BVN, NIN and reference matching"}),e.jsx(a,{language:"tsx",code:`// BVN match
request={{
  serviceType: 'FACE_LIVENESS_BVN',
  sourceType: 'BVN',
  bvn: '22123456789',
  consentCaptured: true,
  consentReference: 'BVN-CONSENT-001',
  idempotencyKey: 'LIVE-BVN-001'
}}

// NIN match
request={{
  serviceType: 'FACE_LIVENESS_NIN',
  sourceType: 'NIN',
  nin: '12345678901',
  consentCaptured: true,
  consentReference: 'NIN-CONSENT-001',
  idempotencyKey: 'LIVE-NIN-001'
}}

// Reference image match
request={{
  serviceType: 'FACE_LIVENESS_REFERENCE',
  sourceType: 'UPLOADED_REFERENCE',
  referenceFaceBase64: 'data:image/jpeg;base64,...',
  consentCaptured: true,
  consentReference: 'REFERENCE-CONSENT-001',
  idempotencyKey: 'LIVE-REF-001'
}}`}),e.jsx("h3",{className:"text-lg font-semibold",children:"Full branding customization"}),e.jsx("p",{className:"text-sm leading-6 text-muted-foreground",children:"A custom primary colour now flows through every unspecified non-semantic SDK surface. More specific camera, top-bar, guide and powered-by values can still override it. When a merchant name is supplied without a logo, the SDK generates a merchant monogram instead of showing the Identro icon."}),e.jsx(a,{language:"tsx",code:`<IdentroLiveness
  baseUrl="https://api.identro.ng/api/v1"
  apiKey="identro_live_xxxxx"
  request={request}
  branding={{
    name: 'MyBank',
    subtitle: 'Secure customer verification',
    logoUrl: '/mybank-logo.svg',
    primaryColor: '#7C2D12',
    accentColor: '#F59E0B',
    cameraBackground: '#7C2D12',
    topBarBackground: '#7C2D12',
    topBarBorderColor: '#7C2D12',
    fullscreenCamera: true,
    showTopBar: true,
    showActionButtons: false,
    guideDashed: true,
    guideStrokeWidth: 3.5,
    guideGlowColor: '#7C2D12',
    guideWidthFactor: 0.54,
    guideHeightFactor: 0.62,
    guideAspectRatio: 0.72,
    showCornerFrame: true,
    cornerFrameStrokeWidth: 4,
    cornerFrameLength: 36,
    cornerFrameRadius: 18,
    cornerFramePadding: 28,
    overlayOpacity: 0.8,
    centerHighlightOpacity: 0.08,
    showPoweredBy: true
  }}
/>`}),e.jsx("h3",{className:"text-lg font-semibold",children:"Text customization"}),e.jsx(a,{language:"tsx",code:`text={{
  appBarTitle: 'Face verification',
  subtitle: 'Center your face and follow the guide.',
  creatingSession: 'Preparing secure verification...',
  capturing: 'Hold still and keep your face inside the guide',
  snapshotCountdownCompact: 'Capturing in',
  processing: 'Finalizing your verification...',
  passed: 'Verification successful',
  review: 'Verification needs review',
  failed: 'Verification failed',
  retry: 'Try again',
  cancel: 'Cancel',
  poweredBy: 'Powered by',
  poweredByBrand: 'Identro'
}}`}),e.jsx("h3",{className:"text-lg font-semibold",children:"Secure backend-proxy mode"}),e.jsxs("p",{className:"text-sm leading-6 text-muted-foreground",children:["Public browser applications should not expose permanent merchant API keys. Implement these handlers against your own backend, and let your backend call Identro with the private ",e.jsx("code",{children:"x-api-key"})," header."]}),e.jsx(a,{language:"tsx",code:`<IdentroLiveness
  baseUrl="https://merchant.example.com"
  request={request}
  handlers={{
    async createSession(request) {
      const response = await fetch('/api/identro/liveness/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request)
      });
      if (!response.ok) throw new Error('Unable to create liveness session');
      return response.json();
    },
    async getCredentials(reference) {
      const response = await fetch(
        '/api/identro/liveness/' + encodeURIComponent(reference) + '/credentials',
        { method: 'POST' }
      );
      if (!response.ok) throw new Error('Unable to prepare liveness session');
      return response.json();
    },
    async completeSession(reference, session, payload) {
      const response = await fetch(
        '/api/identro/liveness/' + encodeURIComponent(reference) + '/complete',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      if (!response.ok) throw new Error('Unable to complete liveness session');
      return response.json();
    }
  }}
/>`}),e.jsx("h3",{className:"text-lg font-semibold",children:"Install Flutter package"}),e.jsx(a,{language:"bash",code:"flutter pub add identro_liveness_flutter"}),e.jsx(a,{language:"dart",code:`import 'package:identro_liveness_flutter/identro_liveness_flutter.dart';

IdentroLiveness(
  baseUrl: 'https://api.identro.ng/api/v1',
  apiKey: 'identro_live_xxxxx',
  request: const IdentroLivenessRequest(
    serviceType: IdentroLivenessServiceType.faceLivenessBvn,
    sourceType: IdentroFaceSourceType.bvn,
    bvn: '22123456789',
    consentCaptured: true,
    consentReference: 'MOBILE-CONSENT-001',
  ),
  onCompleted: (result) {
    debugPrint(result.toJson().toString());
  },
)`}),e.jsx("h3",{className:"text-lg font-semibold",children:"Production checklist"}),e.jsx(a,{language:"text",code:`Use HTTPS for browser camera access
Keep permanent merchant API keys on your backend
Allow Content-Type, Accept, Authorization and x-api-key headers
Allow GET, POST and OPTIONS methods
Increase request-body limits for compressed passive camera frames
Confirm the selected liveness service is enabled and the merchant wallet is funded`})]})}function V(){return e.jsxs("div",{className:"space-y-5",children:[e.jsx("p",{className:"text-sm leading-6 text-muted-foreground",children:"Retrieve a normalized credit report using BVN. Customer consent is mandatory, the request is wallet-billed, and every response includes a reference that can be used for reconciliation."}),e.jsx(t,{method:"GET",path:"/merchant-api/credit-history/quote",title:"Quote Credit History",desc:"Return the current merchant-specific price before submitting a lookup.",res:`{
  "status": true,
  "message": "Credit history quote retrieved",
  "data": {
    "serviceCode": "CREDIT_HISTORY_LOOKUP",
    "name": "Credit History Lookup",
    "amount": "700.00",
    "requiresConsent": true,
    "workflowType": "AUTOMATED",
    "pricing": {}
  }
}`}),e.jsx(t,{method:"POST",path:"/merchant-api/credit-history/verify",title:"Run Credit History Lookup",desc:"Run a BVN lookup against CRC, XDS/FirstCentral, or all supported bureaus. POST /requests is an alias.",req:`{
  "bvn": "22400000012",
  "provider": "all",
  "consentCaptured": true,
  "consentReference": "CREDIT-CONSENT-001",
  "idempotencyKey": "CREDIT-001",
  "forceRefresh": false
}`,res:`{
  "status": true,
  "message": "Credit history lookup completed",
  "data": {
    "id": "f94f1fd2-9455-47f0-9ff4-47313d915485",
    "reference": "SRV-564D2FE3AD3145F887",
    "status": "COMPLETED",
    "amount": "700.00",
    "requestPayload": {
      "bvn": "224*****205",
      "bureau": "all",
      "serviceType": "CREDIT_HISTORY_LOOKUP"
    },
    "resultPayload": {
      "customerName": "CUSTOMER NAME",
      "verificationOutcome": "VERIFIED",
      "profile": {
        "full_name": "CUSTOMER NAME",
        "phone_number": ["08000000000"],
        "email_address": ["customer@example.com"],
        "address_history": [],
        "identifications": []
      },
      "credit_history": [
        {
          "institution": "Example Bank",
          "history": [
            {
              "currency": "NGN",
              "loan_status": "closed",
              "performance_status": "performing",
              "opening_balance": 5000000,
              "repayment_amount": 5000000,
              "repayment_schedule": []
            }
          ]
        }
      ],
      "actionHistory": []
    }
  }
}`}),e.jsx(E,{examples:[{lang:"cURL",code:`curl -X POST https://api.identro.ng/merchant-api/credit-history/verify \\
  -H "x-api-key: $IDENTRO_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"bvn":"22400000012","provider":"all","consentCaptured":true,"consentReference":"CREDIT-CONSENT-001","idempotencyKey":"CREDIT-001"}'`},{lang:"JavaScript",code:`const response = await fetch(
  "https://api.identro.ng/merchant-api/credit-history/verify",
  {
    method: "POST",
    headers: {
      "x-api-key": process.env.IDENTRO_API_KEY!,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      bvn: "22400000012",
      provider: "all",
      consentCaptured: true,
      consentReference: "CREDIT-CONSENT-001",
      idempotencyKey: "CREDIT-001"
    })
  }
);
const result = await response.json();`}]}),e.jsx(t,{method:"GET",path:"/merchant-api/credit-history/requests",title:"List Credit History Requests",desc:"List requests using page, limit, status, search, date and sort filters. Records are returned in data.data and pagination in data.meta.",res:`{
  "status": true,
  "message": "Credit history requests retrieved",
  "data": {
    "data": [],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}`}),e.jsx(t,{method:"GET",path:"/merchant-api/credit-history/requests/:id",title:"Retrieve Credit History Request",desc:"Fetch the complete report by request UUID or SRV-* reference."}),e.jsx(a,{language:"text",code:`Provider values: crc | xds | all
Required: bvn, consentCaptured=true
Recommended: consentReference, idempotencyKey
Keep x-api-key on your server and store the returned SRV-* reference.`})]})}function F(){return e.jsxs("div",{className:"space-y-5",children:[e.jsx("p",{className:"text-sm leading-6 text-muted-foreground",children:"Live Address Lookup compares the submitted address with the electricity meter record. A match completes successfully; a no-match returns a terminal failed verification outcome with a reason. Results are centrally cached by meter number, distribution company and normalized submitted address."}),e.jsx(t,{method:"GET",path:"/merchant-api/address-lookup/quote",title:"Quote Meter Address Lookup",desc:"Return the current merchant price for live meter-address verification.",res:`{
  "status": true,
  "message": "Address lookup quote retrieved",
  "data": {
    "serviceType": "LIVE_ADDRESS_LOOKUP",
    "amount": "300.00",
    "currency": "NGN"
  }
}`}),e.jsx(t,{method:"POST",path:"/merchant-api/address-lookup/verify",title:"Verify Address By Meter",desc:"Compare a submitted address with the electricity meter record. The /requests alias accepts the same payload.",req:`{
  "discoCode": "ABUJA",
  "meterNumber": "45701150570",
  "address": "Plot 631, Jodhis Avenue, Dawaki",
  "idempotencyKey": "ADDRESS-METER-001",
  "forceRefresh": false
}`,res:`{
  "status": true,
  "message": "Address lookup completed",
  "data": {
    "reference": "LADDR-7D2C9B1A",
    "status": "COMPLETED",
    "verificationPassed": true,
    "verificationOutcome": "VERIFIED",
    "meterNumber": "45701150570",
    "discoCode": "ABUJA",
    "submittedAddress": "Plot 631, Jodhis Avenue, Dawaki",
    "matchedAddress": "Plot 631, Jodhis Avenue, Dawaki"
  }
}`}),e.jsx(t,{method:"GET",path:"/merchant-api/address-lookup/requests",title:"List Meter Address Requests",desc:"List live meter-address lookup records. Pagination and status filters are supported."}),e.jsx(t,{method:"GET",path:"/merchant-api/address-lookup/requests/:id",title:"Retrieve Meter Address Request",desc:"Fetch the normalized address comparison, confidence result and terminal outcome."}),e.jsx(a,{language:"text",code:`Supported discoCode values include:
ABUJA, EKO, IKEJA, IBADAN, ENUGU, PH, JOS, KADUNA, KANO, BH,
PROTOGY, PHISBOND, ACCESSPOWER, YOLA, ABIA, ADAMAWA, AKWA IBOM,
ANAMBRA, BAUCHI, BAYELSA, BENUE, BORNO, CROSS RIVER, DELTA, EBONYI,
EDO, EKITI, GOMBE, IMO, JIGAWA, KATSINA, KEBBI, KOGI, KWARA, LAGOS,
NASSARAWA, NIGER, OGUN, ONDO, OSUN, OYO, PLATEAU, RIVERS, SOKOTO,
TARABA, YOBE, ZAMFARA, FCT`})]})}function M(){return e.jsxs("div",{className:"space-y-5",children:[e.jsx("p",{className:"text-sm leading-6 text-muted-foreground",children:"These are non-live field or back-office verification requests. They use a review lifecycle and are separate from the instant meter-address lookup."}),e.jsx(t,{method:"POST",path:"/merchant-api/address-verification/requests",title:"Create address verification",desc:"Submit residential, business, office, guarantor or tenant address verification.",req:`{
  "serviceType": "ADDRESS_RESIDENTIAL_VERIFICATION",
  "subjectName": "Abubakar Musa",
  "phoneNumber": "08030000000",
  "email": "customer@example.com",
  "customerReference": "CUS-10001",
  "houseNumber": "12",
  "streetName": "Adetokunbo Ademola Crescent",
  "landmark": "Near Zenith Bank",
  "area": "Wuse 2",
  "city": "Abuja",
  "lga": "Municipal Area Council",
  "state": "FCT",
  "country": "Nigeria",
  "purpose": "Loan customer address verification",
  "preferredVisitDate": "2026-06-25",
  "preferredVisitTime": "10:00",
  "consentAccepted": true
}`,res:`{
  "success": true,
  "message": "Address verification request submitted successfully",
  "data": {
    "reference": "ADDR-20260621-0001",
    "serviceType": "ADDRESS_RESIDENTIAL_VERIFICATION",
    "status": "PENDING",
    "amount": "5000.00",
    "subject": {
      "name": "Abubakar Musa",
      "phoneNumber": "08030000000",
      "email": "customer@example.com"
    },
    "address": {
      "houseNumber": "12",
      "streetName": "Adetokunbo Ademola Crescent",
      "area": "Wuse 2",
      "city": "Abuja",
      "state": "FCT",
      "country": "Nigeria"
    },
    "submittedAt": "2026-06-21T12:00:00.000Z"
  }
}`}),e.jsx(t,{method:"GET",path:"/merchant-api/address-verification/requests/:reference",title:"Retrieve address request",desc:"Fetch current status, timeline and completion result.",res:`{
  "success": true,
  "data": {
    "reference": "ADDR-20260621-0001",
    "status": "COMPLETED",
    "outcome": "VERIFIED",
    "confidenceScore": 0.94,
    "reportUrl": "https://files.identro.ng/reports/ADDR-20260621-0001.pdf",
    "completedAt": "2026-06-22T14:15:00.000Z"
  }
}`}),e.jsx(t,{method:"GET",path:"/merchant-api/address-verification/requests",title:"List address requests",desc:"Filter by status, serviceType, state and date range."})]})}function U(){return e.jsxs("div",{className:"space-y-5",children:[e.jsx(t,{method:"POST",path:"/merchant-api/driver-license/verify",title:"Driver License Verification",desc:"Verify a Nigerian driver license number.",req:`{
  "serviceType": "DRIVER_LICENSE_VERIFICATION",
  "licenseNumber": "AAA00000AA00",
  "consentCaptured": true,
  "idempotencyKey": "DL-VERIFY-001"
}`}),e.jsx(t,{method:"POST",path:"/merchant-api/driver-license/requests",title:"Create driver license request",desc:"Create a driver license verification request for tracking. Same payload as /verify."}),e.jsx(t,{method:"GET",path:"/merchant-api/driver-license/requests",title:"List driver license requests",desc:"List driver license verification history."}),e.jsx(t,{method:"GET",path:"/merchant-api/driver-license/requests/:reference",title:"Retrieve driver license request",desc:"Fetch driver license request status and result."}),e.jsx(a,{language:"text",code:`Supported aliases:
/merchant-api/driver-license
/merchant-api/driver-licenses
/merchant-api/drivers-license
/merchant-api/driver-licence
/merchant-api/drivers-licence`})]})}function K(){return e.jsxs("div",{className:"space-y-5",children:[e.jsx(t,{method:"POST",path:"/merchant-api/voters-card/verify",title:"Voters Card Verification",desc:"Verify a voter using the Voter Identification Number (VIN).",req:`{
  "serviceType": "VOTERS_CARD_VERIFICATION",
  "vin": "91F6B1F5BE29535558655586",
  "consentCaptured": true,
  "idempotencyKey": "VIN-VERIFY-001"
}`}),e.jsx(t,{method:"POST",path:"/merchant-api/voters-card/requests",title:"Create voters card request",desc:"Create a voters card verification request for tracking. Same payload as /verify."}),e.jsx(t,{method:"GET",path:"/merchant-api/voters-card/requests",title:"List voters card requests",desc:"List voters card verification history."}),e.jsx(t,{method:"GET",path:"/merchant-api/voters-card/requests/:reference",title:"Retrieve voters card request",desc:"Fetch voters card request status and result."}),e.jsx(a,{language:"text",code:`Supported aliases:
/merchant-api/voters-card
/merchant-api/voter-card
/merchant-api/voters-id
/merchant-api/voter-id
/merchant-api/vin`})]})}function G(){return e.jsxs("div",{className:"space-y-5",children:[e.jsx(t,{method:"GET",path:"/merchant-api/digital-services/products",title:"List digital products",desc:"Fetch available airtime, data, bill and voucher products.",res:`{
  "success": true,
  "data": [
    {
      "code": "MTN_AIRTIME",
      "name": "MTN Airtime",
      "serviceType": "AIRTIME",
      "amount": "1000.00",
      "active": true
    },
    {
      "code": "IKEDC_PREPAID",
      "name": "IKEDC Prepaid Electricity",
      "serviceType": "ELECTRICITY",
      "active": true
    }
  ]
}`}),e.jsx(t,{method:"POST",path:"/merchant-api/digital-services/airtime",title:"Buy airtime",desc:"Purchase airtime for a Nigerian phone number.",req:`{
  "network": "MTN",
  "phoneNumber": "08030000000",
  "amount": 1000,
  "customerReference": "AIRTIME-001",
  "idempotencyKey": "AIRTIME-001"
}`,res:d("AIRTIME")}),e.jsx(t,{method:"POST",path:"/merchant-api/digital-services/data-bundle",title:"Buy data bundle",desc:"Purchase a data bundle product.",req:`{
  "mobileNetwork": "01",
  "mobileNumber": "08030000000",
  "dataPlan": "11",
  "idempotencyKey": "DATA-001"
}`,res:d("DATA_BUNDLE")}),e.jsx(t,{method:"POST",path:"/merchant-api/digital-services/electricity",title:"Pay electricity bill",desc:"Pay prepaid or postpaid electricity bills. Token is returned where available.",req:`{
  "electricCompany": "02",
  "meterType": "01",
  "meterNo": "12345678901",
  "amount": "5000",
  "phoneNo": "08030000000",
  "idempotencyKey": "POWER-001"
}`,res:d("ELECTRICITY")}),e.jsx(t,{method:"POST",path:"/merchant-api/digital-services/cable-tv",title:"Pay cable TV",desc:"Pay DStv, GOtv or Startimes subscriptions.",req:`{
  "cableTv": "dstv",
  "package": "dstv79",
  "smartCardNo": "1234567890",
  "phoneNo": "08030000000",
  "idempotencyKey": "CABLE-001"
}`,res:d("CABLE_TV")}),e.jsx(t,{method:"POST",path:"/merchant-api/digital-services/airtime-epin",title:"Buy airtime ePIN",desc:"Purchase airtime voucher PINs.",req:`{
  "network": "MTN",
  "amount": 1000,
  "quantity": 2,
  "customerReference": "EPIN-001"
}`,res:h("AIRTIME_EPIN")}),e.jsx(t,{method:"POST",path:"/merchant-api/digital-services/data-epin",title:"Buy data ePIN",desc:"Purchase data voucher PINs.",req:`{
  "network": "MTN",
  "productCode": "MTN_DATA_PIN_1GB",
  "quantity": 2,
  "customerReference": "DATAEPIN-001"
}`,res:h("DATA_EPIN")}),e.jsx(t,{method:"POST",path:"/merchant-api/digital-services/smile",title:"Smile payment",desc:"Purchase Smile data package.",req:`{
  "accountId": "SMILE12345",
  "package": "833",
  "phoneNo": "08030000000",
  "idempotencyKey": "SMILE-001"
}`,res:d("SMILE")}),e.jsx(t,{method:"POST",path:"/merchant-api/digital-services/spectranet",title:"Spectranet payment",desc:"Purchase Spectranet data or renew subscription.",req:`{
  "accountNumber": "SPEC12345",
  "productCode": "SPECTRANET_10GB",
  "phoneNumber": "08030000000",
  "customerReference": "SPEC-001"
}`,res:d("SPECTRANET")}),e.jsx(t,{method:"POST",path:"/merchant-api/digital-services/waec",title:"Buy WAEC PIN",desc:"Purchase WAEC result checker or registration PIN.",req:`{
  "examType": "waecdirect",
  "quantity": "1",
  "phoneNo": "08030000000",
  "idempotencyKey": "WAEC-001"
}`,res:h("WAEC")}),e.jsx(t,{method:"POST",path:"/merchant-api/digital-services/jamb",title:"Buy JAMB PIN",desc:"Purchase JAMB ePIN or related product.",req:`{
  "examType": "utme-no-mock",
  "quantity": "1",
  "phoneNo": "08030000000",
  "profileCode": "1234567890",
  "idempotencyKey": "JAMB-001"
}`,res:h("JAMB")}),e.jsx(t,{method:"PATCH",path:"/merchant-api/digital-services/transactions/requery",title:"Requery transaction",desc:"Confirm uncertain digital service transaction status.",req:`{
  "reference": "DGT-ABC123456789"
}`,res:d("AIRTIME")})]})}function H(){return e.jsxs("div",{className:"space-y-5",children:[e.jsx("p",{className:"text-sm leading-6 text-muted-foreground",children:"Configure webhook URL and secret from Dashboard → Settings → Webhooks. Always verify the signature before trusting webhook payloads."}),e.jsx(a,{language:"json",code:`{
  "event": "verification.completed",
  "reference": "NIN-7D2C9B1A",
  "serviceType": "MERCHANT_NIN_JSON_VERIFICATION",
  "status": "VERIFIED",
  "data": {
    "firstName": "KEHINDE",
    "lastName": "OYENUGA",
    "phoneNumber": "08030000000"
  },
  "timestamp": "2026-06-21T12:00:02.000Z"
}`})]})}function Y(){return e.jsxs("div",{className:"space-y-5",children:[e.jsx(a,{language:"json",code:`{
  "success": false,
  "code": "INVALID_API_KEY",
  "message": "Invalid or inactive API key"
}`}),e.jsx(a,{language:"json",code:`{
  "success": false,
  "code": "IP_NOT_ALLOWED",
  "message": "This IP address is not allowed to use this API key"
}`}),e.jsx(a,{language:"json",code:`{
  "success": false,
  "code": "INSUFFICIENT_WALLET_BALANCE",
  "message": "Insufficient wallet balance"
}`}),e.jsxs(n,{title:"Business outcomes versus system failures",children:["Outcomes such as ",e.jsx("code",{children:"NOT_FOUND"}),", ",e.jsx("code",{children:"NO_MATCH"}),","," ",e.jsx("code",{children:"INVALID_REQUEST"}),", ",e.jsx("code",{children:"CONFLICT"})," and"," ",e.jsx("code",{children:"UNVERIFIABLE"})," are completed verification outcomes and may remain billable. Genuine technical failures such as timeouts, connection failures or internal server errors are non-billable and settled wallet debits are reversed automatically."]})]})}function J(){return e.jsxs("div",{className:"space-y-3 text-sm text-muted-foreground",children:[e.jsx(l,{children:"Generate live API key and store it securely on your backend only."}),e.jsx(l,{children:"Configure API IP whitelist for production server IPs."}),e.jsx(l,{children:"Fund merchant wallet and confirm quote endpoints."}),e.jsx(l,{children:"Test idempotency for retries and duplicate submissions."}),e.jsx(l,{children:"Configure webhook URL, verify signature and store event references."}),e.jsx(l,{children:"Switch your base URL from sandbox to live."})]})}function l({children:s}){return e.jsx("div",{className:"rounded-xl border border-border bg-background/70 px-4 py-3",children:s})}function E({examples:s}){const[i,o]=N.useState(s[0]?.lang??"cURL"),c=s.find(r=>r.lang===i)??s[0];return e.jsxs("div",{className:"rounded-2xl border border-border/70 bg-background/70 p-3",children:[e.jsx("div",{className:"mb-3 flex flex-wrap gap-2",children:s.map(r=>e.jsx(x,{type:"button",size:"sm",variant:i===r.lang?"default":"outline",onClick:()=>o(r.lang),className:"h-8",children:r.lang},r.lang))}),c&&e.jsx(a,{language:c.lang,code:c.code})]})}function t({method:s,path:i,title:o,desc:c,req:r,res:u}){return e.jsxs("div",{className:"min-w-0 rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm sm:p-5",children:[e.jsxs("div",{className:"flex min-w-0 flex-wrap items-center gap-2",children:[e.jsx(C,{method:s}),e.jsx("code",{className:"max-w-full overflow-x-auto rounded-lg bg-muted px-2 py-1 font-mono text-xs text-foreground sm:text-sm",children:i})]}),e.jsx("h3",{className:"mt-3 text-base font-semibold text-foreground",children:o}),e.jsx("p",{className:"mt-1 text-sm leading-6 text-muted-foreground",children:c}),r&&e.jsxs("div",{className:"mt-4",children:[e.jsx("p",{className:"mb-2 text-xs font-semibold text-muted-foreground",children:"Request"}),e.jsx(a,{language:"json",code:r})]}),u&&e.jsxs("div",{className:"mt-4",children:[e.jsx("p",{className:"mb-2 text-xs font-semibold text-muted-foreground",children:"Response"}),e.jsx(a,{language:"json",code:u})]})]})}const v=`{
  "success": true,
  "code": "SUCCESS",
  "message": "Request successful",
  "data": {
    "nin": "12345678901",
    "gender": "Male",
    "lastName": "OYENUGA",
    "firstName": "KEHINDE",
    "middleName": "",
    "dateOfBirth": "1992-04-02",
    "phoneNumber": "09039362222",
    "email": "customer@example.com",
    "address": "12 Example Street, Abuja",
    "state": "FCT",
    "lga": "AMAC",
    "stateOfOrigin": "Kano",
    "lgaOfOrigin": "Kabo",
    "residentialAddress": "12 Example Street, Abuja",
    "photo": "base64-image-from-verification-source"
  }
}`,f=`{
  "success": true,
  "code": "SUCCESS",
  "message": "Request successful",
  "data": {
    "bvn": "22123456789",
    "gender": "Male",
    "lastName": "OYENUGA",
    "firstName": "KEHINDE",
    "middleName": "",
    "dateOfBirth": "1992-04-02",
    "phoneNumber": "09039362222",
    "email": "customer@example.com",
    "residentialAddress": "12 Example Street, Abuja",
    "stateOfResidence": "FCT",
    "lgaOfResidence": "AMAC",
    "enrollmentBank": "044",
    "enrollmentBranch": "ABUJA",
    "nameOnCard": "KEHINDE OYENUGA",
    "nationality": "Nigeria",
    "photo": "base64-image-from-verification-source"
  }
}`,W=`{
  "success": true,
  "message": "Liveness session created successfully",
  "data": {
    "reference": "LIVE-ABC123456789",
    "serviceType": "FACE_LIVENESS_BVN",
    "status": "SESSION_CREATED",
    "amount": "650.00",
    "liveness": {
      "reference": "LIVE-ABC123456789",
      "status": "SESSION_CREATED"
    }
  }
}`,$=`{
  "success": true,
  "data": {
    "credentials": {
      "accessKeyId": "short-lived-access-key",
      "secretAccessKey": "short-lived-secret",
      "sessionToken": "short-lived-session-token",
      "expiration": "2026-06-22T12:15:00.000Z"
    }
  }
}`,z=`{
  "success": true,
  "message": "Liveness result completed",
  "data": {
    "reference": "LIVE-ABC123456789",
    "serviceType": "FACE_LIVENESS_BVN",
    "status": "COMPLETED",
    "liveness": {
      "passed": true,
      "score": 92.4,
      "threshold": 80
    },
    "match": {
      "matched": true,
      "score": 99.1,
      "threshold": 85
    },
    "completedAt": "2026-06-22T12:01:30.000Z"
  }
}`;function p(s,i){return`{
  "success": true,
  "message": "Face verification completed successfully",
  "data": {
    "reference": "FACE-563006140B7C4040B4",
    "serviceType": "FACE_MATCH_${s==="UPLOADED_REFERENCE"?"REFERENCE":s}",
    "status": "MATCHED",
    "amount": "530.00",
    "sourceType": "${s}",
    "identity": {
      "${s==="BVN"?"bvn":s==="NIN"?"nin":"reference"}": "${i}"
    },
    "match": {
      "matched": true,
      "score": "99.99",
      "threshold": 85,
      "manualReviewRequired": false,
      "message": "Face match passed"
    },
    "source": {
      "firstName": "KEHINDE",
      "middleName": "",
      "lastName": "OYENUGA",
      "fullName": "KEHINDE OYENUGA",
      "dateOfBirth": "1992-04-02",
      "gender": "Male",
      "phoneNumber": "08030000000",
      "photo": "data:image/jpeg;base64,..."
    },
    "submittedAt": "2026-06-21T12:00:00.000Z",
    "completedAt": "2026-06-21T12:00:02.000Z"
  }
}`}function d(s){return`{
  "success": true,
  "message": "Digital service request completed successfully",
  "data": {
    "reference": "DGT-ABC123456789",
    "requestId": "customer-reference-001",
    "serviceType": "${s}",
    "status": "SUCCESSFUL",
    "amount": "1000.00",
    "recipient": "08030000000",
    "submittedAt": "2026-06-21T12:00:00.000Z",
    "completedAt": "2026-06-21T12:00:03.000Z",
    "fulfilment": {
      "productName": "MTN Airtime",
      "description": "Transaction successful",
      "token": "1234-5678-9012-3456",
      "remark": "ORDER_COMPLETED"
    },
    "message": "Transaction successful"
  }
}`}function h(s){return`{
  "success": true,
  "message": "Digital service request completed successfully",
  "data": {
    "reference": "DGT-PIN123456789",
    "serviceType": "${s}",
    "status": "SUCCESSFUL",
    "amount": "1000.00",
    "quantity": 2,
    "submittedAt": "2026-06-21T12:00:00.000Z",
    "completedAt": "2026-06-21T12:00:03.000Z",
    "pins": [
      {
        "serialNumber": "SN123456789",
        "pin": "123456789012"
      },
      {
        "serialNumber": "SN987654321",
        "pin": "987654321098"
      }
    ],
    "message": "Voucher generated successfully"
  }
}`}export{Ce as component};
