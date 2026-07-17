import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vtuapp");
    console.log("Connected to DB");

    const MarketingCampaign = mongoose.model("MarketingCampaign", new mongoose.Schema({}, { strict: false }));
    const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
    const Session = mongoose.model("Session", new mongoose.Schema({}, { strict: false }));

    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
        console.log("No admin found.");
        return;
    }

    const jwt = (await import("jsonwebtoken")).default;
    const token = jwt.sign({ id: admin._id, role: admin.role, session_type: "retail" }, process.env.JWT_SECRET || "mk_sub_data_secret_2024_premium", { expiresIn: "1h" });
    await Session.create({ token, userId: admin._id, isValid: true });

    // CREATE
    console.log("Creating campaign...");
    const createRes = await axios.post("http://127.0.0.1:5000/api/marketing/admin/campaigns", {
        title: "Test Delete Flow",
        campaignType: "Promotion"
    }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    
    const newId = createRes.data._id;
    console.log("Created:", newId);

    // DELETE
    console.log(`Sending DELETE to http://127.0.0.1:5000/api/marketing/admin/campaigns/${newId}`);
    
    // Simulate exactly what frontend does
    const deleteRes = await axios.delete(`http://127.0.0.1:5000/api/marketing/admin/campaigns/${newId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("DELETE Response:", deleteRes.status, deleteRes.data);
    
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}
run();
