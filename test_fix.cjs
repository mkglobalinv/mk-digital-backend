const mongoose = require('mongoose');

async function test() {
    try {
        await mongoose.connect('mongodb://localhost:27017/vtuapp'); // Used correct DB this time
        const User = require('./models/User.js').default || require('./models/User.js');
        
        const emptyTenant = await User.findOne({ role: 'reseller_admin', $or: [{activatedManualServices: {$exists: false}}, {activatedManualServices: {$size: 0}}] });
        if (!emptyTenant) {
            console.log("No empty tenant found.");
            process.exit(1);
        }
        
        console.log("Empty Tenant ID:", emptyTenant._id);
        
        const http = require('http');
        
        const getSiteInfo = (id) => {
            return new Promise((resolve, reject) => {
                http.get('http://localhost:5000/api/site-info?resellerId=' + id, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            const json = JSON.parse(data);
                            resolve(json);
                        } catch (e) {
                            reject(e);
                        }
                    });
                }).on('error', reject);
            });
        };

        const res1 = await getSiteInfo(emptyTenant._id);
        console.log("API Response for Empty Tenant:", res1.reseller.activatedManualServices);

        // Make a mock tenant update
        const origServices = emptyTenant.activatedManualServices;
        emptyTenant.activatedManualServices = ['nin_modification'];
        await emptyTenant.save();
        
        const res2 = await getSiteInfo(emptyTenant._id);
        console.log("API Response for NIN Tenant:", res2.reseller.activatedManualServices);

        emptyTenant.activatedManualServices = ['nin_modification', 'bvn_modification', 'cac_registration'];
        await emptyTenant.save();
        
        const res3 = await getSiteInfo(emptyTenant._id);
        console.log("API Response for ALL Tenant:", res3.reseller.activatedManualServices);

        // Restore original
        emptyTenant.activatedManualServices = origServices;
        await emptyTenant.save();
        
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

test();
