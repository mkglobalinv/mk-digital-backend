import { createVirtualAccount } from "./services/flutterwaveService.js";

async function test() {
  console.log("Testing with BVN=null (Current implementation)...");
  const resultWithoutBvn = await createVirtualAccount({
    email: "test_" + Date.now() + "@9jasub.com",
    bvn: null,
    phone: "08012345678",
    firstname: "Test",
    lastname: "User"
  });
  console.log("Result WITHOUT BVN:", JSON.stringify(resultWithoutBvn, null, 2));

  console.log("\nTesting with dummy BVN (Previous implementation)...");
  const resultWithBvn = await createVirtualAccount({
    email: "test2_" + Date.now() + "@9jasub.com",
    bvn: "12345678901", // Dummy BVN, might still get rejected if FW validates it
    phone: "08012345678",
    firstname: "Test",
    lastname: "User"
  });
  console.log("Result WITH BVN:", JSON.stringify(resultWithBvn, null, 2));
}

test();
