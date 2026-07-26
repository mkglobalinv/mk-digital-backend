import http from 'http';

const checkEndpoint = (path, method = 'GET') => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, data }));
        });

        req.on('error', error => reject(error));
        req.end();
    });
};

const verify = async () => {
    try {
        console.log('Verifying static assets serving...');
        // We just need to check if /assets/ returns a 404 JSON or index.html or proper 404 html/text
        // Let's check a dummy asset path
        const assetRes = await checkEndpoint('/assets/dummy.css');
        console.log(`GET /assets/dummy.css -> ${assetRes.statusCode}`);
        if (assetRes.statusCode === 404 && assetRes.data.includes('"status":"error"')) {
            console.error('FAIL: Static assets are still hitting the API 404 handler!');
            process.exit(1);
        }
        
        console.log('Verifying API endpoint...');
        const apiRes = await checkEndpoint('/api/health');
        console.log(`GET /api/health -> ${apiRes.statusCode}`);
        
        console.log('Verifying index.html fallback...');
        const spaRes = await checkEndpoint('/some-random-frontend-route');
        console.log(`GET /some-random-frontend-route -> ${spaRes.statusCode}`);
        if (spaRes.data.includes('<html')) {
            console.log('PASS: index.html served for SPA routes');
        } else {
            console.error('FAIL: index.html not served for SPA routes');
            process.exit(1);
        }

        console.log('All verification passed!');
        process.exit(0);
    } catch (e) {
        console.error('Error during verification:', e.message);
        process.exit(1);
    }
};

verify();
