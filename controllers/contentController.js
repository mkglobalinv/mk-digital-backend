import Content from "../models/Content.js";

export const getAllContent = async (req, res) => {
  try {
    const { type, activeOnly, platform } = req.query;
    const reseller = req.reseller; // From whiteLabelMiddleware
    
    let query = {};
    if (activeOnly === 'true') {
      query.is_active = true;
    }
    if (type) query.type = type;
 
    if (reseller && platform !== 'global') {
        let conditions = [];
        // Premium: Show ONLY their own banners (no global/admin banners)
        if (reseller.resellerTier === 'premium' || reseller.resellerTier === 'vip' || reseller.resellerTier === 'basic') {
            conditions.push({ resellerId: reseller._id, ownerType: 'reseller' });
        }
        // ALWAYS allow admin forced global content to show for all tiers
        conditions.push({ forceGlobal: true, ownerType: 'admin' });
        
        query.$or = conditions;
    } else {
        // Main Platform or platform=global requested: Show only Admin banners
        query.ownerType = 'admin';
    }
 
    const contents = await Content.find(query).sort({ created_at: -1 });
    res.json(contents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
export const createContent = async (req, res) => {
  try {
    const { type, title, message, image, link, is_active, start_date, end_date, targetAudience } = req.body;
    const isReseller = req.user?.role === 'reseller_admin';

    // For marquee, ensure only one is active at a time if this one is active
    if (type === "marquee" && is_active !== false) {
      await Content.updateMany({ type: "marquee", ownerType: 'admin' }, { is_active: false });
    }

    const content = new Content({
      type,
      title,
      message,
      image,
      link,
      is_active,
      start_date,
      end_date,
      // Security: this endpoint is also reachable by reseller_admin (via
      // adminAuth). A reseller must never be able to create admin-owned or
      // forceGlobal (platform-wide) content — only content scoped to their
      // own tenant, matching the resellerId/ownerType convention already
      // used by the dedicated reseller content endpoints in
      // resellerController.js (createResellerContent). Ignore any
      // ownerType/forceGlobal the request body tries to set for this role.
      ownerType: isReseller ? 'reseller' : 'admin',
      resellerId: isReseller ? req.user.id : undefined,
      targetAudience: targetAudience || 'public',
      forceGlobal: isReseller ? false : (type === 'marquee' ? true : (req.body.forceGlobal || false))
    });

    await content.save();
    res.status(201).json(content);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
        if (id && !id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid resource identifier format." });
    const updates = req.body;
    const isReseller = req.user?.role === 'reseller_admin';

    // Security: scope both the ownership check and the update itself to the
    // caller's own tenant when a reseller_admin is calling this admin-tier
    // endpoint, and strip anything that would let them escalate their own
    // content to admin-owned/platform-wide. admin/superadmin are unrestricted.
    let filter = { _id: id };
    if (isReseller) {
      filter.resellerId = req.user.id;
      delete updates.ownerType;
      delete updates.resellerId;
      delete updates.forceGlobal;
      if (updates.type === 'marquee') delete updates.type; // marquee is admin-only
    } else {
      // For marquee, ensure only one is active at a time
      if (updates.type === "marquee" && updates.is_active === true) {
        await Content.updateMany({ _id: { $ne: id }, type: "marquee", ownerType: 'admin' }, { is_active: false });
      }
      if (updates.type === "marquee") {
        updates.forceGlobal = true;
      }
    }

    const content = await Content.findOneAndUpdate(filter, updates, { new: true });
    if (!content) return res.status(404).json({ message: "Content not found" });

    res.json(content);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteContent = async (req, res) => {
  try {
    const { id } = req.params;
        if (id && !id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid resource identifier format." });
    // Security: a reseller_admin may only delete their own tenant's content
    // through this admin-tier endpoint, never another tenant's or the main
    // platform's. admin/superadmin are unrestricted.
    const filter = req.user?.role === 'reseller_admin'
      ? { _id: id, resellerId: req.user.id }
      : { _id: id };
    const content = await Content.findOneAndDelete(filter);
    if (!content) return res.status(404).json({ message: "Content not found" });
    res.json({ message: "Content deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
