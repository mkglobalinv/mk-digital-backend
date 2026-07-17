async function run() {
  console.log("=== FETCH TESTS ===");
  try {
    const res = await fetch('http://localhost:8800/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'unuktar1@gmail.com', password: 'Admin@123' })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Body:", text);
  } catch (err) {
    console.log("Error:", err);
  }
}
run();
