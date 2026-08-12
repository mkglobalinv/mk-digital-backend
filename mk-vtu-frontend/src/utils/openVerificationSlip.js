export const openVerificationSlip = (data) => {
  const val = (v) => (v ? String(v) : '');

  const isBvn = !!data.isBvn;
  const displayId = val(data.idNumber);

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
    slipHTML = `

      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bank Verification Number (BVN) - ${displayId}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #f1f5f9;
            margin: 0;
            padding: 30px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }
          .card-container {
            width: 580px;
            height: 360px;
            background: #ffffff;
            border: 1px solid #94a3b8;
            border-radius: 12px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            background-image: 
              radial-gradient(circle at 50% 50%, rgba(37,99,235,0.03) 0%, transparent 60%);
          }
          /* Custom background wavy pattern SVG */
          .card-bg {
            position: absolute;
            top: -50%; left: -50%; right: -50%; bottom: -50%;
            background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><path d="M0,100 Q50,50 100,100 T200,100" fill="none" stroke="%23cbd5e1" stroke-width="0.5"/><path d="M0,120 Q50,70 100,120 T200,120" fill="none" stroke="%23cbd5e1" stroke-width="0.5"/></svg>') repeat;
            opacity: 0.6;
            z-index: 1;
            transform: rotate(-15deg);
            pointer-events: none;
          }
          .card-content {
            position: relative;
            z-index: 2;
            width: 100%;
            height: 100%;
            padding: 16px 24px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
          }
          
          /* TOP HEADER */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .header-left {
            display: flex;
            gap: 4px;
          }
          .vertical-text {
            writing-mode: vertical-lr;
            transform: rotate(180deg);
            font-size: 7px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 5px;
          }
          .title-text {
            color: #1e3a8a;
            font-size: 15px;
            font-weight: bold;
            line-height: 1.15;
            letter-spacing: 0.5px;
          }
          .header-center {
            position: absolute;
            left: 46%;
            top: 20px;
            width: 40px;
            height: 40px;
            background: #e2e8f0;
            border-radius: 50%;
            border: 2px solid #94a3b8;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
          }
          .header-right {
            display: flex;
            align-items: flex-start;
            gap: 15px;
          }
          .nga-container {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          
          /* MIDDLE SECTION */
          .middle {
            display: flex;
            gap: 20px;
            margin-top: 15px;
          }
          .photo {
            width: 120px;
            height: 145px;
            background: #cbd5e1;
            border: 1px solid #94a3b8;
          }
          .photo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .no-photo {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            font-size: 10px;
            color: #64748b;
            text-align: center;
          }
          .details {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding-top: 5px;
            padding-bottom: 5px;
          }
          .field {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .label {
            font-size: 11px;
            color: #94a3b8;
            font-weight: bold;
          }
          .value {
            font-size: 16px;
            color: #0f172a;
            font-weight: bold;
          }
          .row {
            display: flex;
            gap: 25px;
          }
          
          /* BOTTOM SECTION */
          .bottom {
            margin-top: auto;
            display: flex;
            align-items: flex-end;
            position: relative;
            padding-bottom: 5px;
          }
          .bottom-left-fp {
            position: absolute;
            left: -5px;
            bottom: 0px;
          }
          .bvn-wrapper {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding-left: 30px;
          }
          .bvn-label {
            color: #1e3a8a;
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .bvn-value {
            font-size: 38px;
            font-weight: 900;
            color: #000;
            letter-spacing: 6px;
            font-family: 'Arial', sans-serif;
          }

          /* BACK CARD */
          .card-back {
            width: 580px;
            height: 360px;
            background: #ffffff;
            border: 1px solid #94a3b8;
            border-radius: 12px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .back-content {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            margin-left: -60px;
          }
          .back-logo-row {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .back-text {
            font-size: 22px;
            font-weight: bold;
            color: #0f172a;
            line-height: 1.2;
          }

          .print-btn {
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(37,99,235,0.2);
            margin-top: 20px;
          }
          @media print {
            body { background: white; padding: 0; }
            .print-btn { display: none; }
            .card-container, .card-back { box-shadow: none; margin-bottom: 30px; page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <!-- FRONT -->
        <div class="card-container">
          <div class="card-bg"></div>
          <div class="card-content">
            <div class="header">
              <div class="header-left">
                <div class="vertical-text">Financial Industry</div>
                <div class="title-text">BANK<br>VERIFICATION<br>NUMBER</div>
              </div>
              <div class="header-center">
                <!-- Silver shield icon mock -->
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4" stroke="#1e3a8a"></path></svg>
              </div>
              <div class="header-right">
                <!-- Blue Thumbs up -->
                <svg width="45" height="45" viewBox="0 0 24 24" fill="#3b82f6" style="margin-top: 10px;"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                
                <div class="nga-container">
                  <!-- Large Fingerprint -->
                  <svg width="65" height="75" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="1.2" stroke-linecap="round"><path d="M12 10a2 2 0 0 0-2 2c0 1.1.9 2 2 2s2-.9 2-2a2 2 0 0 0-2-2z"></path><path d="M12 6a6 6 0 0 0-6 6c0 3.3 2.7 6 6 6s6-2.7 6-6a6 6 0 0 0-6-6z"></path><path d="M12 2a10 10 0 0 0-10 10c0 5.5 4.5 10 10 10s10-4.5 10-10A10 10 0 0 0 12 2z"></path><path d="M12 14a4 4 0 0 1 4-4"></path><path d="M12 18a8 8 0 0 1 8-8"></path></svg>
                  <div style="color: #16a34a; font-weight: bold; font-size: 20px; margin-top: -5px; letter-spacing: 1px;">NGA</div>
                </div>
              </div>
            </div>
            
            <div class="middle">
              <div class="photo">
                \${data.photo ? \`<img src="\${data.photo}" alt="Photo" />\` : \`<div class="no-photo">NO PHOTO</div>\`}
              </div>
              <div class="details">
                <div class="field">
                  <div class="label">SURNAME</div>
                  <div class="value">\${val(data.surname) || '—'}</div>
                </div>
                <div class="field">
                  <div class="label">FIRSTNAME/OTHER NAMES</div>
                  <div class="value">\${otherNames || '—'}</div>
                </div>
                <div class="row">
                  <div class="field">
                    <div class="label">DATE OF BIRTH</div>
                    <div class="value" style="font-size: 14px;">\${dobStr || '—'}</div>
                  </div>
                  <div class="field">
                    <div class="label">GENDER</div>
                    <div class="value" style="font-size: 14px;">\${genderShort || '—'}</div>
                  </div>
                  <div class="field">
                    <div class="label">ISSUE DATE</div>
                    <div class="value" style="font-size: 14px;">\${todayStr}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="bottom">
              <div class="bottom-left-fp">
                 <svg width="45" height="55" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><path d="M12 10a2 2 0 0 0-2 2c0 1.1.9 2 2 2s2-.9 2-2a2 2 0 0 0-2-2z"></path><path d="M12 6a6 6 0 0 0-6 6c0 3.3 2.7 6 6 6s6-2.7 6-6a6 6 0 0 0-6-6z"></path><path d="M12 2a10 10 0 0 0-10 10c0 5.5 4.5 10 10 10s10-4.5 10-10A10 10 0 0 0 12 2z"></path></svg>
              </div>
              <div class="bvn-wrapper">
                <div class="bvn-label">BANK VERIFICATION NUMBER (BVN)</div>
                <div class="bvn-value">\${formattedBvnSpaced}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- BACK -->
        <div class="card-back">
          <div class="card-bg" style="transform: rotate(15deg) scale(1.5);"></div>
          
          <div style="position: absolute; right: 0; bottom: 0; opacity: 0.05;">
             <svg width="300" height="400" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="0.5"><path d="M12 10a2 2 0 0 0-2 2c0 1.1.9 2 2 2s2-.9 2-2a2 2 0 0 0-2-2z"></path><path d="M12 6a6 6 0 0 0-6 6c0 3.3 2.7 6 6 6s6-2.7 6-6a6 6 0 0 0-6-6z"></path><path d="M12 2a10 10 0 0 0-10 10c0 5.5 4.5 10 10 10s10-4.5 10-10A10 10 0 0 0 12 2z"></path></svg>
          </div>

          <div class="back-content">
            <svg width="90" height="90" viewBox="0 0 24 24" fill="#3b82f6" style="margin-bottom: -10px;"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
            <div class="back-logo-row">
              <div style="width: 45px; height: 45px; background: #e2e8f0; border-radius: 50%; border: 2px solid #94a3b8; display: flex; align-items: center; justify-content: center;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4" stroke="#1e3a8a"></path></svg>
              </div>
              <div class="back-text">
                Bank<br>Verification<br>Number
              </div>
            </div>
          </div>
        </div>

        <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
      </body>
      </html>
    \`;
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
