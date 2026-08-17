import 'dotenv/config';
import express from 'express';
import idgate360Routes from './routes.js';

/**
 * Standalone test server for the IDGate360 module.
 *
 * This is intentionally its own Express app on its own port — it does NOT
 * import or touch server.js, routes/, controllers/, services/, or models/
 * from the main VTU backend. Run it independently to test IDGate360
 * integration before any production integration decision is made.
 *
 *   node modules/idgate360/server.js
 */

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
    res.json({ status: 'ok', module: 'idgate360', apiKeyConfigured: Boolean(process.env.IDGATE360_API_KEY) });
});

app.use('/api/idgate360', idgate360Routes);

app.use((req, res) => {
    res.status(404).json({ status: false, message: 'Not found in idgate360 test module' });
});

const PORT = process.env.IDGATE360_PORT || 4360;
app.listen(PORT, () => {
    console.log(`[IDGate360 module] standalone test server listening on port ${PORT}`);
    console.log(`[IDGate360 module] try: curl http://localhost:${PORT}/health`);
});
