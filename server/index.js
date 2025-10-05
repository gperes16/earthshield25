import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Node 18+ possui fetch global
const app = express();
// Resolver diretórios e carregar .env específico da pasta server
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const port = process.env.PORT || 8787;
const nasaApiBase = 'https://api.nasa.gov';
const apiKey = process.env.NASA_API_KEY || '';

const allowedOrigins = new Set([
  'http://127.0.0.1:5500',
  'http://localhost:5500'
]);
const corsOptions = {
  origin: (origin, callback) => {
    // permitir ferramentas sem origin (curl, Postman) e as origens listadas
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('CORS_NOT_ALLOWED'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS']
};
app.use(cors(corsOptions));
// garantir resposta a OPTIONS para todas as rotas (preflight)
app.options('*', cors(corsOptions));
app.use(express.json());

// Servir o frontend estaticamente a partir da raiz do projeto
const rootDir = path.resolve(__dirname, '..');
app.use(express.static(rootDir, { extensions: ['html'] }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, hasKey: Boolean(apiKey) });
});

function ensureKey(res) {
  if (!apiKey) {
    res.status(500).json({ error: { code: 'NO_API_KEY', message: 'Defina NASA_API_KEY no arquivo .env' } });
    return false;
  }
  return true;
}

app.get('/api/neo/feed', async (req, res) => {
  if (!ensureKey(res)) return;
  const { start_date, end_date } = req.query;
  const params = new URLSearchParams({ start_date, end_date, api_key: apiKey });
  const url = `${nasaApiBase}/neo/rest/v1/feed?${params.toString()}`;
  try {
    const r = await fetch(url);
    const text = await r.text();
    res.status(r.status).type('application/json').send(text);
  } catch (e) {
    res.status(502).json({ error: { code: 'UPSTREAM_ERROR', message: String(e?.message || e) } });
  }
});

app.get('/api/neo/neo/:id', async (req, res) => {
  if (!ensureKey(res)) return;
  const { id } = req.params;
  const params = new URLSearchParams({ api_key: apiKey });
  const url = `${nasaApiBase}/neo/rest/v1/neo/${encodeURIComponent(id)}?${params.toString()}`;
  try {
    const r = await fetch(url);
    const text = await r.text();
    res.status(r.status).type('application/json').send(text);
  } catch (e) {
    res.status(502).json({ error: { code: 'UPSTREAM_ERROR', message: String(e?.message || e) } });
  }
});

// browse (paginaçao)
app.get('/api/neo/browse', async (req, res) => {
  if (!ensureKey(res)) return;
  const { page = '0', size = '20' } = req.query;
  const params = new URLSearchParams({ page: String(page), size: String(size), api_key: apiKey });
  const url = `${nasaApiBase}/neo/rest/v1/neo/browse?${params.toString()}`;
  try {
    const r = await fetch(url);
    const text = await r.text();
    res.status(r.status).type('application/json').send(text);
  } catch (e) {
    res.status(502).json({ error: { code: 'UPSTREAM_ERROR', message: String(e?.message || e) } });
  }
});

app.listen(port, () => {
  console.log(`[astroimpact-proxy] rodando em http://localhost:${port}`);
});

