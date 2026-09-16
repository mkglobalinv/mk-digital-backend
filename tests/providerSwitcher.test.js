import { buildWittypayTemporaryCustomerName } from "../services/wittypayService.js";

// Mock providers helper for testing failover logic in isolation
const runFailoverSimulation = (priority, enabled, providerMocks) => {
  const activeProviders = priority.filter(pKey => providerMocks[pKey] && enabled[pKey] !== false);

  if (activeProviders.length === 0) {
    return { status: "error", message: "No payment provider enabled", attempts: [] };
  }

  const attempts = [];
  let lastErrorMessage = "Payment provider service unavailable.";

  for (let i = 0; i < activeProviders.length; i++) {
    const pKey = activeProviders[i];
    const provider = providerMocks[pKey];
    attempts.push(pKey);
    try {
      const response = provider.fn();
      if (response?.status === "success" && response?.data) {
        return {
          ...response,
          provider: pKey,
          attempts
        };
      }
      lastErrorMessage = response?.message || `${pKey} creation failed`;
    } catch (err) {
      lastErrorMessage = err.message;
    }
  }

  return { status: "error", message: lastErrorMessage, attempts };
};

const runSwitcherTests = () => {
  console.log("==================================================");
  console.log("   PAYMENT PROVIDER SWITCHER & FAILOVER TESTS     ");
  console.log("==================================================\n");

  const defaultPriority = ["wittypay", "flutterwave", "paymentpoint"];
  
  // Standard provider mocks
  const mockProvidersSuccessAll = {
    wittypay: { fn: () => ({ status: "success", data: { account_number: "11111" } }) },
    flutterwave: { fn: () => ({ status: "success", data: { account_number: "22222" } }) },
    paymentpoint: { fn: () => ({ status: "success", data: { account_number: "33333" } }) }
  };

  const mockProvidersWittypayFails = {
    wittypay: { fn: () => ({ status: "error", message: "Wittypay VA creation failed" }) },
    flutterwave: { fn: () => ({ status: "success", data: { account_number: "22222" } }) },
    paymentpoint: { fn: () => ({ status: "success", data: { account_number: "33333" } }) }
  };

  let passed = 0;
  let failed = 0;

  function assert(name, condition, details) {
    if (condition) {
      passed++;
      console.log(`[PASS] ${name}`);
      if (details) console.log(`       ${details}`);
      console.log("");
    } else {
      failed++;
      console.error(`[FAIL] ${name}`);
      if (details) console.error(`       ${details}`);
      console.error("");
    }
  }

  // Test A: Wittypay ON, Flutterwave ON, PaymentPoint ON
  {
    const enabled = { wittypay: true, flutterwave: true, paymentpoint: true };
    const res = runFailoverSimulation(defaultPriority, enabled, mockProvidersSuccessAll);
    assert(
      "Test A: All ON -> Wittypay Primary",
      res.provider === "wittypay" && res.attempts.join(",") === "wittypay",
      `Provider: ${res.provider}, Attempts: [${res.attempts.join(", ")}]`
    );
  }

  // Test B: Wittypay OFF -> Flutterwave -> PaymentPoint
  {
    const enabled = { wittypay: false, flutterwave: true, paymentpoint: true };
    const res = runFailoverSimulation(defaultPriority, enabled, mockProvidersSuccessAll);
    assert(
      "Test B: Wittypay OFF -> Flutterwave Next",
      res.provider === "flutterwave" && res.attempts.join(",") === "flutterwave",
      `Provider: ${res.provider}, Attempts: [${res.attempts.join(", ")}]`
    );
  }

  // Test C: Flutterwave OFF -> Wittypay -> PaymentPoint
  {
    const enabled = { wittypay: true, flutterwave: false, paymentpoint: true };
    const res = runFailoverSimulation(defaultPriority, enabled, mockProvidersSuccessAll);
    assert(
      "Test C: Flutterwave OFF -> Wittypay Primary",
      res.provider === "wittypay" && res.attempts.join(",") === "wittypay",
      `Provider: ${res.provider}, Attempts: [${res.attempts.join(", ")}]`
    );
  }

  // Test D: PaymentPoint OFF -> Wittypay -> Flutterwave
  {
    const enabled = { wittypay: true, flutterwave: true, paymentpoint: false };
    const res = runFailoverSimulation(defaultPriority, enabled, mockProvidersWittypayFails);
    assert(
      "Test D: PaymentPoint OFF -> Wittypay fails -> Flutterwave fallback",
      res.provider === "flutterwave" && res.attempts.join(",") === "wittypay,flutterwave",
      `Provider: ${res.provider}, Attempts: [${res.attempts.join(", ")}]`
    );
  }

  // Test E: Only Wittypay ON
  {
    const enabled = { wittypay: true, flutterwave: false, paymentpoint: false };
    const res = runFailoverSimulation(defaultPriority, enabled, mockProvidersWittypayFails);
    assert(
      "Test E: Only Wittypay ON -> Wittypay fails -> No further fallback",
      res.status === "error" && res.attempts.join(",") === "wittypay",
      `Status: ${res.status}, Message: "${res.message}", Attempts: [${res.attempts.join(", ")}]`
    );
  }

  // Test F: All providers OFF
  {
    const enabled = { wittypay: false, flutterwave: false, paymentpoint: false };
    const res = runFailoverSimulation(defaultPriority, enabled, mockProvidersSuccessAll);
    assert(
      "Test F: All OFF -> Returns 'No payment provider enabled' error",
      res.status === "error" && res.message === "No payment provider enabled" && res.attempts.length === 0,
      `Status: ${res.status}, Message: "${res.message}", Attempts: [${res.attempts.join(", ")}]`
    );
  }

  // Test G: Wittypay successfully creates account -> STOPS failover
  {
    const enabled = { wittypay: true, flutterwave: true, paymentpoint: true };
    const res = runFailoverSimulation(defaultPriority, enabled, mockProvidersSuccessAll);
    assert(
      "Test G: Wittypay Creation Success -> Stops failover (No Flutterwave/PaymentPoint called)",
      res.status === "success" && res.attempts.length === 1 && res.attempts[0] === "wittypay",
      `Attempts: [${res.attempts.join(", ")}]`
    );
  }

  // Test H: Wittypay creation fails -> Tries Flutterwave
  {
    const enabled = { wittypay: true, flutterwave: true, paymentpoint: true };
    const res = runFailoverSimulation(defaultPriority, enabled, mockProvidersWittypayFails);
    assert(
      "Test H: Wittypay Creation Fails -> Tries Flutterwave next",
      res.status === "success" && res.provider === "flutterwave" && res.attempts.join(",") === "wittypay,flutterwave",
      `Provider: ${res.provider}, Attempts: [${res.attempts.join(", ")}]`
    );
  }

  // Test I: Wittypay naming helper formatting (MIDATA + MUKTAR UMAR IBRAHIM)
  {
    const name = buildWittypayTemporaryCustomerName("MIDATA", "MUKTAR UMAR IBRAHIM");
    assert(
      "Test I: Naming Helper Formatting (MIDATA + MUKTAR UMAR IBRAHIM)",
      name === "MID-MUK",
      `Formatted customer_name sent to Wittypay: "${name}"`
    );
  }

  console.log("==================================================");
  console.log(`SUMMARY: Total=${passed + failed} | Passed=${passed} | Failed=${failed}`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
};

runSwitcherTests();
