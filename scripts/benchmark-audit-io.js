import fs from 'fs';
import path from 'path';
import { getAuditLogs } from '../src/utils/auditLog.js';

const AUDIT_DIR = path.join(process.cwd(), 'logs', 'audit');
const TODAY = new Date().toISOString().split('T')[0];
const AUDIT_FILE = path.join(AUDIT_DIR, `audit-${TODAY}.log`);
const TEST_ENTRIES = 50000;

async function setup() {
    // Backup existing log if any
    let backupContent = null;
    if (fs.existsSync(AUDIT_FILE)) {
        backupContent = fs.readFileSync(AUDIT_FILE, 'utf8');
    }

    // Generate test data
    console.log(`Generating ${TEST_ENTRIES} log entries...`);
    const entries = [];
    for (let i = 0; i < TEST_ENTRIES; i++) {
        entries.push(JSON.stringify({
            id: `audit_${Date.now()}_${i}`,
            timestamp: new Date().toISOString(),
            action: 'TEST_ACTION',
            resource: 'TEST_RESOURCE',
            targetId: i,
            changes: { test: 'data' },
            actor: { id: 1, email: 'admin@test.com', rol: 'ADMIN' },
            metadata: { ip: '127.0.0.1', userAgent: 'Benchmark', sessionId: 'test' }
        }));
    }
    fs.writeFileSync(AUDIT_FILE, entries.join('\n'));

    return backupContent;
}

async function runBenchmark() {
    const backupContent = await setup();

    console.log('Running benchmark...');

    // Warmup (optional, but good practice in V8, though maybe overkill here)
    // await getAuditLogs(TODAY, 10);

    const start = process.hrtime();

    // We call getAuditLogs. Since we plan to change it to async, let's await it.
    // Awaiting a sync function is safe (it resolves immediately).
    const logs = await getAuditLogs(TODAY, TEST_ENTRIES);

    const diff = process.hrtime(start);
    const timeMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(3);

    console.log(`Read ${logs.length} logs in ${timeMs} ms`);

    // Validate
    if (logs.length !== TEST_ENTRIES) {
        console.error(`ERROR: Expected ${TEST_ENTRIES} logs, got ${logs.length}`);
    }

    // Cleanup
    if (backupContent) {
        fs.writeFileSync(AUDIT_FILE, backupContent);
    } else {
        if (fs.existsSync(AUDIT_FILE)) {
             fs.unlinkSync(AUDIT_FILE);
        }
    }
}

runBenchmark().catch(err => {
    console.error(err);
    // Try cleanup on error
    try {
        const AUDIT_FILE = path.join(process.cwd(), 'logs', 'audit', `audit-${new Date().toISOString().split('T')[0]}.log`);
        if (fs.existsSync(AUDIT_FILE)) {
             fs.unlinkSync(AUDIT_FILE);
        }
    } catch (e) {}
});
