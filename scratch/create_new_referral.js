
async function createReferral() {
    const ts = Date.now();
    const payload = {
        name: `Final Fix User ${ts}`,
        email: `final_fix_${ts}@test.com`,
        phone: `080${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: "Password123!",
        referralCode: "C119A8A0"
    };

    console.log("Creating new user:", payload.email);

    const res = await fetch('http://127.0.0.1:8800/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const text = await res.text();
    console.log("Registration Response:", text);
}

createReferral();
