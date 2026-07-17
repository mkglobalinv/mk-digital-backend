/**
 * verify_repair.js
 * 
 * Verifies the tenant isolation repair is correct by:
 * 1. Checking that recently migrated users have tenantOwnerId set correctly
 * 2. Checking that users who used referral codes on the main platform do NOT have tenantOwnerId
 * 3. Simulating findByTenant logic for both main platform and reseller portal
 */

import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

const MONGO_URI = process.env.MONGO_URI;
await mongoose.connect(MONGO_URI);
console.log("=== TENANT REPAIR VERIFICATION ===\n");

// 1. Verify the test user (aminuyahaya0991@gmail.com) was migrated correctly
const testEmail = "aminuyahaya0991@gmail.com";
const testUser = await User.findOne({ email: testEmail });
if (testUser) {
    console.log(`[1] Test user (${testEmail}):`);
    console.log(`    referredBy:    ${testUser.referredBy || "null"}`);
    console.log(`    tenantOwnerId: ${testUser.tenantOwnerId || "null"}`);
    console.log(`    isEmailVerified: ${testUser.isEmailVerified}`);
    
    // 2. Simulate findByTenant on MAIN PLATFORM (resellerId = null)
    const foundOnMain = await User.findByTenant(testEmail, null);
    console.log(`\n[2] findByTenant(email, null) [Main Platform]: ${foundOnMain ? "FOUND ✓" : "NOT FOUND ✗"}`);
    if (!foundOnMain) {
        console.log("    ⚠️  Bug: user STILL hidden on main platform after migration");
        console.log("    This means: tenantOwnerId is set, so main platform correctly excludes them.");
        console.log("    NOTE: This user was migrated as a TENANT CUSTOMER of usnplaytore@gmail.com.");
        console.log("    They should log in on the reseller portal, not the main platform.");
    }
    
    // 3. Simulate findByTenant on RESELLER PORTAL
    if (testUser.tenantOwnerId) {
        const foundOnReseller = await User.findByTenant(testEmail, testUser.tenantOwnerId);
        console.log(`[3] findByTenant(email, resellerId) [Reseller Portal]: ${foundOnReseller ? "FOUND ✓" : "NOT FOUND ✗"}`);
    }
} else {
    console.log(`Test user ${testEmail} not found in DB`);
}

// 4. Find a user who used a referral code on the MAIN PLATFORM (tenantOwnerId should be null)
// These are the 14 "skipped" users from the migration — verify they have no tenantOwnerId
console.log("\n[4] Checking skipped users (should have NO tenantOwnerId):");
const skippedEmails = ["abubakarverst@gmail.com", "arewamk696@gmail.com", "arewa970@gmail.com"];
for (const email of skippedEmails) {
    const u = await User.findOne({ email });
    if (u) {
        const onMain = await User.findByTenant(email, null);
        console.log(`    ${email}: tenantOwnerId=${u.tenantOwnerId || "null"} | findByTenant(main)=${onMain ? "FOUND ✓" : "NOT FOUND ✗"}`);
    }
}

// 5. Count totals
const totalWithTenantOwnerId = await User.countDocuments({ tenantOwnerId: { $ne: null } });
const totalWithReferredBy = await User.countDocuments({ referredBy: { $ne: null } });
const totalMainPlatform = await User.countDocuments({ tenantOwnerId: null, role: "user" });
console.log("\n[5] Database summary:");
console.log(`    Users with tenantOwnerId (portal customers): ${totalWithTenantOwnerId}`);
console.log(`    Users with referredBy (referral lineage):    ${totalWithReferredBy}`);
console.log(`    Users without tenantOwnerId (main platform): ${totalMainPlatform}`);

await mongoose.disconnect();
console.log("\n=== VERIFICATION COMPLETE ===");
