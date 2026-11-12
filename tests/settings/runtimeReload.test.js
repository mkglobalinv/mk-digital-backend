// Every integration managed from System Settings must use a changed
// credential on its very next request, without re-importing the module or
// restarting the app. Requests are intercepted with nock (no real calls).
import net from 'net';
import nock from 'nock';

// "Old" values, as if loaded from .env at startup.
Object.assign(process.env, {
    PEYFLEX_API_URL: 'https://old-peyflex.example', PEYFLEX_API_TOKEN: 'old-peyflex-token',
    SMEPLUG_API_BASE_URL: 'https://old-smeplug.example/api/v1', SMEPLUG_API_KEY: 'old-smeplug', SMEPLUG_ENABLED: 'true',
    OGDAMS_API_BASE_URL: 'https://old-ogdams.example/api/v1', OGDAMS_API_KEY: 'old-ogdams', OGDAMS_ENABLED: 'true',
    FLW_SECRET_KEY: 'old-flw', PAYSTACK_SECRET_KEY: 'old-paystack',
    MONNIFY_BASE_URL: 'https://old-monnify.example', MONNIFY_API_KEY: 'old-mk', MONNIFY_SECRET_KEY: 'old-ms',
    PAYMENTPOINT_SECRET_KEY: 'old-pp-secret', PAYMENTPOINT_API_KEY: 'old-pp-api', PAYMENTPOINT_BUSINESS_ID: 'old-biz',
    WITTYPAY_BASE_URL: 'https://old-wittypay.example/v1', WITTYPAY_SECRET_KEY: 'old-witty',
    SUPABASE_URL: 'https://old.supabase.co', SUPABASE_SERVICE_KEY: 'old-supabase-key'
});

const { notifyConfigChange } = await import('../../services/settings/runtimeConfig.js');
const peyflexV2 = await import('../../services/providers/peyflexV2.js');
const peyflex = await import('../../services/providers/peyflex.js');
const smeplug = await import('../../services/providers/smeplug.js');
const ogdams = await import('../../services/providers/ogdams.js');
const flutterwave = await import('../../services/flutterwaveService.js');
const { default: paystack } = await import('../../services/paystackService.js');
const monnify = await import('../../services/monnifyService.js');
const paymentpoint = await import('../../services/paymentpointService.js');
const wittypay = await import('../../services/wittypayService.js');
const { getSupabaseClient } = await import('../../services/supabaseClient.js');
const { verifyEmailTransport } = await import('../../services/emailService.js');

// What saveSettings() does after writing to MongoDB.
const change = (values) => {
    Object.assign(process.env, values);
    notifyConfigChange(Object.keys(values));
};

beforeAll(() => nock.disableNetConnect());
afterEach(() => nock.cleanAll());
afterAll(() => nock.enableNetConnect());

test('Peyflex (axios client defaults and per-call headers)', async () => {
    change({ PEYFLEX_API_URL: 'https://new-peyflex.example', PEYFLEX_API_TOKEN: 'new-peyflex-token' });
    const v2 = nock('https://new-peyflex.example', { reqheaders: { authorization: 'Token new-peyflex-token' } })
        .get('/api/user/profile/').reply(200, { balance: 50 });
    expect(await peyflexV2.getPeyflexBalance()).toMatchObject({ success: true, balance: 50 });
    const v1 = nock('https://new-peyflex.example', { reqheaders: { authorization: 'Token new-peyflex-token' } })
        .get('/api/user/profile/').reply(200, { wallet_credit: '10' });
    expect(await peyflex.fetchPeyflexUserProfile()).toMatchObject({ success: true });
    expect(v2.isDone() && v1.isDone()).toBe(true);
});

test('SMEPlug and Ogdams (base URL + key)', async () => {
    change({ SMEPLUG_API_BASE_URL: 'https://new-smeplug.example/api/v1', SMEPLUG_API_KEY: 'new-smeplug' });
    nock('https://new-smeplug.example', { reqheaders: { authorization: 'Bearer new-smeplug' } })
        .get('/api/v1/account/balance').reply(200, { balance: 7 });
    expect(await smeplug.getSmeplugBalance()).toMatchObject({ success: true, balance: 7 });

    change({ OGDAMS_API_BASE_URL: 'https://new-ogdams.example/api/v1', OGDAMS_API_KEY: 'new-ogdams' });
    nock('https://new-ogdams.example', { reqheaders: { authorization: 'Bearer new-ogdams' } })
        .get('/api/v1/get/balances').reply(200, { status: true, code: 200, data: { msg: { wallet: 1 } } });
    expect(await ogdams.getOgdamsBalances()).toMatchObject({ success: true });
});

test('disabling SMEPlug/Ogdams takes effect without a restart', async () => {
    change({ SMEPLUG_ENABLED: 'false', OGDAMS_ENABLED: 'false' });
    expect(await smeplug.getSmeplugBalance()).toMatchObject({ success: false });
    expect(await ogdams.getOgdamsBalances()).toMatchObject({ success: false });
    change({ SMEPLUG_ENABLED: 'true', OGDAMS_ENABLED: 'true' });
});

test('Flutterwave and Paystack secret keys', async () => {
    change({ FLW_SECRET_KEY: 'new-flw' });
    const f = nock('https://api.flutterwave.com', { reqheaders: { authorization: 'Bearer new-flw' } })
        .get(/\/v3\/transactions\/123\/verify/).reply(200, { status: 'success', data: { status: 'successful' } });
    await flutterwave.verifyFlutterwaveTransaction(123);
    expect(f.isDone()).toBe(true);

    change({ PAYSTACK_SECRET_KEY: 'new-paystack' });
    const p = nock('https://api.paystack.co', { reqheaders: { authorization: 'Bearer new-paystack' } })
        .get('/transaction/verify/ref1').reply(200, { status: true, data: {} });
    await paystack.verifyTransaction('ref1');
    expect(p.isDone()).toBe(true);
});

test('Monnify base URL and keys', async () => {
    change({ MONNIFY_BASE_URL: 'https://new-monnify.example', MONNIFY_API_KEY: 'nk', MONNIFY_SECRET_KEY: 'ns' });
    nock('https://new-monnify.example', { reqheaders: { authorization: `Basic ${Buffer.from('nk:ns').toString('base64')}` } })
        .post('/api/v1/auth/login').reply(200, { responseBody: { accessToken: 'tok' } });
    expect(await monnify.getMonnifyToken()).toBe('tok');
});

test('PaymentPoint and WittyPay keys', async () => {
    change({ PAYMENTPOINT_SECRET_KEY: 'new-pp-secret', PAYMENTPOINT_API_KEY: 'new-pp-api', PAYMENTPOINT_BUSINESS_ID: 'new-biz' });
    let body;
    const pp = nock('https://api.paymentpoint.co', { reqheaders: { authorization: 'Bearer new-pp-secret', 'api-key': 'new-pp-api' } })
        .post('/api/v1/createVirtualAccount', (b) => { body = b; return true; }).reply(200, { status: 'success', bankAccounts: [] });
    await paymentpoint.createVirtualAccount({ email: 'a@b.co', name: 'A B', phoneNumber: '08000000000' });
    expect(pp.isDone()).toBe(true);
    expect(body.businessId).toBe('new-biz');

    change({ WITTYPAY_BASE_URL: 'https://new-wittypay.example/v1', WITTYPAY_SECRET_KEY: 'new-witty' });
    const w = nock('https://new-wittypay.example', { reqheaders: { authorization: 'Bearer new-witty' } })
        .post('/v1/virtual-accounts').reply(200, { status: true, data: {} });
    await wittypay.createVirtualAccount({ email: 'a@b.co', firstname: 'A', lastname: 'B', bvn: '22222222222' });
    expect(w.isDone()).toBe(true);
});

test('Supabase client is rebuilt when its credentials change', () => {
    const before = getSupabaseClient();
    expect(getSupabaseClient()).toBe(before);
    change({ SUPABASE_SERVICE_KEY: 'new-supabase-key' });
    const after = getSupabaseClient();
    expect(after).not.toBe(before);
    expect(after.supabaseUrl || after.rest?.url || '').toContain('old.supabase.co');
    change({ SUPABASE_URL: 'https://new.supabase.co' });
    const third = getSupabaseClient();
    expect(third.supabaseUrl || third.rest?.url).toContain('new.supabase.co');
});

test('Email transport is rebuilt and connects to the new SMTP host/port', async () => {
    const connections = [];
    const server = net.createServer((sock) => { connections.push(sock.localPort); sock.destroy(); });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const { port } = server.address();
    try {
        change({ EMAIL_HOST: '127.0.0.1', EMAIL_PORT: String(port), EMAIL_USER: 'u@example.com', EMAIL_PASS: 'p' });
        await expect(verifyEmailTransport()).rejects.toThrow();
        expect(connections).toContain(port);
    } finally {
        server.close();
    }
});
