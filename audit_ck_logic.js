import { buyDataWithClubkonnect } from "./services/providers/clubkonnect.js";
import dotenv from "dotenv";
dotenv.config();

// Simple Manual Mock for Axios
import axios from "axios";

async function runAuditTest() {
    console.log("--- STARTING CLUBKONNECT STATUS AUDIT ---");

    const originalGet = axios.get;

    // TEST CASE 1: Status Code 100 (Previously fake success)
    axios.get = async () => ({
        status: 200,
        data: {
            statuscode: "100",
            status: "ORDER_RECEIVED",
            remark: "Order is processing"
        }
    });

    console.log("\n[Test 1] Simulating 'ORDER_RECEIVED' (statuscode 100)...");
    const result1 = await buyDataWithClubkonnect("MTN", "1", "08030000000");
    console.log("Result Status:", result1.status);
    if (result1.status === "success") {
        console.error("FAIL: 100 was incorrectly marked as SUCCESS!");
    } else {
        console.log("PASS: 100 was correctly marked as", result1.status);
    }

    // TEST CASE 2: Explicit Success
    axios.get = async () => ({
        status: 200,
        data: {
            statuscode: "200",
            status: "ORDER_COMPLETED",
            remark: "Success"
        }
    });

    console.log("\n[Test 2] Simulating 'ORDER_COMPLETED'...");
    const result2 = await buyDataWithClubkonnect("MTN", "1", "08030000000");
    console.log("Result Status:", result2.status);
    if (result2.status === "success") {
        console.log("PASS: ORDER_COMPLETED correctly marked as SUCCESS");
    } else {
        console.error("FAIL: ORDER_COMPLETED was not marked as SUCCESS!");
    }

    // TEST CASE 3: Explicit Failure
    axios.get = async () => ({
        status: 200,
        data: {
            statuscode: "400",
            status: "FAILED",
            remark: "Insufficient Balance"
        }
    });

    console.log("\n[Test 3] Simulating 'FAILED'...");
    const result3 = await buyDataWithClubkonnect("MTN", "1", "08030000000");
    console.log("Result Status:", result3.status);
    if (result3.status === "failed") {
        console.log("PASS: FAILED correctly marked as failed");
    } else {
        console.error("FAIL: FAILED was incorrectly marked as", result3.status);
    }

    // Restore original
    axios.get = originalGet;
    console.log("\n--- AUDIT COMPLETE ---");
}

runAuditTest();
