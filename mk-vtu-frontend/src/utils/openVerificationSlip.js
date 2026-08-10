export const openVerificationSlip = (data) => {
  const val = (v) => (v ? String(v) : '');

  const slipType = data.isBvn ? "BVN" : "NIN";
  const slipTitle = data.isBvn ? "Bank Verification Slip" : "Identity Verification Slip";

  const slipHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${slipType} Verification Slip - ${val(data.idNumber)}</title>
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

        .bottom-section {
          padding: 15px;
          border-top: 2px solid #000;
          font-size: 14px;
        }
        .ref-section {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid #000;
          padding-top: 15px;
          margin-top: 15px;
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
              <h1>${slipType} VERIFICATION</h1>
              <h2>${slipTitle}</h2>
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
                <span class="field-label">${slipType}:</span>
                <span class="field-value">${val(data.idNumber)}</span>
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
            <td></td>
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

