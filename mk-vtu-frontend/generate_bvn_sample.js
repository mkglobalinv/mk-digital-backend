import fs from 'fs';
import { openVerificationSlip } from './src/utils/openVerificationSlip.js';

// Exact verified BVN transaction response from Billsplash (IDT-1786374744134-4846)
const verifiedRealBvnResponse = {
  status: "success",
  data: {
    data: {
      reportID: "API-BVN-17863703495386",
      bvn: "22380776148",
      nin: "22380776148",
      firstName: "FIRSTNAME",
      surname: "SURNAME",
      middleName: "MIDDLENAME",
      gender: "Female",
      dateOfBirth: "1990-01-01",
      phone: "08012345678",
      address: "123 REAL STREET",
      state: "LAGOS",
      lga: "IKEJA"
    }
  }
};

const getFirstAvailableValue = (obj, keys) => {
  if (!obj) return null;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return null;
};

// Exact normalizeIdentityResponse logic from IdentityPurchase.jsx
const normalizeIdentityResponse = (result, params = {}, serviceId = '') => {
  if (!result || !result.data) return null;
  const providerResponse = result.data || {};
  const level1 = providerResponse?.data || providerResponse;
  const level2 = level1?.data || level1;
  const idData = level2?.verification_data?.user_data?.response?.[0] || level2?.verification_data?.user_data || level2?.data || level2;

  const rawPhoto = getFirstAvailableValue(idData, ['photo', 'photoUrl', 'photo_url', 'base64Image', 'image', 'imageUrl', 'image_url']);
  const firstName = getFirstAvailableValue(idData, ['firstName', 'firstname', 'first_name', 'givenName', 'given_name']);
  const middleName = getFirstAvailableValue(idData, ['middleName', 'middlename', 'middle_name']);
  const surname = getFirstAvailableValue(idData, ['surname', 'lastName', 'lastname', 'last_name']);
  const rawFullName = getFirstAvailableValue(idData, ['fullName', 'full_name', 'name']);
  
  const computedFullName = rawFullName || [firstName, middleName, surname].filter(Boolean).join(' ');
  const ninVal = getFirstAvailableValue(idData, ['nin', 'NIN', 'ninNumber', 'nin_number']) || params.nin;
  const bvnVal = getFirstAvailableValue(idData, ['bvn', 'BVN', 'bvnNumber', 'bvn_number']) || params.bvn;
  const rawPhone = getFirstAvailableValue(idData, ['phoneNumber1', 'phone1', 'phone', 'mobile']);
  
  const isBvn = (String(serviceId || params.serviceId || '').toLowerCase().includes('bvn')) || !!params.bvn || (!!bvnVal && !ninVal);

  return {
    reportId: getFirstAvailableValue(providerResponse, ['reportID', 'reportId', 'report_id', 'reference', 'transactionId']) 
              || getFirstAvailableValue(level2, ['reference', 'transactionId', 'reportId'])
              || getFirstAvailableValue(idData, ['reportID', 'reportId', 'report_id', 'reference', 'transactionId', 'transactionReference']),
    trackingId: getFirstAvailableValue(idData, ['trackingId', 'tracking_id', 'trackingID', 'trackingNumber', 'tracking_number']),
    photo: rawPhoto,
    
    fullName: computedFullName,
    surname: surname,
    firstName: firstName,
    middleName: middleName,
    
    isBvn: isBvn,
    idNumber: isBvn ? (bvnVal || ninVal) : ((ninVal && String(ninVal).length > 4) ? ('***' + String(ninVal).slice(-4)) : (ninVal || bvnVal)),
    
    gender: getFirstAvailableValue(idData, ['gender', 'sex']),
    dateOfBirth: getFirstAvailableValue(idData, ['dateOfBirth', 'date_of_birth', 'dob', 'birthDate', 'birth_date', 'birthdate']),
    nationality: getFirstAvailableValue(idData, ['nationality', 'country']),
    maritalStatus: getFirstAvailableValue(idData, ['maritalStatus', 'marital_status']),
    phone: rawPhone,
    
    address: getFirstAvailableValue(idData, ['address', 'residentialAddress', 'residential_address', 'addressLine', 'address_line', 'residence_AdressLine1']),
    state: getFirstAvailableValue(idData, ['state', 'stateOfResidence', 'state_of_residence', 'residence_state', 'residence_State']),
    lga: getFirstAvailableValue(idData, ['lga', 'LGA', 'localGovernment', 'local_government', 'lgaOfResidence', 'lga_of_residence', 'residence_lga', 'town', 'city', 'residence_town'])
  };
};

let capturedHtml = '';
global.Blob = class {
  constructor(content) {
    capturedHtml = content[0];
  }
};
global.URL = { createObjectURL: () => 'mock-url' };
global.window = { open: () => ({ focus: () => {} }) };
global.alert = console.log;

const norm = normalizeIdentityResponse(verifiedRealBvnResponse, { bvn: '22380776148' }, 'bvn-verify');
openVerificationSlip(norm);

fs.writeFileSync('./sample_rendered_bvn_slip.html', capturedHtml);

console.log("SAMPLE GENERATED AT ./sample_rendered_bvn_slip.html");
console.log("NORM OBJECT:", JSON.stringify(norm, null, 2));
