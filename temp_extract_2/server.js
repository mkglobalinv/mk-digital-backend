import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import Transaction from "./models/Transaction.js";
import { buyAirtime } from "./services/vtuService.js";

dotenv.config();

const app = express();
app.use(express.json());
// Secure CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

// CONNECT DB
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp")
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log(err));

// USER MODEL
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  balance: { type: Number, default: 0 }
});
const User = mongoose.model("User", userSchema);

// AUTH MIDDLEWARE
const auth = (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "No token" });
    if (token.startsWith("Bearer ")) token = token.split(" ")[1];

    const verified = jwt.verify(token, process.env.JWT_SECRET || "mysecretkey");
    req.user = verified;
    next();
  } catch (err) {
    console.log("TOKEN ERROR:", err.message);
    res.status(400).json({ message: "Invalid token" });
  }
};

app.get("/", (req, res) => {
  res.send("MK Digital Backend Running 🚀");
});

// REGISTER
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.json({ message: "User registered ✅" });
  } catch (err) {
    console.log("REGISTER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "mysecretkey");
    res.json({ token, balance: user.balance }); // also return balance nicely
  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET USER INFO
app.get("/user/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -__v");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.log("FETCH USER ERROR:", err);
    res.status(500).json({ message: "Error fetching user data" });
  }
});

/* ============================ */
/*   PAYSTACK WALLET FUNDING    */
/* ============================ */

app.post("/paystack/initialize", auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });

    const user = await User.findById(req.user.id);
    
    // Call Paystack API
    const paystackRes = await axios.post('https://api.paystack.co/transaction/initialize', {
      email: user.email,
      amount: amount * 100, // Paystack expects Kobo
      callback_url: "http://localhost:5173/wallet",
      metadata: { userId: user._id }
    }, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });

    res.json({ checkoutUrl: paystackRes.data.data.authorization_url });
  } catch(err) {
    console.log("PAYSTACK INIT ERR:", err.response?.data || err.message);
    res.status(500).json({ message: "Could not initialize payment" });
  }
});

app.post("/paystack/webhook", async (req, res) => {
  // Validate incoming webhook signature
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return res.status(500).send("No Paystack Secret Provided");
  
  const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(400).send("Invalid signature");
  }

  const event = req.body;

  if (event.event === 'charge.success') {
    const reference = event.data.reference;
    const amountPaid = event.data.amount / 100;
    const userId = event.data.metadata?.userId;

    // Fast Idempotency Check: Exit if transaction exists
    const exists = await Transaction.findOne({ reference });
    if (exists) return res.status(200).send("Already processed");

    if (userId) {
      // Safely Update Balance using MongoDB $inc operator to prevent race conditions
      const updatedUser = await User.findByIdAndUpdate(userId, {
        $inc: { balance: amountPaid }
      }, { new: true });

      if (updatedUser) {
        await Transaction.create({
          userId: userId,
          amount: amountPaid,
          type: "credit",
          status: "success",
          reference: reference,
          description: "Wallet Funding via Paystack"
        });
        console.log(`Successfully funded wallet: ${updatedUser.email} with NGN ${amountPaid}`);
      }
    }
  }

  res.status(200).send("Webhook Received");
});

/* ============================ */
/*      VTPASS AIRTIME API      */
/* ============================ */
app.post("/buy-airtime", auth, async (req, res) => {
  try {
    const { amount, phone, network } = req.body;

    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });
    if (!phone || !network) return res.status(400).json({ message: "Missing details" });

    const user = await User.findById(req.user.id);
    if (user.balance < amount) return res.status(400).json({ message: "Insufficient balance" });

    // Step 1: Pre-emptively deduct balance using $inc safely across multiple requests
    const deductedUser = await User.findOneAndUpdate(
       { _id: user._id, balance: { $gte: amount } },
       { $inc: { balance: -amount } },
       { new: true }
    );

    if (!deductedUser) {
        return res.status(400).json({ message: "Insufficient balance or transaction clash" });
    }

    // Step 2: Attempt VTU purchase via VTPass Service
    let vtuResponse;
    try {
        vtuResponse = await buyAirtime(network, amount, phone);
    } catch(err) {
        // If API fundamentally fails/network error, refund user safely
        await User.findByIdAndUpdate(user._id, { $inc: { balance: amount } });
        return res.status(500).json({ message: "VTU Provider currently unavailable. Refunded." });
    }

    // Step 3: Handle API business response
    if (vtuResponse.status === "success") {
       await Transaction.create({
         userId: user._id,
         type: "debit",   
         status: "success",
         amount, phone, network,
         reference: vtuResponse.reference,
         description: `${network} Airtime Topup`
       });
       res.json({ message: "Airtime purchased successfully", balance: deductedUser.balance });
    } else {
       // Refund if VTPass explicitly fails
       await User.findByIdAndUpdate(user._id, { $inc: { balance: amount } });
       res.status(400).json({ message: vtuResponse.message || "Topup Failed. Refunded.", balance: deductedUser.balance + amount });
    }

  } catch (err) {
    console.log("AIRTIME ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET TRANSACTIONS
app.get("/transactions", auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error fetching transactions" });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SERVE FRONTEND (React Build)
app.use(express.static(path.join(__dirname, "mk-vtu-frontend", "dist")));

app.get("*", (req, res) => {
  if (req.path.startsWith("/paystack") || req.path.startsWith("/buy-airtime") || req.path.startsWith("/transactions") || req.path === "/register" || req.path === "/login" || req.path.startsWith("/user")) {
     return res.status(404).json({ message: "API route not found" });
  }
  res.sendFile(path.join(__dirname, "mk-vtu-frontend", "dist", "index.html"));
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running 🚀");
});
