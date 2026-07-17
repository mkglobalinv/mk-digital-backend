import mongoose from "mongoose";
import dotenv from "dotenv";
import Content from "../models/Content.js";

dotenv.config();

const deleteTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const contents = await Content.find();
        console.log(`Found ${contents.length} items.`);

        if (contents.length > 0) {
            const id = contents[0]._id;
            console.log(`Deleting item with ID: ${id}`);
            const result = await Content.findByIdAndDelete(id);
            console.log("Delete result:", result);
        } else {
            console.log("No items to delete.");
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err);
    }
};

deleteTest();
