import axios from "axios";
import mongoose from "mongoose";

async function test() {
  try {
    // 1. Connect to DB to get an admin user token
    await mongoose.connect("mongodb://localhost:27017/vtuapp");
    console.log("Connected to DB");
    
    // Create a dummy campaign directly
    const MarketingCampaign = mongoose.model("MarketingCampaign", new mongoose.Schema({
      title: String
    }));
    const campaign = await MarketingCampaign.create({ title: "Test Delete Campaign" });
    console.log("Created dummy campaign:", campaign._id);
    
    // We need an admin token. Let's just generate one.
    const jwt = (await import("jsonwebtoken")).default;
    const User = mongoose.model("User", new mongoose.Schema({ email: String, role: String }));
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      console.log("No admin found.");
      return;
    }
    
    const Session = mongoose.model("Session", new mongoose.Schema({ token: String, userId: String, isValid: Boolean }));
    
    const token = jwt.sign({ id: admin._id, role: admin.role, session_type: "retail" }, "mk_sub_data_secret_2024_premium", { expiresIn: "1h" });
    await Session.create({ token, userId: admin._id, isValid: true });
    
    console.log("Admin token generated:", token.substring(0, 20) + "...");

    // Send DELETE request
    console.log(`Sending DELETE to http://localhost:5000/api/marketing/admin/campaigns/${campaign._id}`);
    
    const res = await axios.delete(`http://localhost:5000/api/marketing/admin/campaigns/${campaign._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("Response:", res.status, res.data);
    
    // Check if it's still in DB
    const check = await MarketingCampaign.findById(campaign._id);
    console.log("Still in DB?", !!check);
    
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  } finally {
    mongoose.disconnect();
  }
}
test();
