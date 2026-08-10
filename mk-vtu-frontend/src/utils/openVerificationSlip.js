export const openVerificationSlip = (data) => {
  const val = (v) => (v ? String(v) : '');

  const isBvn = !!data.isBvn;
  let displayId = val(data.idNumber);
  if (!isBvn && displayId.length > 4) {
    displayId = '***' + displayId.slice(-4);
  }

  const formatDateUpper = (dStr) => {
    if (!dStr) return '';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return String(dStr).toUpperCase();
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch (e) {
      return String(dStr).toUpperCase();
    }
  };

  const formatGender = (g) => {
    if (!g) return '';
    const s = String(g).trim().toUpperCase();
    if (s.startsWith('M')) return 'M';
    if (s.startsWith('F')) return 'F';
    return s;
  };

  const cleanBvn = String(displayId || '').replace(/\D/g, '');
  const formattedBvnSpaced = cleanBvn.length === 11 
    ? `${cleanBvn.slice(0, 4)} ${cleanBvn.slice(4, 7)} ${cleanBvn.slice(7)}` 
    : displayId;

  const todayStr = formatDateUpper(new Date());
  const dobStr = formatDateUpper(data.dateOfBirth);
  const genderShort = formatGender(data.gender);
  const otherNames = [data.firstName, data.middleName].filter(Boolean).join(' ');

  let slipHTML = '';

  if (isBvn) {
    // ELEGANT OFFICIAL BVN CARD LAYOUT (Matching Billsplash Official BVN Format)
    slipHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bank Verification Number (BVN) - ${displayId}</title>
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background-color: #f1f5f9;
            margin: 0;
            padding: 30px 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            color: #0f172a;
          }
          .bvn-wrapper {
            width: 100%;
            max-width: 580px;
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
          .bvn-card-front {
            background: #ffffff;
            border-radius: 20px;
            border: 1px solid #cbd5e1;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
            padding: 24px;
            position: relative;
            box-sizing: border-box;
            background-image: 
              radial-gradient(circle at 95% 10%, rgba(37, 99, 235, 0.04) 0%, transparent 40%),
              radial-gradient(circle at 5% 90%, rgba(37, 99, 235, 0.03) 0%, transparent 40%);
          }
          .card-header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
          }
          .title-block {
            color: #1e3a8a;
            font-size: 16px;
            font-weight: 800;
            letter-spacing: 0.5px;
            line-height: 1.2;
            width: 160px;
          }
          .shield-icon-center {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: #eff6ff;
            border: 2px solid #3b82f6;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .header-right-graphics {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .thumbs-up-badge {
            width: 32px;
            height: 32px;
            background: #2563eb;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
          .fingerprint-icon {
            width: 36px;
            height: 36px;
            color: #334155;
          }
          .nga-text {
            color: #16a34a;
            font-weight: 800;
            font-size: 20px;
            letter-spacing: 1px;
          }
          .card-body-main {
            display: flex;
            gap: 20px;
            margin-bottom: 18px;
          }
          .photo-container {
            width: 120px;
            height: 145px;
            border-radius: 8px;
            overflow: hidden;
            background: #e2e8f0;
            border: 1px solid #94a3b8;
            flex-shrink: 0;
          }
          .photo-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .no-photo-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748b;
            font-size: 11px;
            text-align: center;
            padding: 10px;
            box-sizing: border-box;
            font-weight: 600;
          }
          .info-grid {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .info-group {
            display: flex;
            flex-direction: column;
          }
          .info-label {
            font-size: 11px;
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          .info-value {
            font-size: 16px;
            color: #0f172a;
            font-weight: 800;
            text-transform: uppercase;
          }
          .meta-row {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 8px;
            margin-top: 4px;
          }
          .bvn-number-section {
            border-top: 1px dashed #cbd5e1;
            padding-top: 14px;
            text-align: center;
          }
          .bvn-title-sm {
            color: #1d4ed8;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .bvn-giant-number {
            font-family: 'Courier New', Courier, monospace;
            font-size: 32px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: 5px;
          }

          .bvn-card-back {
            background: #ffffff;
            border-radius: 20px;
            border: 1px solid #cbd5e1;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
            height: 220px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
            background-image: radial-gradient(circle at 10% 90%, rgba(37, 99, 235, 0.04) 0%, transparent 50%);
          }
          .back-brand {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .back-text-block {
            color: #0f172a;
            font-weight: 800;
            font-size: 20px;
            line-height: 1.2;
          }

          .actions-area {
            margin-top: 24px;
            text-align: center;
          }
          .print-btn {
            background: #2563eb;
            color: #ffffff;
            border: none;
            padding: 14px 32px;
            font-size: 16px;
            border-radius: 10px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
            display: inline-flex;
            align-items: center;
            gap: 10px;
          }
          .print-btn:hover { background: #1d4ed8; }

          @media print {
            body { background: #ffffff; padding: 0; }
            .actions-area { display: none; }
            .bvn-card-front, .bvn-card-back { box-shadow: none; page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="bvn-wrapper">
          <!-- FRONT OF CARD -->
          <div class="bvn-card-front">
            <div class="card-header-top">
              <div class="title-block">
                BANK VERIFICATION NUMBER
              </div>
              <div class="shield-icon-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
              <div class="header-right-graphics">
                <div class="thumbs-up-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                </div>
                <svg class="fingerprint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 10a2 2 0 0 0-2 2c0 1.1.9 2 2 2s2-.9 2-2a2 2 0 0 0-2-2z"></path><path d="M12 6a6 6 0 0 0-6 6c0 3.3 2.7 6 6 6s6-2.7 6-6a6 6 0 0 0-6-6z"></path><path d="M12 2a10 10 0 0 0-10 10c0 5.5 4.5 10 10 10s10-4.5 10-10A10 10 0 0 0 12 2z"></path></svg>
                <span class="nga-text">NGA</span>
              </div>
            </div>

            <div class="card-body-main">
              <div class="photo-container">
                ${data.photo ? `<img src="${data.photo}" alt="Passport Photo" />` : `<div class="no-photo-placeholder">PHOTO NOT AVAILABLE</div>`}
              </div>
              <div class="info-grid">
                <div class="info-group">
                  <span class="info-label">SURNAME</span>
                  <span class="info-value">${val(data.surname) || '—'}</span>
                </div>
                <div class="info-group">
                  <span class="info-label">FIRSTNAME/OTHER NAMES</span>
                  <span class="info-value">${otherNames || '—'}</span>
                </div>
                <div class="meta-row">
                  <div class="info-group">
                    <span class="info-label">DATE OF BIRTH</span>
                    <span class="info-value" style="font-size: 13px;">${dobStr || '—'}</span>
                  </div>
                  <div class="info-group">
                    <span class="info-label">GENDER</span>
                    <span class="info-value" style="font-size: 13px;">${genderShort || '—'}</span>
                  </div>
                  <div class="info-group">
                    <span class="info-label">ISSUE DATE</span>
                    <span class="info-value" style="font-size: 13px;">${todayStr}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="bvn-number-section">
              <div class="bvn-title-sm">BANK VERIFICATION NUMBER (BVN)</div>
              <div class="bvn-giant-number">${formattedBvnSpaced}</div>
            </div>
          </div>

          <!-- BACK OF CARD -->
          <div class="bvn-card-back">
            <div class="back-brand">
              <div class="thumbs-up-badge" style="width: 54px; height: 54px; border-radius: 14px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
              </div>
              <div class="shield-icon-center" style="width: 44px; height: 44px;">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
              <div class="back-text-block">
                Bank<br>Verification<br>Number
              </div>
            </div>
          </div>

          <div class="actions-area">
            <button class="print-btn" onclick="window.print()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              Print / Save PDF
            </button>
          </div>
        </div>
      </body>
      </html>
    `;
  } else {
    // STANDARD NIN SLIP LAYOUT (100% PRESERVED)
    slipHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NIN Verification Slip - ${displayId}</title>
        <style>
          body {
            font-family: 'Arial', Helvetica, sans-serif;
            background-color: #fff;
            margin: 0;
            padding: 20px;
          }
          .slip-wrapper {
            max-width: 1100px;
            margin: 0 auto;
            border: 2px solid #000;
            padding: 0;
          }
          table.slip-table {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
            color: #000;
            font-size: 15px;
          }
          .slip-table td {
            border: 1px solid #000;
            padding: 12px 15px;
            vertical-align: middle;
          }
          .slip-table td.header-cell {
            text-align: center;
            padding: 25px;
            border-bottom: 2px solid #000;
          }
          .slip-table h1 { margin: 0 0 8px 0; font-size: 28px; font-weight: bold; text-transform: uppercase; }
          .slip-table h2 { margin: 0 0 6px 0; font-size: 18px; font-weight: bold; }
          .slip-table h3 { margin: 0; font-size: 16px; font-weight: normal; }

          .field-container {
            display: flex;
            align-items: center;
          }
          .field-label {
            font-weight: bold;
            width: 120px;
            flex-shrink: 0;
          }
          .field-value {
            flex-grow: 1;
            word-break: break-word;
          }
          .col-address {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .photo-cell {
            padding: 0 !important;
            vertical-align: top;
            width: 15%;
          }
          .photo-cell img {
            width: 100%;
            height: 100%;
            min-height: 250px;
            object-fit: cover;
            display: block;
          }

          .action-area {
            text-align: center;
            margin-top: 30px;
          }
          .print-btn {
            background-color: #2563eb;
            color: #fff;
            border: none;
            padding: 12px 24px;
            font-size: 15px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .print-btn:hover { background-color: #1d4ed8; }

          @media print {
            body { padding: 0; }
            .action-area { display: none; }
            .slip-wrapper { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="slip-wrapper">
          <table class="slip-table">
            <tr>
              <td colspan="4" class="header-cell">
                <h1>NIN VERIFICATION</h1>
                <h2>Identity Verification Slip</h2>
                <h3>Federal Republic of Nigeria</h3>
              </td>
            </tr>
            
            <!-- ROW 1 -->
            <tr>
              <td style="width: 25%;">
                <div class="field-container">
                  <span class="field-label">Tracking ID:</span>
                  <span class="field-value">${val(data.trackingId)}</span>
                </div>
              </td>
              <td style="width: 30%;">
                <div class="field-container">
                  <span class="field-label">Surname:</span>
                  <span class="field-value">${val(data.surname)}</span>
                </div>
              </td>
              <td style="width: 30%;">
                <div class="col-address">
                  <span style="font-weight: bold;">Address:</span>
                  <span>${val(data.address)}</span>
                </div>
              </td>
              <td rowspan="4" class="photo-cell">
                ${data.photo ? `<img src="${data.photo}" alt="Profile Photo" />` : ''}
              </td>
            </tr>

            <!-- ROW 2 -->
            <tr>
              <td>
                <div class="field-container">
                  <span class="field-label">NIN:</span>
                  <span class="field-value">${displayId}</span>
                </div>
              </td>
              <td>
                <div class="field-container">
                  <span class="field-label">First Name:</span>
                  <span class="field-value">${val(data.firstName)}</span>
                </div>
              </td>
              <td style="vertical-align: top;">
                <div>${val(data.lga)}</div>
              </td>
            </tr>

            <!-- ROW 3 -->
            <tr>
              <td>
                <div class="field-container">
                  <span class="field-label">Date of Birth:</span>
                  <span class="field-value">${val(data.dateOfBirth)}</span>
                </div>
              </td>
              <td>
                <div class="field-container">
                  <span class="field-label">Middle Name:</span>
                  <span class="field-value">${val(data.middleName)}</span>
                </div>
              </td>
              <td style="vertical-align: top;">
                <div>${val(data.state)}</div>
              </td>
            </tr>

            <!-- ROW 4 -->
            <tr>
              <td></td>
              <td>
                <div class="field-container">
                  <span class="field-label">Gender:</span>
                  <span class="field-value">${val(data.gender)}</span>
                </div>
              </td>
              <td></td>
            </tr>
          </table>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; background: #fff; color: #000;">
            <tr>
              <td colspan="4" style="border: 1px solid #000; border-left: none; border-right: none; border-top: none; padding: 10px 15px; font-size: 14px;">
                <div><b>Note:</b> The <i>National Identification Number (NIN) is your identity</i>. It is confidential and may only be released for legitimate transactions.</div>
                <div style="margin-top: 8px;">You will be notified when your National Identity Card is ready (for any enquiries please contact)</div>
              </td>
            </tr>
            <tr>
              <td style="width: 25%; text-align: center; vertical-align: middle; padding: 15px 5px; border-right: 1px solid #000;">
                <div style="margin-bottom: 5px;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <div style="font-weight: bold; font-size: 12px;">helpdesk@nimc.gov.ng</div>
              </td>
              <td style="width: 25%; text-align: center; vertical-align: middle; padding: 15px 5px; border-right: 1px solid #000;">
                <div style="margin-bottom: 5px;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                </div>
                <div style="font-weight: bold; font-size: 12px;">www.nimc.gov.ng</div>
              </td>
              <td style="width: 25%; text-align: center; vertical-align: middle; padding: 15px 5px; border-right: 1px solid #000;">
                <div style="margin-bottom: 5px;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <div style="font-weight: bold; font-size: 12px;">0700-CALL-NIMC</div>
                <div style="font-size: 12px;">(0700-2255-646)</div>
              </td>
              <td style="width: 25%; text-align: center; vertical-align: middle; padding: 15px 5px;">
                <div style="font-weight: bold; margin-bottom: 6px; font-size: 12px;">National Identity Management Commission</div>
                <div style="font-size: 11px;">11, Sokode Crescent, Off Dalaba Street, Zone 5 Wuse, Abuja Nigeria</div>
              </td>
            </tr>
          </table>
        </div>
        
        <div style="max-width: 1100px; margin: 15px auto 0; padding: 0; font-size: 12px; color: #555; display: flex; justify-content: space-between;">
          <div><b>Reference ID:</b> ${val(data.reportId)}</div>
          <div><b>Verification Status:</b> Verified</div>
        </div>
        
        <div class="action-area">
          <button class="print-btn" onclick="window.print()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print / Save PDF
          </button>
        </div>
      </body>
      </html>
    `;
  }

  try {
    const blob = new Blob([slipHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    
    if (!newWindow) {
      alert("Please allow popups to view the verification slip.");
    }
  } catch (error) {
    console.error("Error opening slip:", error);
    alert("An error occurred while opening the slip.");
  }
};
