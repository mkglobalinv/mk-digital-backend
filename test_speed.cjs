const https = require('https');

const data = JSON.stringify({
  name: "Prod Speed Test User",
  email: `prodspeed${Date.now()}@test.com`,
  phone: "08500000000",
  password: "Test1234!",
  transactionPin: "1234"
});

const makeRequest = (host, requestName) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const req = https.request({
      hostname: host,
      port: 443,
      path: '/api/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        const timeTaken = Date.now() - startTime;
        console.log(`[${requestName}] (${timeTaken}ms) Status: ${res.statusCode} | Body: ${body}`);
        resolve();
      });
    });
    
    req.on('error', e => console.error(e));
    req.write(data);
    req.end();
  });
};

(async () => {
  console.log("1. Registering on retail tenant (9jasub.com)");
  await makeRequest('9jasub.com', 'Retail');

  console.log("2. Registering same email on reseller tenant (mkhub.9jasub.com)");
  await makeRequest('mkhub.9jasub.com', 'Reseller');

  console.log("3. Registering duplicate on retail tenant (should block)");
  await makeRequest('9jasub.com', 'Retail Duplicate');
  
  console.log("4. Registering duplicate on reseller tenant (should block)");
  await makeRequest('mkhub.9jasub.com', 'Reseller Duplicate');
})();
