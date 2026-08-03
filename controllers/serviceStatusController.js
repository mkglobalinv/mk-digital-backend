import ServiceStatus from "../models/ServiceStatus.js";
import socketService from "../services/socketService.js";
import User from "../models/User.js";

// In-Memory cache for public active service statuses
let cachedPublicActiveStatuses = null;

// Helper to clear and re-populate the cache
const clearPublicStatusCache = () => {
  cachedPublicActiveStatuses = null;
};

// Helper to determine allowed audience levels based on role & active reseller tier
const getAudienceListForUser = (user) => {
  const allowed = ['all'];
  if (!user) return allowed;

  if (user.role === 'admin') {
    allowed.push('customer', 'reseller', 'premium_reseller');
    return allowed;
  }

  const isResellerActive = user.role === 'reseller_admin' && user.isResellerActivated && user.resellerActivationStatus === 'active';
  if (isResellerActive) {
    allowed.push('customer', 'reseller');
    if (user.resellerTier === 'premium') {
      allowed.push('premium_reseller');
    }
  } else {
    allowed.push('customer');
  }

  return allowed;
};

// Standard Services to Auto-seed if the status DB is clean
const DEFAULT_SERVICES = [
  { serviceName: "MTN", statusType: "active", severityColor: "green", statusMessage: "MTN Active" },
  { serviceName: "Airtel", statusType: "active", severityColor: "green", statusMessage: "Airtel Active" },
  { serviceName: "GLO", statusType: "active", severityColor: "green", statusMessage: "GLO Active" },
  { serviceName: "9mobile", statusType: "active", severityColor: "green", statusMessage: "9mobile Active" },
  { serviceName: "Airtime", statusType: "active", severityColor: "green", statusMessage: "Airtime Active" },
  { serviceName: "Electricity", statusType: "active", severityColor: "green", statusMessage: "Electricity Active" },
  { serviceName: "Cable", statusType: "active", severityColor: "green", statusMessage: "Cable Active" },
  { serviceName: "Exam Pins", statusType: "active", severityColor: "green", statusMessage: "Exam Pins Active" },
  { serviceName: "Wallet/Transfer systems", statusType: "active", severityColor: "green", statusMessage: "Wallet/Transfer systems Active" }
];

const seedDefaultStatusesIfEmpty = async () => {
  try {
    const count = await ServiceStatus.countDocuments();
    if (count === 0) {
      console.log("[ServiceStatus] Database is empty. Seeding standard health notices...");
      await ServiceStatus.insertMany(DEFAULT_SERVICES.map(s => ({
        ...s,
        targetAudience: "all",
        isActive: true
      })));
    }
  } catch (err) {
    console.error("[ServiceStatus] Auto-seeding failed:", err.message);
  }
};

/**
 * Public endpoint to fetch all active service status indicators
 * Scoped strictly by user role permissions and served directly from memory cache
 */
export const getActiveServiceStatusesPublic = async (req, res) => {
  try {
    // 1. Check if DB needs seeding
    const dbCount = await ServiceStatus.countDocuments();
    if (dbCount === 0) {
      await seedDefaultStatusesIfEmpty();
      clearPublicStatusCache();
    }

    // 2. Fetch/Populate Cache
    if (!cachedPublicActiveStatuses) {
      const now = new Date();
      cachedPublicActiveStatuses = await ServiceStatus.find({
        isActive: true,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: now } }
        ]
      }).sort({ serviceName: 1 });
    }

    // 3. Resolve user context and filter cached elements in memory
    const user = await User.findById(req.user.id);
    const allowedAudiences = getAudienceListForUser(user);
    
    const filteredStatuses = cachedPublicActiveStatuses.filter(status => 
      allowedAudiences.includes(status.targetAudience)
    );

    return res.json({ status: "success", data: filteredStatuses });
  } catch (err) {
    console.error("[ServiceStatus Public] Error:", err.message);
    return res.status(500).json({ status: "error", message: "Failed to fetch status indices." });
  }
};

/**
 * Admin: Get all service statuses (both active and inactive)
 */
export const getServiceStatusesAdmin = async (req, res) => {
  try {
    // Check seeding
    await seedDefaultStatusesIfEmpty();
    
    const statuses = await ServiceStatus.find({})
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
      
    return res.json({ status: "success", data: statuses });
  } catch (err) {
    console.error("[ServiceStatus Admin] Error:", err.message);
    return res.status(500).json({ status: "error", message: "Failed to retrieve status entries." });
  }
};

/**
 * Admin: Create a new service status alert
 */
export const createServiceStatusAdmin = async (req, res) => {
  try {
    const { serviceName, statusType, statusMessage, severityColor, targetAudience, expiresAt, isActive } = req.body;
    
    if (!serviceName || !statusMessage) {
      return res.status(400).json({ status: "error", message: "ServiceName and StatusMessage are required fields." });
    }

    const newStatus = await ServiceStatus.create({
      serviceName,
      statusType: statusType || 'active',
      statusMessage,
      severityColor: severityColor || 'green',
      targetAudience: targetAudience || 'all',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdBy: req.user.id
    });

    // Populate createdBy before socket dispatch
    const populatedStatus = await ServiceStatus.findById(newStatus._id).populate("createdBy", "name email");

    // Invalidate memory cache
    clearPublicStatusCache();

    // Broadcast update via WebSocket
    socketService.emitServiceStatusUpdate(populatedStatus);

    return res.status(201).json({ status: "success", data: populatedStatus });
  } catch (err) {
    console.error("[ServiceStatus Admin Create] Error:", err.message);
    return res.status(500).json({ status: "error", message: "Failed to create status update." });
  }
};

/**
 * Admin: Update service status notice
 */
export const updateServiceStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
        if (id && !id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid resource identifier format." });
    const updateFields = req.body;

    if (updateFields.expiresAt) {
      updateFields.expiresAt = new Date(updateFields.expiresAt);
    }

    const updated = await ServiceStatus.findByIdAndUpdate(id, updateFields, { new: true })
      .populate("createdBy", "name email");

    if (!updated) {
      return res.status(404).json({ status: "error", message: "Status entry not found." });
    }

    // Invalidate cache
    clearPublicStatusCache();

    // Broadcast update
    socketService.emitServiceStatusUpdate(updated);

    return res.json({ status: "success", data: updated });
  } catch (err) {
    console.error("[ServiceStatus Admin Update] Error:", err.message);
    return res.status(500).json({ status: "error", message: "Failed to update status." });
  }
};

/**
 * Admin: Delete service status notice
 */
export const deleteServiceStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
        if (id && !id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid resource identifier format." });
    
    const statusToDelete = await ServiceStatus.findById(id);
    if (!statusToDelete) {
      return res.status(404).json({ status: "error", message: "Status entry not found." });
    }

    await ServiceStatus.findByIdAndDelete(id);

    // Invalidate cache
    clearPublicStatusCache();

    // Broadcast a custom deactivation packet so clients know to remove it
    socketService.emitServiceStatusUpdate({
      _id: id,
      isActive: false
    });

    return res.json({ status: "success", message: "Status entry deleted successfully." });
  } catch (err) {
    console.error("[ServiceStatus Admin Delete] Error:", err.message);
    return res.status(500).json({ status: "error", message: "Failed to delete status." });
  }
};
