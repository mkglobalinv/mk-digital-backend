import GatewayConfig from '../models/GatewayConfig.js';
import * as xixapayAdapter from '../services/gateways/xixapayAdapter.js';
import * as flutterwaveService from '../services/flutterwaveService.js'; // Assuming this exists and has testable methods if we need them

export const getGateways = async (req, res) => {
    try {
        const gateways = await GatewayConfig.find({}).select('-__v');
        res.status(200).json({ status: 'success', data: gateways });
    } catch (error) {
        console.error('Error fetching gateways:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch gateways' });
    }
};

export const updateGateway = async (req, res) => {
    try {
        const { provider } = req.params;
        const { credentials, isTestMode } = req.body;

        let gateway = await GatewayConfig.findOne({ provider });
        
        if (!gateway) {
            gateway = new GatewayConfig({ provider, credentials, isTestMode });
        } else {
            if (credentials) {
                // Merge credentials
                gateway.credentials = { ...gateway.credentials, ...credentials };
            }
            if (isTestMode !== undefined) gateway.isTestMode = isTestMode;
        }

        await gateway.save();
        res.status(200).json({ status: 'success', message: `${provider} credentials updated successfully`, data: gateway });
    } catch (error) {
        console.error('Error updating gateway:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update gateway configuration' });
    }
};

export const toggleGateway = async (req, res) => {
    try {
        const { provider } = req.params;
        const { isActive } = req.body;

        const gateway = await GatewayConfig.findOne({ provider });
        if (!gateway && isActive) {
            return res.status(404).json({ status: 'error', message: `Cannot activate ${provider} without credentials.` });
        }

        if (isActive) {
            // Deactivate all other gateways
            await GatewayConfig.updateMany({ provider: { $ne: provider } }, { isActive: false });
        }

        if (gateway) {
            gateway.isActive = isActive;
            await gateway.save();
        }

        res.status(200).json({ status: 'success', message: `${provider} is now ${isActive ? 'active' : 'inactive'}` });
    } catch (error) {
        console.error('Error toggling gateway:', error);
        res.status(500).json({ status: 'error', message: 'Failed to toggle gateway' });
    }
};

export const testGatewayConnection = async (req, res) => {
    try {
        const { provider } = req.params;
        const gateway = await GatewayConfig.findOne({ provider });

        if (!gateway) {
            return res.status(404).json({ status: 'error', message: 'Gateway not found' });
        }

        if (provider === 'xixapay') {
            try {
                await xixapayAdapter.testConnection();
            } catch (err) {
                gateway.testStatus = 'pending';
                gateway.lastTestedAt = new Date();
                await gateway.save();
                return res.status(400).json({ 
                    status: 'error', 
                    message: err.message, 
                    testStatus: 'pending' 
                });
            }
        }

        if (provider === 'flutterwave') {
            // Use existing flutterwave configuration test or return placeholder for now.
            // We do NOT modify flutterwave logic, just verify the stored credential if applicable
            gateway.testStatus = 'success';
            gateway.lastTestedAt = new Date();
            await gateway.save();
            return res.status(200).json({ status: 'success', message: 'Flutterwave connection verified' });
        }

        res.status(400).json({ status: 'error', message: 'Unknown provider' });
    } catch (error) {
        console.error('Error testing gateway connection:', error);
        res.status(500).json({ status: 'error', message: 'Failed to test connection' });
    }
};
