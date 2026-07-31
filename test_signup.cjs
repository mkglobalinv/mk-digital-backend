const http = require('http');

const data = JSON.stringify({
  name: "Test User",
  email: "test@duplicate.com",
  phone: "08000000000",
  password: "Test1234!",
  transactionPin: "1234"
});

const req = http.request({
  hostname: 'localhost',
  port: 8800,
  path: '/api/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Host': '9jasub.com'
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log("Response 1:", res.statusCode, body));

  // Second request to reseller tenant
  const req2 = http.request({
    hostname: 'localhost',
    port: 8800,
    path: '/api/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Host': 'mkhub.9jasub.com'
    }
  }, (res2) => {
    let body2 = '';
    res2.on('data', d => body2 += d);
    res2.on('end', () => console.log("Response 2:", res2.statusCode, body2));
  });
  req2.write(data);
  req2.end();

});

req.write(data);
req.end();
