import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

// In-Memory Data Stores
let opsEvents: any[] = [];
const clients: Response[] = [];

// --- OPS ENDPOINTS ---

app.post('/api/v1/ops/events', (req: Request, res: Response) => {
    const event = {
        id: uuidv4(),
        module: req.body.module?.toLowerCase(),
        workerId: req.body.workerId,
        workerName: req.body.workerName,
        workerRole: req.body.workerRole,
        createdAt: new Date().toISOString(),
        batchCode: req.body.batchCode,
        quantity: req.body.quantity,
        unit: req.body.unit,
        summary: req.body.summary,
        payload: req.body.payload || {}
    };

    opsEvents.unshift(event);
    if (opsEvents.length > 500) opsEvents.pop();

    // Broadcast to all SSE clients
    clients.forEach(client => {
        client.write(`event: ops-event\n`);
        client.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    res.status(201).json(event);
});

app.get('/api/v1/ops/events', (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query['limit'] as string) || 200, 500);
    res.json({ events: opsEvents.slice(0, limit) });
});

app.get('/api/v1/ops/events/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    clients.push(res);

    req.on('close', () => {
        const index = clients.indexOf(res);
        if (index !== -1) clients.splice(index, 1);
    });
});

// --- AUTH MOCK ENDPOINTS ---

const MOCK_USER = {
    userId: "admin-1",
    tenantId: "tenant-1",
    name: "Admin User",
    role: "Platform_Admin",
    factoryIds: ["factory-1"],
    phone: "9999999999"
};

const MOCK_TOKENS = {
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    expiresIn: 3600
};

app.post('/api/v1/auth/login/phone', (req: Request, res: Response) => {
    // Accept any phone/pin for testing purposes
    res.json({ ...MOCK_TOKENS, user: MOCK_USER });
});

app.post('/api/v1/auth/refresh', (req: Request, res: Response) => {
    res.json({ ...MOCK_TOKENS });
});

app.post('/api/v1/auth/logout', (req: Request, res: Response) => {
    res.status(200).send();
});

app.get('/api/v1/auth/me', (req: Request, res: Response) => {
    res.json(MOCK_USER);
});

app.get('/api/v1/auth/permissions', (req: Request, res: Response) => {
    res.json([
        { module: 'dashboard', action: 'read', resourceScope: 'tenant' },
        { module: 'inwarding', action: 'create', resourceScope: 'factory' },
        { module: 'production', action: 'create', resourceScope: 'factory' },
        { module: 'packing', action: 'create', resourceScope: 'factory' },
        { module: 'dispatch', action: 'create', resourceScope: 'factory' }
    ]);
});

app.post('/api/v1/auth/sync/events', (req: Request, res: Response) => {
    res.json({ syncedCount: req.body.events?.length || 0, conflicts: [] });
});

export default app;
