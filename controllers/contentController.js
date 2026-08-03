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
        if (reseller.resellerTier === 'premium') {
            // Premium: Show ONLY their own banners (no global/admin banners)
            query.resellerId = reseller._id;
            query.ownerType = 'reseller';
        } else {
            // Basic: Show nothing (global is blocked)
            query._id = null; // Forces empty result
        }
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
      ownerType: 'admin',
      targetAudience: targetAudience || 'public',
      forceGlobal: type === 'marquee' ? true : (req.body.forceGlobal || false)
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
 
    // For marquee, ensure only one is active at a time
    if (updates.type === "marquee" && updates.is_active === true) {
      await Content.updateMany({ _id: { $ne: id }, type: "marquee", ownerType: 'admin' }, { is_active: false });
    }
 
    if (updates.type === "marquee") {
      updates.forceGlobal = true;
    }
 
    const content = await Content.findByIdAndUpdate(id, updates, { new: true });
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
    const content = await Content.findByIdAndDelete(id);
    if (!content) return res.status(404).json({ message: "Content not found" });
    res.json({ message: "Content deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
