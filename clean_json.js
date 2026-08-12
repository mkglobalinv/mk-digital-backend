import fs from 'fs';

const logFile = 'C:/Users/userpc/.gemini/antigravity-ide/brain/1aa6356f-39ef-4a9c-834c-fbd75a817f8d/.system_generated/tasks/task-1212.log';
let content = fs.readFileSync(logFile, 'utf8');

// The JSON starts after "Body: {" and ends before "======================================================"
const startIdx = content.indexOf('Body: {\n') + 6;
const endIdx = content.indexOf('\n    console.log(`======================================================\\n`);', startIdx);
let jsonStr = content.substring(startIdx, endIdx);

try {
  // It might be formatted differently in the log, let's just extract the raw output from our script.
  // Our script outputted "FINAL RESULT:" and then the JSON.
  const finalStart = content.indexOf('FINAL RESULT:\n') + 14;
  let finalJsonStr = content.substring(finalStart).trim();
  
  // parse it
  let obj = JSON.parse(finalJsonStr);
  
  // remove huge base64
  if (obj.data && obj.data.verification_data && obj.data.verification_data.pdf_base64) {
      obj.data.verification_data.pdf_base64 = "[BASE64_PDF_REMOVED_FOR_BREVITY]";
  }
  if (obj.data && obj.data.verification_data && obj.data.verification_data.user_data && obj.data.verification_data.user_data.data && obj.data.verification_data.user_data.data.photo) {
      obj.data.verification_data.user_data.data.photo = "[BASE64_PHOTO_REMOVED_FOR_BREVITY]";
  }
  
  fs.writeFileSync('C:/Users/userpc/mk-digital-backend/scratch/billsplash_clean.json', JSON.stringify(obj, null, 2));
} catch (e) {
  console.error("Error parsing JSON", e);
}
