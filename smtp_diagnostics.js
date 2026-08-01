import 'dotenv/config';
import dns from 'dns/promises';
import net from 'net';
import tls from 'tls';

async function runBrevoDiagnostics() {
    console.log("======================================================");
    console.log("       RAILWAY OUTBOUND NETWORK DIAGNOSTICS          ");
    console.log("       Target: smtp-relay.brevo.com                  ");
    console.log("======================================================\n");

    const host = process.env.EMAIL_HOST || 'smtp-relay.brevo.com';
    const port = Number(process.env.EMAIL_PORT) || 587;

    // 1. DNS RESOLUTION
    console.log("--- 1. DNS RESOLUTION ---");
    try {
        const ipv4 = await dns.resolve4(host);
        console.log(`[SUCCESS] IPv4 addresses for ${host}:`, ipv4);
    } catch (e) {
        console.log(`[FAILED] IPv4 lookup failed:`, e.message);
    }

    try {
        const ipv6 = await dns.resolve6(host);
        console.log(`[SUCCESS] IPv6 addresses for ${host}:`, ipv6);
    } catch (e) {
        console.log(`[FAILED] IPv6 lookup failed:`, e.message);
    }

    // 2. RAW TCP CONNECTION
    console.log(`\n--- 2. RAW TCP CONNECTION (${port}) ---`);
    const testTcpConnection = () => {
        return new Promise((resolve) => {
            const start = Date.now();
            let resolved = false;

            console.log(`Attempting raw TCP connection to ${host}:${port}...`);
            const socket = net.createConnection({ host, port });
            socket.setTimeout(10000); 

            // When testing an SMTP server on port 587, we expect a 220 banner greeting.
            socket.on('data', (data) => {
                console.log(`[DATA RECEIVED] Server Greeting: ${data.toString().trim()}`);
            });

            socket.on('connect', () => {
                if (resolved) return;
                console.log(`[SUCCESS] TCP Connected to ${host}:${port} in ${Date.now() - start}ms`);
                console.log(`Waiting up to 5s for SMTP greeting...`);
                // Wait briefly for greeting before resolving
                setTimeout(() => {
                    resolved = true;
                    socket.destroy();
                    resolve(true);
                }, 5000);
            });
            
            socket.on('timeout', () => {
                if (resolved) return;
                resolved = true;
                console.log(`[TIMEOUT] TCP Connection to ${host}:${port} timed out after 10000ms`);
                socket.destroy();
                resolve(false);
            });
            
            socket.on('error', (err) => {
                if (resolved) return;
                resolved = true;
                console.log(`[FAILED] TCP Connection to ${host}:${port} failed.`);
                console.log(`Error Details:
  code: ${err.code}
  errno: ${err.errno}
  syscall: ${err.syscall}
  address: ${err.address}
  port: ${err.port}
  stack trace: \n${err.stack}`);
                resolve(false);
            });
        });
    };

    const tcpSuccess = await testTcpConnection();

    // 3. TLS HANDSHAKE
    console.log(`\n--- 3. TLS HANDSHAKE ---`);
    if (!tcpSuccess) {
        console.log(`[SKIPPED] Cannot test TLS because raw TCP connection failed.`);
        console.log(`\nCONCLUSION: The Railway container is physically unable to reach ${host}:${port}.`);
        console.log(`This is an INFRASTRUCTURE/NETWORK BLOCK, not an application code bug.`);
    } else {
        console.log(`[INFO] Port 587 uses STARTTLS (TCP first, then upgrade).`);
        console.log(`If TCP succeeds and greeting is received, the network is open.`);
        console.log(`We will also try a direct TLS connection on port 465 just to see if outbound TLS is blocked.`);
        
        const testTlsConnection = (targetPort) => {
            return new Promise((resolve) => {
                const start = Date.now();
                let resolved = false;

                console.log(`Attempting direct TLS connection to ${host}:${targetPort}...`);
                const socket = tls.connect(targetPort, host, { timeout: 10000 }, () => {
                    if (resolved) return;
                    resolved = true;
                    const cert = socket.getPeerCertificate();
                    console.log(`[SUCCESS] TLS Handshake complete to ${host}:${targetPort} in ${Date.now() - start}ms.`);
                    console.log(`Certificate Subject: ${cert?.subject?.CN}`);
                    socket.destroy();
                    resolve(true);
                });
                
                socket.on('timeout', () => {
                    if (resolved) return;
                    resolved = true;
                    console.log(`[TIMEOUT] TLS Connection to ${host}:${targetPort} timed out after 10000ms`);
                    socket.destroy();
                    resolve(false);
                });
                
                socket.on('error', (err) => {
                    if (resolved) return;
                    resolved = true;
                    console.log(`[FAILED] TLS Connection to ${host}:${targetPort} failed.`);
                    console.log(`Error Details: ${err.message}`);
                    resolve(false);
                });
            });
        };

        await testTlsConnection(465);
    }
    
    console.log("\n======================================================");
    console.log("              DIAGNOSTICS COMPLETE                    ");
    console.log("======================================================");
    process.exit(0);
}

runBrevoDiagnostics();
