// Integration test of deploy/vps/9jasub-domainctl against a REAL nginx that
// already serves another application on ports 80 and 443, mirroring the
// production VPS. certbot is replaced by a stub that writes self-signed
// certificates (Let's Encrypt cannot reach a test machine); everything else
// -- config generation, nginx -t, graceful reloads, rollback, conflict
// detection, proxy headers, HTTPS -- is the real thing.
//
// Needs: root, nginx, openssl, curl, flock, free ports 80/443. Skips otherwise.
import { execFileSync, spawn, spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const HELPER = path.resolve(here, '../../deploy/vps/9jasub-domainctl');
const UPSTREAM_PORT = 18800;

const has = (cmd) => spawnSync('sh', ['-c', `command -v ${cmd}`]).status === 0;
const portFree = (p) => spawnSync('sh', ['-c', `! (ss -ltn 2>/dev/null || netstat -ltn) | grep -q ':${p} '`]).status === 0;
const runnable = process.getuid?.() === 0 && ['nginx', 'openssl', 'curl', 'flock'].every(has) && portFree(80) && portFree(443) && portFree(UPSTREAM_PORT);
const describeNginx = runnable ? describe : describe.skip;

let T; // temp root
let env;
let upstream;

const write = (p, s, mode) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); if (mode) fs.chmodSync(p, mode); };

function selfSigned(dir, cn) {
    fs.mkdirSync(dir, { recursive: true });
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '90', '-subj', `/CN=${cn}`,
        '-keyout', path.join(dir, 'privkey.pem'), '-out', path.join(dir, 'fullchain.pem')], { stdio: 'ignore' });
}

function helper(...args) {
    const r = spawnSync('bash', [HELPER, ...args], { env, encoding: 'utf8', timeout: 60000 });
    const line = (r.stdout || '').trim().split('\n').pop() || '{}';
    let json = {};
    try { json = JSON.parse(line); } catch { json = { raw: r.stdout, stderr: r.stderr }; }
    return { code: r.status, ...json };
}

// curl through the local nginx while presenting `host`, like a real visitor.
function curl(host, { https = false, headers = [], follow = false } = {}) {
    const port = https ? 443 : 80;
    const args = ['-s', '--noproxy', '*', '-o', '-', '-w', '\n%{http_code}', '--resolve', `${host}:${port}:127.0.0.1`, '--max-time', '5'];
    if (https) args.push('-k');
    if (follow) args.push('-L');
    for (const h of headers) args.push('-H', h);
    args.push(`${https ? 'https' : 'http'}://${host}/`);
    const r = spawnSync('curl', args, { encoding: 'utf8' });
    const out = r.stdout || '';
    const i = out.lastIndexOf('\n');
    return { status: Number(out.slice(i + 1)), body: out.slice(0, i) };
}
const curlPath = (host, p, https = false) => {
    const port = https ? 443 : 80;
    const r = spawnSync('curl', ['-s', '--noproxy', '*', '-k', '-w', '\n%{http_code}', '--resolve', `${host}:${port}:127.0.0.1`, `${https ? 'https' : 'http'}://${host}${p}`], { encoding: 'utf8' });
    const out = r.stdout || ''; const i = out.lastIndexOf('\n');
    return { status: Number(out.slice(i + 1)), body: out.slice(0, i) };
};
const servedCertCN = (host) => {
    const r = spawnSync('sh', ['-c', `echo | openssl s_client -connect 127.0.0.1:443 -servername ${host} 2>/dev/null | openssl x509 -noout -subject`], { encoding: 'utf8' });
    return (r.stdout || '').trim();
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const settle = () => sleep(400); // nginx reload swaps workers asynchronously

const existingStillWorks = () => {
    expect(curl('existing-app.org').body).toBe('EXISTING-HTTP');
    expect(curl('existing-app.org', { https: true }).body).toBe('EXISTING-HTTPS');
    expect(servedCertCN('existing-app.org')).toContain('existing-app.org');
};

describeNginx('9jasub-domainctl with a real nginx', () => {
    beforeAll(async () => {
        T = fs.mkdtempSync(path.join(os.tmpdir(), 'domainctl-'));
        fs.chmodSync(T, 0o755); // nginx workers (unprivileged) must traverse to the webroot
        for (const d of ['tmp', 'logs', 'acme', 'live', 'sites']) fs.mkdirSync(path.join(T, d), { recursive: true });
        selfSigned(path.join(T, 'existing'), 'existing-app.org');

        // An unrelated application already on this server (HTTP + HTTPS + default server).
        write(path.join(T, 'nginx.conf'), `
pid ${T}/nginx.pid;
error_log ${T}/logs/error.log;
events {}
http {
    access_log off;
    client_body_temp_path ${T}/tmp/body; proxy_temp_path ${T}/tmp/proxy;
    fastcgi_temp_path ${T}/tmp/fcgi; uwsgi_temp_path ${T}/tmp/uwsgi; scgi_temp_path ${T}/tmp/scgi;
    server { listen 80 default_server; server_name _; return 404 "DEFAULT"; }
    server { listen 80; server_name existing-app.org; location / { return 200 "EXISTING-HTTP"; } }
    server {
        listen 443 ssl default_server; server_name existing-app.org;
        ssl_certificate ${T}/existing/fullchain.pem; ssl_certificate_key ${T}/existing/privkey.pem;
        location / { return 200 "EXISTING-HTTPS"; }
    }
    include ${T}/sites/*.conf;
}
`);
        const nginxBin = path.join(T, 'nginx-wrap');
        write(nginxBin, `#!/bin/sh\nexec nginx -p ${T}/ -c ${T}/nginx.conf "$@"\n`, 0o755);

        // certbot stub: "fail" domains fail validation, "ratelimit" domains hit
        // the rate limit, "badcert" domains get a corrupt certificate.
        const certbot = path.join(T, 'certbot-stub');
        write(certbot, `#!/bin/bash
cmd="$1"; shift; name=""
while [[ $# -gt 0 ]]; do case "$1" in --cert-name) name="$2"; shift 2;; *) shift;; esac; done
case "$cmd" in
  certonly)
    [[ "$name" == fail* ]] && { echo "Detail: Connection refused during HTTP-01 validation" >&2; exit 1; }
    [[ "$name" == ratelimit* ]] && { echo "Error: too many certificates already issued (rateLimited)" >&2; exit 1; }
    mkdir -p "${T}/live/$name"
    if [[ "$name" == badcert* ]]; then echo garbage > "${T}/live/$name/fullchain.pem"; echo garbage > "${T}/live/$name/privkey.pem"; exit 0; fi
    openssl req -x509 -newkey rsa:2048 -nodes -days 90 -subj "/CN=$name" -keyout "${T}/live/$name/privkey.pem" -out "${T}/live/$name/fullchain.pem" >/dev/null 2>&1 ;;
  renew) exit 0 ;;
  delete) rm -rf "${T}/live/$name" ;;
esac
`, 0o755);

        write(path.join(T, 'domainctl.conf'), `
NGINX_DOMAINS_DIR=${T}/sites
ACME_WEBROOT=${T}/acme
UPSTREAM=127.0.0.1:${UPSTREAM_PORT}
CERT_LIVE_DIR=${T}/live
CERTBOT_BIN=${certbot}
CERTBOT_EMAIL=ops@example.com
NGINX_BIN=${nginxBin}
RELOAD_CMD="${nginxBin} -s reload"
LOCK_FILE=${T}/domainctl.lock
LISTEN_IPV6=0
`);
        env = { ...process.env, DOMAINCTL_CONF: path.join(T, 'domainctl.conf') };

        // The 9jaSub app stand-in: echoes the headers it uses to pick a tenant.
        // Runs in its own process because the curl calls below are synchronous.
        upstream = spawn(process.execPath, ['-e', `require('http').createServer((req, res) => res.end(
            'app host=' + req.headers.host + ' xfh=' + req.headers['x-forwarded-host'] + ' proto=' + req.headers['x-forwarded-proto']
        )).listen(${UPSTREAM_PORT}, '127.0.0.1', () => console.log('ready'))`], { stdio: ['ignore', 'pipe', 'inherit'] });
        await new Promise((r) => upstream.stdout.once('data', r));

        execFileSync(nginxBin, [], { stdio: 'inherit' });
        await settle();
    }, 60000);

    afterAll(async () => {
        if (T) {
            // Stop this test's nginx and wait for it to exit before deleting its prefix.
            const pidFile = path.join(T, 'nginx.pid');
            const pid = fs.existsSync(pidFile) ? Number(fs.readFileSync(pidFile, 'utf8')) : null;
            spawnSync(path.join(T, 'nginx-wrap'), ['-s', 'stop']);
            for (let i = 0; pid && i < 50; i++) {
                try { process.kill(pid, 0); } catch { break; }
                await sleep(100);
            }
        }
        upstream?.kill();
        if (T && !process.env.KEEP_DOMAINCTL_TMP) fs.rmSync(T, { recursive: true, force: true });
    });

    test('baseline: the existing site is served', () => {
        existingStillWorks();
    });

    test('check reports readiness', () => {
        expect(helper('check')).toMatchObject({ ok: true });
    });

    test('rejects unsafe domain arguments before touching nginx', () => {
        for (const bad of ['a.com;id', '../../etc/passwd', 'WWW.a.com', 'www.shop.com', '-x.com', 'a', '$(id).com']) {
            expect(helper('prepare', bad)).toMatchObject({ ok: false, code: 2 });
        }
        expect(helper('rm-rf', 'a.com').code).toBe(2);
        expect(fs.readdirSync(path.join(T, 'sites')).filter((f) => f.endsWith('.conf'))).toEqual([]);
    });

    test('refuses a hostname another site on the server already serves', async () => {
        const r = helper('prepare', 'existing-app.org', '--www');
        expect(r).toMatchObject({ ok: false, code: 3 });
        expect(r.message).toMatch(/already served by another site/);
        expect(fs.existsSync(path.join(T, 'sites', 'existing-app.org.conf'))).toBe(false);
        existingStillWorks();
    });

    test('prepare serves the verification probe over HTTP for apex and www', async () => {
        expect(helper('prepare', 'shop-a.com', '--www')).toMatchObject({ ok: true });
        await settle();
        expect(curlPath('shop-a.com', '/.well-known/9jasub-probe')).toEqual({ status: 200, body: 'shop-a.com' });
        expect(curlPath('www.shop-a.com', '/.well-known/9jasub-probe')).toEqual({ status: 200, body: 'shop-a.com' });
        fs.mkdirSync(path.join(T, 'acme/.well-known/acme-challenge'), { recursive: true });
        fs.writeFileSync(path.join(T, 'acme/.well-known/acme-challenge/tok123'), 'tok123.key');
        expect(curlPath('shop-a.com', '/.well-known/acme-challenge/tok123').body).toBe('tok123.key');
        expect(curl('shop-a.com').status).toBe(503);
        existingStillWorks();
    });

    test('issue enables HTTPS, redirects HTTP and proxies with trusted host headers', async () => {
        const r = helper('issue', 'shop-a.com', '--www');
        expect(r).toMatchObject({ ok: true });
        expect(r.notAfter).toBeTruthy();
        await settle();

        const page = curl('shop-a.com', { https: true, headers: ['X-Forwarded-Host: victim-reseller.com'] });
        expect(page.status).toBe(200);
        // The client-supplied X-Forwarded-Host is overwritten by nginx.
        expect(page.body).toBe('app host=shop-a.com xfh=shop-a.com proto=https');
        expect(curl('www.shop-a.com', { https: true }).body).toBe('app host=www.shop-a.com xfh=www.shop-a.com proto=https');
        expect(servedCertCN('shop-a.com')).toContain('shop-a.com');
        // Default config must not change protocol options for other sites on :443.
        const t = spawnSync(path.join(T, 'nginx-wrap'), ['-t'], { encoding: 'utf8' });
        expect(t.status).toBe(0);
        expect(t.stderr).not.toMatch(/protocol options redefined/);
        expect(curlPath('shop-a.com', '/.well-known/9jasub-probe', true)).toEqual({ status: 200, body: 'shop-a.com' });

        const redirect = curl('shop-a.com');
        expect(redirect.status).toBe(301);
        expect(spawnSync('curl', ['-s', '--noproxy', '*', '-o', '/dev/null', '-w', '%{redirect_url}', '--resolve', 'shop-a.com:80:127.0.0.1', 'http://shop-a.com/buy?x=1'], { encoding: 'utf8' }).stdout).toBe('https://shop-a.com/buy?x=1');
        existingStillWorks();
    });

    test('a second reseller domain coexists; each gets its own certificate', async () => {
        expect(helper('prepare', 'shop-b.com', '--www')).toMatchObject({ ok: true });
        expect(helper('issue', 'shop-b.com', '--www')).toMatchObject({ ok: true });
        await settle();
        expect(curl('shop-b.com', { https: true }).body).toBe('app host=shop-b.com xfh=shop-b.com proto=https');
        expect(curl('shop-a.com', { https: true }).body).toBe('app host=shop-a.com xfh=shop-a.com proto=https');
        expect(servedCertCN('shop-b.com')).toContain('shop-b.com');
        expect(servedCertCN('shop-a.com')).toContain('shop-a.com');
        existingStillWorks();
    });

    test('a domain without www only answers on the apex', async () => {
        expect(helper('issue', 'shop.reseller-c.com')).toMatchObject({ ok: true });
        await settle();
        expect(curl('shop.reseller-c.com', { https: true }).status).toBe(200);
        expect(curl('www.shop.reseller-c.com').body).toBe('DEFAULT');
    });

    test('a failed Let\'s Encrypt validation leaves every running site untouched', async () => {
        expect(helper('prepare', 'fail-shop.com', '--www')).toMatchObject({ ok: true });
        const r = helper('issue', 'fail-shop.com', '--www');
        expect(r).toMatchObject({ ok: false, code: 7 });
        expect(r.message).toMatch(/Connection refused/);
        await settle();
        expect(fs.readFileSync(path.join(T, 'sites/fail-shop.com.conf'), 'utf8')).toContain('(stage: http)');
        expect(curl('shop-a.com', { https: true }).status).toBe(200);
        existingStillWorks();
    });

    test('rate-limit errors are reported so the app can back off', () => {
        const r = helper('issue', 'ratelimit-shop.com');
        expect(r.ok).toBe(false);
        expect(r.message).toMatch(/too many certificates/);
    });

    test('nginx -t failure rolls back to the previous config and keeps serving', async () => {
        expect(helper('prepare', 'badcert-shop.com')).toMatchObject({ ok: true });
        const before = fs.readFileSync(path.join(T, 'sites/badcert-shop.com.conf'), 'utf8');
        const r = helper('issue', 'badcert-shop.com');
        expect(r).toMatchObject({ ok: false, code: 4 });
        expect(r.message).toMatch(/previous config restored/);
        expect(fs.readFileSync(path.join(T, 'sites/badcert-shop.com.conf'), 'utf8')).toBe(before);
        expect(spawnSync(path.join(T, 'nginx-wrap'), ['-t']).status).toBe(0);
        await settle();
        expect(curl('shop-a.com', { https: true }).status).toBe(200);
        existingStillWorks();
    });

    test('concurrent operations are serialized and all succeed', async () => {
        const domains = ['para-1.com', 'para-2.com', 'para-3.com', 'para-4.com'];
        const results = await Promise.all(domains.map((d) => new Promise((resolve) => {
            const child = spawn('bash', [HELPER, 'issue', d, '--www'], { env });
            let out = '';
            child.stdout.on('data', (c) => { out += c; });
            child.on('close', (code) => resolve({ code, ...JSON.parse(out.trim().split('\n').pop() || '{}') }));
        })));
        expect(results.map((r) => r.ok)).toEqual([true, true, true, true]);
        expect(spawnSync(path.join(T, 'nginx-wrap'), ['-t']).status).toBe(0);
        await settle();
        for (const d of domains) expect(curl(d, { https: true }).body).toBe(`app host=${d} xfh=${d} proto=https`);
        existingStillWorks();
    });

    test('cert-info reads the expiry; renew runs', () => {
        expect(helper('cert-info', 'shop-a.com')).toMatchObject({ ok: true });
        expect(helper('cert-info', 'nocert.com')).toMatchObject({ ok: false });
        expect(helper('renew', 'shop-a.com')).toMatchObject({ ok: true });
    });

    test('remove takes one domain offline without affecting the others', async () => {
        expect(helper('remove', 'shop-a.com')).toMatchObject({ ok: true });
        await settle();
        expect(fs.existsSync(path.join(T, 'sites/shop-a.com.conf'))).toBe(false);
        expect(curl('shop-a.com').body).toBe('DEFAULT');
        expect(curl('shop-b.com', { https: true }).status).toBe(200);
        existingStillWorks();
        expect(helper('remove', 'shop-a.com')).toMatchObject({ ok: true }); // idempotent
    });

    test('the Node wrapper drives the helper without a shell', async () => {
        process.env.DOMAIN_HELPER_PATH = HELPER;
        process.env.DOMAIN_HELPER_USE_SUDO = 'false';
        process.env.DOMAINCTL_CONF = env.DOMAINCTL_CONF;
        try {
            const { runDomainHelper } = await import('../../services/domains/vpsProvisioner.js');
            const res = await runDomainHelper('prepare', 'node-shop.com', { includeWww: true });
            expect(res.message).toBe('HTTP site prepared for verification.');
            expect(res).toMatchObject({ ok: true, domain: 'node-shop.com' });
            await expect(runDomainHelper('prepare', 'node-shop.com; touch /tmp/pwned')).rejects.toThrow();
            await expect(runDomainHelper('format-disk', 'node-shop.com')).rejects.toThrow();
            expect(fs.existsSync('/tmp/pwned')).toBe(false);
        } finally {
            delete process.env.DOMAIN_HELPER_PATH;
            delete process.env.DOMAIN_HELPER_USE_SUDO;
            delete process.env.DOMAINCTL_CONF;
        }
    });
});
