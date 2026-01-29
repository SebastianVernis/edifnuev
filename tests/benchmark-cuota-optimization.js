import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Cuota from '../src/models/Cuota.js';
import { readData, writeData } from '../src/data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data.json');
const backupPath = path.join(__dirname, '../data.json.bak');

async function runBenchmark() {
  console.log('🚀 Starting Benchmark for Cuota.actualizarVencidas()...');

  let backupExists = false;

  try {
    // 1. Backup existing data
    if (fs.existsSync(dataPath)) {
      console.log('📦 Backing up data.json...');
      fs.copyFileSync(dataPath, backupPath);
      backupExists = true;
    } else {
        // Ensure directory exists if data.json doesn't exist (unlikely but safe)
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        // Create an empty valid structure if no file exists, just in case readData fails otherwise?
        // readData handles missing file by creating defaults, but we want to control content.
    }

    // 2. Generate 1000 expired cuotas
    console.log('Generating 1000 expired cuotas...');
    const testData = {
      usuarios: [],
      cuotas: [],
      gastos: [],
      presupuestos: [],
      cierres: [],
      anuncios: [],
      fondos: {},
      proyectos: []
    };

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30); // 30 days ago
    const pastDateStr = pastDate.toISOString().split('T')[0];

    for (let i = 1; i <= 1000; i++) {
      testData.cuotas.push({
        id: i,
        mes: 'Enero',
        anio: 2023,
        monto: 100,
        fechaVencimiento: pastDateStr,
        departamento: '101',
        estado: 'PENDIENTE',
        fechaPago: null,
        comprobantePago: null,
        fechaCreacion: new Date().toISOString()
      });
    }

    // Write test data
    fs.writeFileSync(dataPath, JSON.stringify(testData, null, 2), 'utf8');

    // 3. Measure execution time
    console.log('⏱️  Running actualizarVencidas()...');
    const start = process.hrtime.bigint();

    const actualizadas = Cuota.actualizarVencidas();

    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1000000;

    console.log(`✅ Updated ${actualizadas} cuotas.`);
    console.log(`📊 Duration: ${durationMs.toFixed(2)} ms`);

    return durationMs;

  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    throw error;
  } finally {
    // 4. Restore backup
    if (backupExists) {
      console.log('Restoring data.json backup...');
      try {
        fs.copyFileSync(backupPath, dataPath);
        fs.unlinkSync(backupPath);
      } catch (err) {
        console.error('Failed to restore backup:', err);
      }
    } else {
        // If we created the file and no backup existed, maybe we should delete it?
        // But safer to leave it or restore to empty?
        // Assuming environment had data or handled missing data.
        // If no backup existed, we probably shouldn't leave our garbage data.
        if (fs.existsSync(dataPath)) {
             fs.unlinkSync(dataPath);
        }
    }
  }
}

runBenchmark().catch(() => process.exit(1));
