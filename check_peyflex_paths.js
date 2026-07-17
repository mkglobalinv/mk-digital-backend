import axios from 'axios';

async function checkPeyflexPaths() {
    const url = "https://client.peyflex.com.ng/api/topup/";
    try {
        const res = await axios.get(url); // Trigger 404
    } catch (e) {
        if (e.response && typeof e.response.data === 'string') {
            const html = e.response.data;
            const regex = /<li>\s*([^<]+)\s*<\/li>/g;
            let match;
            console.log("Valid paths found in 404 page:");
            while ((match = regex.exec(html)) !== null) {
                console.log("- " + match[1].trim());
            }
        } else {
            console.log("No HTML response or other error:", e.message);
        }
    }
}
checkPeyflexPaths();
