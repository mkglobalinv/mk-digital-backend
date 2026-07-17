import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

const dbUrl = process.env.MONGO_URI;

mongoose.connect(dbUrl)
    .then(async () => {
        const db = mongoose.connection.db;
        const referrer = await db.collection("users").findOne({ _id: new mongoose.Types.ObjectId("6a1b120ad6eb0f33dc8c6c32") });
        console.log("Referrer:", referrer?.email);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
