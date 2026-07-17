import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Withdrawal from "../models/Withdrawal.js";

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vtuapp");
        console.log("Connected to MongoDB for Migration Execution.");

        const emails = [
            "reffar34@gmail.com",
            "unuktar1@gmail.com",
            "mkcollectn@gmail.com",
            "reciprocaltech@gmail.com",
            "unuktar@gmail.com"
        ];

        for (const email of emails) {
            console.log(`\nProcessing email group: ${email}`);
            const users = await User.find({ email: email.toLowerCase() }).sort({ createdAt: 1 });
            if (users.length <= 1) continue;

            let primary = null;
            let primaryScore = -1;

            const getScore = (u) => {
                if (u.role === 'superadmin') return 100;
                if (u.role === 'admin') return 90;
                if (u.role === 'reseller_admin' && u.resellerActivationStatus === 'active') return 80;
                if (u.role === 'reseller_admin') return 70;
                if (u.whiteLabelStatus === 'active') return 60;
                return 10;
            };

            for (const u of users) {
                const score = getScore(u);
                if (score > primaryScore) {
                    primaryScore = score;
                    primary = u;
                }
            }

            const duplicates = users.filter(u => u._id.toString() !== primary._id.toString());

            // 3. Generate missing referral codes for surviving primary accounts
            if (!primary.referralCode || primary.referralCode === 'N/A') {
                primary.referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
                console.log(`Generated new referralCode ${primary.referralCode} for primary ${primary._id}`);
            }

            // 4. Sync subdomain -> admin_subdomain
            if (primary.subdomain && !primary.admin_subdomain) {
                primary.admin_subdomain = primary.subdomain;
                console.log(`Synced subdomain -> admin_subdomain (${primary.subdomain}) for primary ${primary._id}`);
            }

            await primary.save();

            for (const dup of duplicates) {
                console.log(` - Processing duplicate: ${dup._id}`);

                // 5. Relink transactions
                const txs = await Transaction.updateMany(
                    { userId: dup._id },
                    { $set: { userId: primary._id } }
                );
                if (txs.modifiedCount > 0) console.log(`   Relinked ${txs.modifiedCount} Transactions.`);

                const txsRes = await Transaction.updateMany(
                    { resellerId: dup._id },
                    { $set: { resellerId: primary._id } }
                );
                if (txsRes.modifiedCount > 0) console.log(`   Relinked ${txsRes.modifiedCount} Transactions (resellerId).`);

                const wdl = await Withdrawal.updateMany(
                    { userId: dup._id },
                    { $set: { userId: primary._id } }
                );
                if (wdl.modifiedCount > 0) console.log(`   Relinked ${wdl.modifiedCount} Withdrawals.`);

                // 6. Relink referrals
                const refs = await User.updateMany(
                    { referredBy: dup._id },
                    { $set: { referredBy: primary._id } }
                );
                if (refs.modifiedCount > 0) console.log(`   Relinked ${refs.modifiedCount} Referred Users.`);

                // 7. Transfer duplicate wallet balances
                const dupBalance1 = dup.balance1 || 0;
                const dupBalance2 = dup.balance2 || 0;
                const totalBalance = dupBalance1 + dupBalance2;
                const dupEarnings = dup.earningsBalance || 0;

                if (totalBalance > 0 || dupEarnings > 0) {
                    await User.updateOne(
                        { _id: primary._id },
                        { 
                            $inc: { 
                                balance1: totalBalance,
                                earningsBalance: dupEarnings 
                            } 
                        }
                    );
                    console.log(`   Transferred ₦${totalBalance} wallet and ₦${dupEarnings} earnings to primary.`);
                }

                // 8. Soft archive duplicate accounts
                await User.updateOne(
                    { _id: dup._id },
                    {
                        $set: {
                            archived: true,
                            archivedReason: "duplicate_email_merge",
                            mergedInto: primary._id,
                            archivedAt: new Date(),
                            balance1: 0,
                            balance2: 0,
                            earningsBalance: 0
                        }
                    }
                );
                console.log(`   Soft Archived duplicate ${dup._id}.`);
            }
        }

        // 9. Create new global unique email index
        console.log("\nRebuilding Email Index...");
        try {
            await User.collection.dropIndex("email_1_referredBy_1");
            console.log("Dropped old compound index 'email_1_referredBy_1'");
        } catch (e) {
            console.log("Old compound index not found or already dropped.");
        }

        try {
            await User.collection.dropIndex("email_1");
        } catch (e) {}

        await User.collection.createIndex(
            { email: 1 }, 
            { 
                unique: true, 
                partialFilterExpression: { archived: false } 
            }
        );
        console.log("Created new unique global email index with partialFilterExpression { archived: false }.");

        console.log("\nMigration completed successfully.");
        process.exit(0);

    } catch (err) {
        console.error("Error during migration execution:", err);
        process.exit(1);
    }
};

run();
