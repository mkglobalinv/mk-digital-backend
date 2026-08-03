import ProviderCategory from '../models/ProviderCategory.js';
import DataPlan from '../models/DataPlan.js';

// Get categories for a specific provider with plan counts (Admin)
export const getProviderCategories = async (req, res) => {
    try {
        const { providerName } = req.params;
        if (!providerName) return res.status(400).json({ success: false, message: "Provider name is required" });

        const categories = await ProviderCategory.find({ provider_name: providerName.toLowerCase() }).sort({ createdAt: -1 }).lean();
        
        // Add total_plans count to each category
        for (let i = 0; i < categories.length; i++) {
            const parts = categories[i].category_name.split(' ');
            const network = parts[0];
            const categoryPart = parts.slice(1).join(' ');
            
            // Match by network, category, and provider
            const count = await DataPlan.countDocuments({ 
                network: new RegExp(`^${network}$`, 'i'), 
                category: new RegExp(`^${categoryPart}$`, 'i'),
                provider: providerName.toLowerCase()
            });
            categories[i].total_plans = count;
        }

        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        console.error("Error fetching provider categories:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get active/maintenance categories mapped by provider (Public/Customer)
export const getPublicCategories = async (req, res) => {
    try {
        // Return ALL categories so frontend can explicitly read visibility='HIDDEN'
        const categories = await ProviderCategory.find({});
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        console.error("Error fetching public provider categories:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Create a new provider category
export const createCategory = async (req, res) => {
    try {
        const { provider_name, category_name, status, maintenance_message } = req.body;
        
        if (!category_name || !provider_name) {
            return res.status(400).json({ success: false, message: "Provider name and Category name are required" });
        }

        const existing = await ProviderCategory.findOne({ provider_name: provider_name.toLowerCase(), category_name });
        if (existing) {
            return res.status(400).json({ success: false, message: "Category already exists for this provider" });
        }

        const category = new ProviderCategory({
            provider_name: provider_name.toLowerCase(),
            category_name,
            status: status || 'ACTIVE',
            maintenance_message: maintenance_message || ''
        });

        await category.save();
        res.status(201).json({ success: true, data: category, message: "Category created successfully" });
    } catch (error) {
        console.error("Error creating provider category:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Update a provider category
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        if (id && !id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid resource identifier format." });
        const { status, visibility, maintenance_message } = req.body;

        const category = await ProviderCategory.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        if (status) category.status = status;
        if (visibility) category.visibility = visibility;
        if (maintenance_message !== undefined) category.maintenance_message = maintenance_message;
        
        await category.save();
        res.status(200).json({ success: true, data: category, message: "Category updated successfully" });
    } catch (error) {
        console.error("Error updating provider category:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Delete a category
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        if (id && !id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid resource identifier format." });
        const category = await ProviderCategory.findByIdAndDelete(id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        res.status(200).json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Toggle status (Active / Maintenance)
export const toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (id && !id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid resource identifier format." });
        const category = await ProviderCategory.findById(id);
        if (!category) return res.status(404).json({ success: false, message: "Category not found" });

        category.status = category.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
        if (category.status === 'ACTIVE') category.maintenance_message = ''; // Clear message when active
        
        await category.save();
        res.status(200).json({ success: true, data: category, message: `Category set to ${category.status}` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Toggle visibility (Visible / Hidden)
export const toggleVisibility = async (req, res) => {
    try {
        const { id } = req.params;
        if (id && !id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid resource identifier format." });
        const category = await ProviderCategory.findById(id);
        if (!category) return res.status(404).json({ success: false, message: "Category not found" });

        category.visibility = category.visibility === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE';
        
        await category.save();
        res.status(200).json({ success: true, data: category, message: `Category is now ${category.visibility}` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Auto-detect unmanaged categories for a specific provider
export const autoDetectCategories = async (req, res) => {
    try {
        const { providerName } = req.params;
        if (!providerName) return res.status(400).json({ success: false, message: "Provider name is required" });

        // Aggregate all unique network + category combinations from DataPlan for this provider
        const uniquePlans = await DataPlan.aggregate([
            { $match: { provider: providerName.toLowerCase() } },
            {
                $group: {
                    _id: { network: "$network", category: "$category" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const detected = [];
        for (const plan of uniquePlans) {
            const catName = `${plan._id.network} ${plan._id.category || 'Direct'}`;
            // Check if already in ProviderCategory for this provider
            const exists = await ProviderCategory.findOne({ 
                provider_name: providerName.toLowerCase(),
                category_name: new RegExp(`^${catName}$`, 'i') 
            });
            
            if (!exists) {
                detected.push({
                    category_name: catName,
                    total_plans: plan.count
                });
            }
        }

        res.status(200).json({ success: true, data: detected });
    } catch (error) {
        console.error("Error auto-detecting provider categories:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
