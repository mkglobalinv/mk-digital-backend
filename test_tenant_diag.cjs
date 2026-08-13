const mongoose = require('mongoose');

async function check() {
    try {
        await mongoose.connect('mongodb://localhost:27017/mk_digital');
        const User = require('./models/User.js').default || require('./models/User.js');
        const tenant = await User.findOne({ role: 'reseller_admin' });
        console.log('--- DB Data ---');
        console.log('Tenant:', tenant.email);
        console.log('Tenant customDomain:', tenant.customDomain);
        console.log('Tenant activatedManualServices DB value:', tenant.activatedManualServices);

        console.log('\n--- API Data ---');
        const http = require('http');
        http.get('http://localhost:5000/api/site-info?resellerId=' + tenant._id, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const json = JSON.parse(data);
                console.log('API reseller.activatedManualServices:', json.reseller.activatedManualServices);
                console.log('API reseller full keys:', Object.keys(json.reseller));
                process.exit(0);
            });
        }).on('error', (e) => {
            console.error('HTTP GET error:', e.message);
            process.exit(1);
        });
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
