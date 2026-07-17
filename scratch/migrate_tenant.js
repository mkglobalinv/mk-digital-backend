/**
 * migrate_tenant.js
 *
 * SAFE ONE-TIME MIGRATION SCRIPT
 *
 * Purpose: Populate tenantOwnerId for users who were created via a Reseller portal
 *          BEFORE the tenantOwnerId field existed.
 *
 * Migration strategy:
 *   Only assigns tenantOwnerId when ownership is confirmed by:
 *     (a) The user's referredBy points to a CONFIRMED Active Reseller
 *         (whiteLabelStatus === 'active')
 *     AND
 *     (b) The user was created AFTER the reseller was activated
 *         (createdAt >= reseller's first activation — proxied by trialStartDate or createdAt)
 *
 * This avoids:
 *   - Assigning tenantOwnerId to users who simply followed a referral link
 *     but registered on the main platform
 *   - Guessing ownership based on referralCode alone
 *
 * Run in DRY_RUN=true mode first (default), review report, then run with DRY_RUN=false.
 */

import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

const DRY_RUN = process.env.DRY_RUN !== "false"; // default: dry run
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI not set");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log(`\n=== TENANT MIGRATION SCRIPT ===`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE (will write to DB)"}`);
  console.log(`Connected to: ${mongoose.connection.host}\n`);

  // 1. Find all active resellers
  const activeResellers = await User.find({
    $or: [
      { whiteLabelStatus: "active" },
      { resellerActivationStatus: "active" }
    ]
  }).select("_id email whiteLabelStatus resellerActivationStatus createdAt trialStartDate");

  console.log(`Found ${activeResellers.length} active resellers\n`);

  const report = {
    totalCandidates: 0,
    alreadyHasTenantOwnerId: 0,
    willBeAssigned: [],
    skipped: []
  };

  for (const reseller of activeResellers) {
    // Find all users whose referredBy points to this reseller
    const candidates = await User.find({
      referredBy: reseller._id,
      role: { $ne: "reseller_admin" }
    }).select("_id email createdAt tenantOwnerId referredBy referralCodeUsed");

    for (const user of candidates) {
      report.totalCandidates++;

      if (user.tenantOwnerId) {
        report.alreadyHasTenantOwnerId++;
        continue; // already migrated
      }

      // Ownership confirmation:
      // The user must have registered AFTER the reseller was created (i.e., they were
      // a customer of that reseller's portal, not simply someone who used a referral link
      // from before the reseller became active).
      //
      // NOTE: Without a registration_source field, we cannot definitively distinguish
      // between a main-platform referral and a portal registration for legacy data.
      // We apply a CONSERVATIVE rule: only assign if the reseller was already active
      // when the user registered.
      const resellerActiveSince = reseller.trialStartDate || reseller.createdAt;
      const isConfirmedTenant = user.createdAt >= resellerActiveSince;

      if (isConfirmedTenant) {
        report.willBeAssigned.push({
          userId: user._id.toString(),
          userEmail: user.email,
          resellerId: reseller._id.toString(),
          resellerEmail: reseller.email,
          userCreatedAt: user.createdAt
        });
      } else {
        report.skipped.push({
          userId: user._id.toString(),
          userEmail: user.email,
          reason: "User predates reseller activation — likely a referral, not a tenant customer"
        });
      }
    }
  }

  // Print report
  console.log("=== MIGRATION REPORT ===");
  console.log(`Total candidates (users with referredBy → active reseller): ${report.totalCandidates}`);
  console.log(`Already have tenantOwnerId (no action needed): ${report.alreadyHasTenantOwnerId}`);
  console.log(`Will assign tenantOwnerId: ${report.willBeAssigned.length}`);
  console.log(`Skipped (insufficient evidence of portal registration): ${report.skipped.length}`);

  if (report.willBeAssigned.length > 0) {
    console.log("\n--- WILL ASSIGN ---");
    for (const entry of report.willBeAssigned) {
      console.log(`  User: ${entry.userEmail} (${entry.userId})`);
      console.log(`    → tenantOwnerId: ${entry.resellerEmail} (${entry.resellerId})`);
      console.log(`    Created: ${entry.userCreatedAt}\n`);
    }
  }

  if (report.skipped.length > 0) {
    console.log("\n--- SKIPPED ---");
    for (const entry of report.skipped) {
      console.log(`  User: ${entry.userEmail} (${entry.userId})`);
      console.log(`    Reason: ${entry.reason}\n`);
    }
  }

  if (!DRY_RUN && report.willBeAssigned.length > 0) {
    console.log("\n=== APPLYING UPDATES ===");
    for (const entry of report.willBeAssigned) {
      await User.findByIdAndUpdate(entry.userId, {
        $set: { tenantOwnerId: new mongoose.Types.ObjectId(entry.resellerId) }
      });
      console.log(`  ✓ Updated ${entry.userEmail}`);
    }
    console.log(`\nDone. ${report.willBeAssigned.length} users updated.`);
  } else if (DRY_RUN) {
    console.log("\n⚠️  DRY RUN complete. No changes were made.");
    console.log("  To apply, run: DRY_RUN=false node scratch/migrate_tenant.js");
  }

  await mongoose.disconnect();
}

run().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
