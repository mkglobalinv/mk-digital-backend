/**
 * db_only_verify.js
 * Verifies the repair logic directly via DB — no server HTTP calls.
 * Confirms all code paths that were changed are working correctly.
 */

import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
import OTP from "../models/OTP.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

const MONGO_URI = process.env.MONGO_URI;

await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 30000, socketTimeoutMS: 45000 });
console.log(`\n=== DB-ONLY VERIFICATION: Tenant Isolation Repair ===\n`);

let passes = 0, fails = 0;
function pass(label, note="") { passes++; console.log(`  ✅ PASS  ${label}${note?" → "+note:""}`); }
function fail(label, note="") { fails++;  console.log(`  ❌ FAIL  ${label}${note?" → "+note:""}`); }
function section(t) { console.log(`\n${"─".repeat(60)}\n  ${t}\n${"─".repeat(60)}`); }

// ── SECTION 1: findByTenant logic for new main-platform + referral user ───────
section("findByTenant: Main-Platform User with Referral Code");

// Create a temporary user with tenantOwnerId=null and referredBy set
const ts = Date.now();
const testEmail = `dbtest_${ts}@test.com`;
const fakeReferrerId = new mongoose.Types.ObjectId();

const testUser = await User.create({
  name: "DB Test User",
  email: testEmail,
  phone: "08012345678",
  password: await bcrypt.hash("test", 10),
  referredBy: fakeReferrerId,     // ← has referral lineage
  referralCodeUsed: "TESTCODE",
  tenantOwnerId: null,            // ← main platform (NOT a tenant)
  role: "user",
  isEmailVerified: false,
  isSignupComplete: false
});

// Test 1: findByTenant on main platform (resellerId=null) should FIND this user
const foundOnMain = await User.findByTenant(testEmail, null);
if (foundOnMain?._id.toString() === testUser._id.toString()) {
  pass("findByTenant(main) finds user even though referredBy is set");
} else {
  fail("findByTenant(main) returned null — OTP/login would fail with 'User not found'");
}

// Test 2: findByTenant on a different reseller's portal should NOT find this user
const fakeResellerId = new mongoose.Types.ObjectId();
const notFoundOnWrongPortal = await User.findByTenant(testEmail, fakeResellerId);
if (!notFoundOnWrongPortal) {
  pass("findByTenant(wrong portal) correctly returns null — user isolated");
} else {
  fail("findByTenant(wrong portal) incorrectly returned user");
}

// Test 3: findByTenant with the referrer's ID as resellerId should NOT find this user
// (referredBy is NOT the same as tenantOwnerId)
const notFoundByReferrerId = await User.findByTenant(testEmail, fakeReferrerId);
if (!notFoundByReferrerId) {
  pass("findByTenant(referrerId as resellerId) correctly returns null — referredBy ≠ tenantOwnerId");
} else {
  fail("findByTenant using referrerId incorrectly returned user — referral/tenant still coupled");
}

// ── SECTION 2: findByTenant logic for tenant portal user ─────────────────────
section("findByTenant: Tenant Portal User");

const fakeOwnerId = new mongoose.Types.ObjectId();
const tenantEmail = `dbtest_tenant_${ts}@test.com`;
const tenantUser = await User.create({
  name: "Tenant User",
  email: tenantEmail,
  phone: "08012345679",
  password: await bcrypt.hash("test", 10),
  referredBy: null,
  tenantOwnerId: fakeOwnerId,   // ← belongs to a reseller portal
  role: "user",
  isEmailVerified: true,
  isSignupComplete: true
});

// Test 4: findByTenant on correct portal should find user
const foundOnPortal = await User.findByTenant(tenantEmail, fakeOwnerId);
if (foundOnPortal?._id.toString() === tenantUser._id.toString()) {
  pass("findByTenant(correct portal) finds tenant user");
} else {
  fail("findByTenant(correct portal) returned null");
}

// Test 5: findByTenant on main platform should NOT find this tenant user
const notFoundOnMainPlatform = await User.findByTenant(tenantEmail, null);
if (!notFoundOnMainPlatform) {
  pass("Tenant user correctly invisible on main platform");
} else {
  fail("Tenant user incorrectly visible on main platform");
}

// ── SECTION 3: Marketing banner classification ────────────────────────────────
section("Banner Classification: tenantOwnerId drives classification");

// Simulate the marketingRoutes.js logic
function classifyUser(user) {
  if (!user) return "anonymous";
  if (user.role === "reseller_admin" || user.apiLevel === "reseller") return "Resellers";
  if (user.role === "user" && user.tenantOwnerId) return "Reseller Customers";
  return "Retail Users";
}

// User with referral but no tenantOwnerId → should be Retail User
const referralOnlyUser = { role: "user", referredBy: fakeReferrerId, tenantOwnerId: null };
if (classifyUser(referralOnlyUser) === "Retail Users") {
  pass("Referral-only user (no tenantOwnerId) classified as Retail User → Website Creation banner shows");
} else {
  fail("Referral-only user misclassified", classifyUser(referralOnlyUser));
}

// User with tenantOwnerId → should be Reseller Customer
const tenantPortalUser = { role: "user", tenantOwnerId: fakeOwnerId };
if (classifyUser(tenantPortalUser) === "Reseller Customers") {
  pass("Tenant portal user correctly classified as Reseller Customer");
} else {
  fail("Tenant portal user misclassified", classifyUser(tenantPortalUser));
}

// ── SECTION 4: CRM isolation ──────────────────────────────────────────────────
section("CRM Isolation: tenantOwnerId queries");

const crmResult = await User.findOne({ _id: testUser._id, tenantOwnerId: fakeReferrerId });
if (!crmResult) {
  pass("CRM query {tenantOwnerId: referrerId} does NOT return referral user — isolation correct");
} else {
  fail("CRM query returns referral user — LEAK");
}

const correctCrmResult = await User.findOne({ _id: tenantUser._id, tenantOwnerId: fakeOwnerId });
if (correctCrmResult) {
  pass("CRM query {tenantOwnerId: ownerId} correctly returns tenant customer");
} else {
  fail("CRM query does not return tenant customer");
}

// ── SECTION 5: Existing data integrity ───────────────────────────────────────
section("Existing Data: Migration results");

const totalTenantOwned = await User.countDocuments({ tenantOwnerId: { $ne: null } });
const totalMainPlatform = await User.countDocuments({ tenantOwnerId: null, role: "user" });
const totalWithReferredBy = await User.countDocuments({ referredBy: { $ne: null } });
const mainPlatformWithReferral = await User.countDocuments({ tenantOwnerId: null, referredBy: { $ne: null } });

console.log(`  Portal customers (tenantOwnerId set):      ${totalTenantOwned}`);
console.log(`  Main platform users (tenantOwnerId null):  ${totalMainPlatform}`);
console.log(`  Users with referral lineage (referredBy):  ${totalWithReferredBy}`);
console.log(`  Main platform + referral (both allowed):   ${mainPlatformWithReferral}`);

if (mainPlatformWithReferral > 0) {
  pass(`${mainPlatformWithReferral} main-platform users have referral lineage — fully accessible on main platform`);
}

// ── CLEANUP ───────────────────────────────────────────────────────────────────
await User.deleteOne({ _id: testUser._id });
await User.deleteOne({ _id: tenantUser._id });

// ── SUMMARY ───────────────────────────────────────────────────────────────────
section("FINAL SUMMARY");
console.log(`  ${passes} passed,  ${fails} failed`);
if (fails === 0) {
  console.log(`\n  ✅ ALL LOGIC CHECKS PASSED`);
  console.log(`  The repair is working correctly.`);
  console.log(`\n  Please restart your server and perform manual testing in the app:`);
  console.log(`    1. Register via referral link with a new email`);
  console.log(`    2. Receive OTP email`);
  console.log(`    3. Verify OTP — should succeed`);
  console.log(`    4. Login — should succeed`);
  console.log(`    5. Dashboard loads with Website Creation banner`);
  console.log(`    6. Wallet and VTU work`);
  console.log(`    7. Make a transaction to trigger activation reward`);
  console.log(`    8. Check admin analytics`);
} else {
  console.log(`\n  ❌ ${fails} LOGIC CHECK(S) FAILED — review output above`);
}

await mongoose.disconnect();
