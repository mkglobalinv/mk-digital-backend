import axios from 'axios';

// Manual smoke test for the standalone IDGate360 module.
// Run `npm run idgate360:dev` (or idgate360:start) in another terminal first.

const PORT = process.env.IDGATE360_PORT || 4360;
const BASE = `http://localhost:${PORT}`;

const cases = [
    { name: 'health', method: 'get', url: '/health' },
    { name: 'nin/premium', method: 'post', url: '/api/idgate360/nin/premium', data: { nin: '12345678901' } },
    { name: 'nin/phone-premium', method: 'post', url: '/api/idgate360/nin/phone-premium', data: { phone: '08012345678' } },
    { name: 'nin/demo', method: 'post', url: '/api/idgate360/nin/demo', data: { firstname: 'JOHN', lastname: 'DOE', dob: '15-05-1985', gender: 'm' } },
    { name: 'bvn/premium', method: 'post', url: '/api/idgate360/bvn/premium', data: { bvn: '12345678901' } },
    { name: 'bank/verify', method: 'post', url: '/api/idgate360/bank/verify', data: { bvn: '22333444555', bankCode: '000013', bankAccount: '0123456789' } },
    { name: 'ipe/submit', method: 'post', url: '/api/idgate360/ipe/submit', data: { trackingID: 'ABC12345XYZ' } },
    { name: 'ipe/status', method: 'post', url: '/api/idgate360/ipe/status', data: { trackingID: 'ABC12345XYZ' } },
    { name: 'nin/validate', method: 'post', url: '/api/idgate360/nin/validate', data: { nin: '12345678901' } },
    { name: 'nin/validate-status', method: 'post', url: '/api/idgate360/nin/validate-status', data: { nin: '12345678901' } },
    { name: 'validation error (bad nin)', method: 'post', url: '/api/idgate360/nin/premium', data: { nin: '123' } }
];

const run = async () => {
    for (const c of cases) {
        try {
            const res = await axios({ method: c.method, url: BASE + c.url, data: c.data, validateStatus: () => true });
            const body = { ...res.data };
            if (body.pdf_base64) body.pdf_base64 = `<${body.pdf_base64.length} base64 chars omitted>`;
            console.log(`\n[${c.name}] HTTP ${res.status}`);
            console.log(JSON.stringify(body, null, 2));
        } catch (err) {
            console.error(`\n[${c.name}] FAILED: ${err.message}`);
        }
    }
};

run();
