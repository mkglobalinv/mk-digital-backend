import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

async function testTempVaNoAmount() {
  try {
    const response = await axios.post(
      "https://api.flutterwave.com/v3/virtual-account-numbers",
      {
        email: "test_temp_no_amount_" + Date.now() + "@9jasub.com",
        is_permanent: false,
        tx_ref: `TEMP-VA-${Date.now()}`,
        phonenumber: "08012345678",
        firstname: "Test",
        lastname: "Temp",
        narration: "MKSubData Temp Account"
      },
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    console.log("SUCCESS Temp VA No Amount:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("FAIL Temp VA No Amount:", JSON.stringify(error.response?.data || error.message, null, 2));
  }
}

testTempVaNoAmount();
