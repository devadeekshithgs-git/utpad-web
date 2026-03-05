"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var uuid_1 = require("uuid");
var app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// In-Memory Data Stores
var opsEvents = [];
var clients = [];
// --- OPS ENDPOINTS ---
app.post('/api/v1/ops/events', function (req, res) {
    var _a;
    var event = {
        id: (0, uuid_1.v4)(),
        module: (_a = req.body.module) === null || _a === void 0 ? void 0 : _a.toLowerCase(),
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
    if (opsEvents.length > 500)
        opsEvents.pop();
    // Broadcast to all SSE clients
    clients.forEach(function (client) {
        client.write("event: ops-event\n");
        client.write("data: ".concat(JSON.stringify(event), "\n\n"));
    });
    res.status(201).json(event);
});
app.get('/api/v1/ops/events', function (req, res) {
    var limit = Math.min(parseInt(req.query['limit']) || 200, 500);
    res.json({ events: opsEvents.slice(0, limit) });
});
app.get('/api/v1/ops/events/stream', function (req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    clients.push(res);
    req.on('close', function () {
        var index = clients.indexOf(res);
        if (index !== -1)
            clients.splice(index, 1);
    });
});
// --- AUTH MOCK ENDPOINTS ---
var MOCK_USER = {
    userId: "admin-1",
    tenantId: "tenant-1",
    name: "Admin User",
    role: "Platform_Admin",
    factoryIds: ["factory-1"],
    phone: "9999999999"
};
var MOCK_TOKENS = {
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    expiresIn: 3600
};
app.post('/api/v1/auth/login/phone', function (req, res) {
    // Accept any phone/pin for testing purposes
    res.json(__assign(__assign({}, MOCK_TOKENS), { user: MOCK_USER }));
});
app.post('/api/v1/auth/refresh', function (req, res) {
    res.json(__assign({}, MOCK_TOKENS));
});
app.post('/api/v1/auth/logout', function (req, res) {
    res.status(200).send();
});
app.get('/api/v1/auth/me', function (req, res) {
    res.json(MOCK_USER);
});
app.get('/api/v1/auth/permissions', function (req, res) {
    res.json([
        { module: 'dashboard', action: 'read', resourceScope: 'tenant' },
        { module: 'inwarding', action: 'create', resourceScope: 'factory' },
        { module: 'production', action: 'create', resourceScope: 'factory' },
        { module: 'packing', action: 'create', resourceScope: 'factory' },
        { module: 'dispatch', action: 'create', resourceScope: 'factory' }
    ]);
});
app.post('/api/v1/auth/sync/events', function (req, res) {
    var _a;
    res.json({ syncedCount: ((_a = req.body.events) === null || _a === void 0 ? void 0 : _a.length) || 0, conflicts: [] });
});
module.exports = app;
