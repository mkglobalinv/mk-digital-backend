import ResellerEmailCampaign from '../models/ResellerEmailCampaign.js';
import User from '../models/User.js';
import backgroundQueue from '../services/backgroundQueue.js';

export const getEmailCampaigns = async (req, res) => {
    try {
        const campaigns = await ResellerEmailCampaign.find({ resellerId: req.user.id })
            .sort({ createdAt: -1 });
        res.json(campaigns);
    } catch (err) {
        console.error('[getEmailCampaigns]', err);
        res.status(500).json({ message: "Error fetching campaigns" });
    }
};

export const sendEmailCampaign = async (req, res) => {
    try {
        const { subject, message, recipientType } = req.body;

        if (!subject || !message || !recipientType) {
            return res.status(400).json({ message: "Subject, message, and recipient selection are required." });
        }

        // Build the isolated query for this tenant's customers only
        const query = { tenantOwnerId: req.user.id };
        if (recipientType === 'active') {
            query.isSuspended = false;
        }

        const count = await User.countDocuments(query);
        if (count === 0) {
            return res.status(400).json({ message: "No customers found for the selected criteria." });
        }

        // Create campaign in pending state
        const campaign = await ResellerEmailCampaign.create({
            resellerId: req.user.id,
            subject,
            message,
            recipientType,
            recipientCount: count,
            status: 'pending'
        });

        // Push to background queue
        backgroundQueue.push('EMAIL_CAMPAIGN', {
            campaignId: campaign._id,
            resellerId: req.user.id,
            query,
            subject,
            html: message
        });

        res.status(201).json({ message: "Campaign queued successfully.", campaign });
    } catch (err) {
        console.error('[sendEmailCampaign]', err);
        res.status(500).json({ message: "Error queuing email campaign" });
    }
};
