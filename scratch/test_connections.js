import mongoose from 'mongoose';

const uris = [
    "mongodb+srv://Admin:%40Zainab1311231@cluster0.ryufwut.mongodb.net/?appName=Cluster0",
    "mongodb+srv://Admin:Zainab1311231@cluster0.ryufwut.mongodb.net/?appName=Cluster0",
    "mongodb+srv://admin:Zainab1311231@cluster0.ryufwut.mongodb.net/?appName=Cluster0",
    "mongodb+srv://admin:%40Zainab1311231@cluster0.ryufwut.mongodb.net/?appName=Cluster0",
    "mongodb+srv://unuktar1_db_user:Zainab1311231@cluster0.ryufwut.mongodb.net/?appName=Cluster0",
    "mongodb+srv://Admin:Zainab1311231@cluster0.ryufwut.mongodb.net/vtuApp?retryWrites=true&w=majority"
];

async function test() {
    for (const uri of uris) {
        console.log(`Testing: ${uri.replace(/:[^@]+@/, ":****@")}`);
        try {
            await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
            console.log("SUCCESS! ✅");
            await mongoose.disconnect();
            process.exit(0);
        } catch (err) {
            console.log(`FAILED: ${err.message} ❌`);
        }
    }
    process.exit(1);
}

test();
