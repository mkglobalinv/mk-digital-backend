import bcrypt from 'bcrypt';

const hash = "$2b$10$SuCcmd16y0aFHgYRRFfEOOn10QFmInNQ4tGUb70YX.G5fj13WhA1.";
const pin = "3131";

async function check() {
    const match = await bcrypt.compare(pin, hash);
    console.log(`PIN ${pin} matches hash: ${match}`);
}

check();
