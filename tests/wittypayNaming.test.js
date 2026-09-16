import { buildWittypayTemporaryCustomerName } from "../services/wittypayService.js";

const runTests = () => {
  const testCases = [
    {
      name: "1. Standard Tenant & Customer Name (MUKTAR)",
      tenantBrand: "MIDATA",
      customerName: "MUKTAR UMAR IBRAHIM",
      expected: "MUK"
    },
    {
      name: "2. Customer (AHMAD BELLO USMAN)",
      tenantBrand: "ABC DIGITAL",
      customerName: "AHMAD BELLO USMAN",
      expected: "AHM"
    },
    {
      name: "3. Customer (ALI MUSA)",
      tenantBrand: "MK GLOBAL",
      customerName: "ALI MUSA",
      expected: "ALI"
    },
    {
      name: "4. Customer (MOHAMMED ALI)",
      tenantBrand: "JASUB",
      customerName: "MOHAMMED ALI",
      expected: "MOH"
    },
    {
      name: "5. Lowercase Input Handling",
      tenantBrand: "midata",
      customerName: "muktar umar",
      expected: "MUK"
    },
    {
      name: "6. Leading & Trailing Spaces Handling",
      tenantBrand: "  Midata  ",
      customerName: "  Muktar  ",
      expected: "MUK"
    },
    {
      name: "7. Short Name (< 3 Chars) Handling (Ed)",
      tenantBrand: "Jo",
      customerName: "Ed",
      expected: "ED"
    }
  ];

  let passed = 0;
  let failed = 0;

  console.log("==================================================");
  console.log("   WITTYPAY TEMPORARY ACCOUNT NAMING UNIT TESTS   ");
  console.log("==================================================\n");

  testCases.forEach((tc, index) => {
    const result = buildWittypayTemporaryCustomerName(tc.tenantBrand, tc.customerName);
    const isOk = result === tc.expected;
    if (isOk) {
      passed++;
      console.log(`[PASS] Test ${index + 1}: ${tc.name}`);
      console.log(`       Input: Brand="${tc.tenantBrand}", Customer="${tc.customerName}"`);
      console.log(`       Output: "${result}" (Expected: "${tc.expected}")\n`);
    } else {
      failed++;
      console.error(`[FAIL] Test ${index + 1}: ${tc.name}`);
      console.error(`       Input: Brand="${tc.tenantBrand}", Customer="${tc.customerName}"`);
      console.error(`       Got: "${result}", Expected: "${tc.expected}"\n`);
    }
  });

  console.log("==================================================");
  console.log(`SUMMARY: Total=${testCases.length} | Passed=${passed} | Failed=${failed}`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
};

runTests();
