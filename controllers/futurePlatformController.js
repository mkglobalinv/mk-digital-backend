import FuturePlatform from "../models/FuturePlatform.js";
import User from "../models/User.js";

// Super Admin: Create Platform
export const createPlatform = async (req, res) => {
    try {
        console.log("REQUEST BODY:", req.body);
        const { name, retailDisplayName, ownerDisplayNameTemplate, logoUrl, url, platformType, status, displayOrder } = req.body;
        
        const platform = new FuturePlatform({
            name, retailDisplayName, ownerDisplayNameTemplate, logoUrl, url, platformType, status, displayOrder
        });
        
        await platform.save();
        res.status(201).json({ message: "Platform created successfully", platform });
    } catch (err) {
        console.error("[CreatePlatform Error]", err);
        return res.status(500).json({ success: false, error: err.message, stack: err.stack });
    }
};

// Super Admin: Get All Platforms
export const getAllPlatforms = async (req, res) => {
    try {
        const platforms = await FuturePlatform.find().sort({ displayOrder: 1 });
        res.json(platforms);
    } catch (err) {
        console.error("[GetAllPlatforms Error]", err);
        res.status(500).json({ message: "Failed to fetch platforms" });
    }
};

// Super Admin: Update Platform
export const updatePlatform = async (req, res) => {
    try {
        console.log("REQUEST BODY:", req.body);
        const { id } = req.params;
        const updates = req.body;
        
        const platform = await FuturePlatform.findByIdAndUpdate(id, updates, { new: true });
        if (!platform) return res.status(404).json({ message: "Platform not found" });
        
        res.json({ message: "Platform updated successfully", platform });
    } catch (err) {
        console.error("[UpdatePlatform Error]", err);
        return res.status(500).json({ success: false, error: err.message, stack: err.stack });
    }
};

// Super Admin: Delete Platform
export const deletePlatform = async (req, res) => {
    try {
        const { id } = req.params;
        await FuturePlatform.findByIdAndDelete(id);
        res.json({ message: "Platform deleted successfully" });
    } catch (err) {
        console.error("[DeletePlatform Error]", err);
        res.status(500).json({ message: "Failed to delete platform" });
    }
};

// Public/User: Get Available Platforms (White-Labeled)
export const getAvailablePlatforms = async (req, res) => {
    try {
        const platforms = await FuturePlatform.find({ status: true }).sort({ displayOrder: 1 });
        
        // If a resellerId is provided (e.g. from frontend context), we brand the platforms.
        // Otherwise, we use retail display names.
        const { resellerId } = req.query;
        let siteName = null;
        
        if (resellerId) {
            const reseller = await User.findById(resellerId);
            if (reseller && reseller.branding && reseller.branding.siteName) {
                siteName = reseller.branding.siteName;
            }
        }
        
        const processedPlatforms = platforms.map(p => {
            let displayName = p.retailDisplayName;
            
            if (p.name === "BBC Hausa") {
                displayName = "BBC Hausa";
            } else if (siteName) {
                // Apply the template, e.g. "{Brand} Campus" -> "Nass Campus"
                displayName = p.ownerDisplayNameTemplate.replace(/{Brand}/gi, siteName);
            }
            
            return {
                _id: p._id,
                name: p.name,
                displayName,
                logoUrl: p.logoUrl,
                targetUrl: p.url,
                platformType: p.platformType || (p.mode === 'internal' ? 'embedded' : (p.mode === 'external' ? 'external' : 'embedded'))
            };
        });
        
        res.json(processedPlatforms);
    } catch (err) {
        console.error("[GetAvailablePlatforms Error]", err);
        res.status(500).json({ message: "Failed to fetch platforms" });
    }
};
