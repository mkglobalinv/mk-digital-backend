import axios from "axios";

async function probe() {
    const urls = [
        "https://www.nellobytesystems.com/APIDataPlanV1.asp",
        "https://www.nellobytesystems.com/APIDataPlan.asp",
        "https://www.nellobytesystems.com/APIDataPlans.asp",
        "http://www.nellobytesystems.com/APIDataPlanV1.asp",
        "http://www.nellobytesystems.com/APIDataPlan.asp"
    ];

    for (const url of urls) {
        try {
            console.log(`Probing ${url}...`);
            const res = await axios.get(url, { params: { MobileNetwork: '01' } });
            console.log(`   Success: ${res.status}`);
            return;
        } catch (e) {
            console.log(`   Failed: ${e.response?.status || e.message}`);
        }
    }
}

probe();
