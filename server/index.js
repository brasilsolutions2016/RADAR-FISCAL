import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import crypto from 'crypto';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Configurações de Ambiente
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;
const RADAR_PRICE = 9.90;
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:8080';

app.use(express.json());
app.use(cors());

// Carregar Dados Mestres (Questionário e Regras)
const questionnairePath = path.resolve(__dirname, '../shared/questionnaire.json');
const scoringRulesPath = path.resolve(__dirname, '../shared/scoring_rules.json');

let questionnaire = [];
let scoringRules = { thresholds: { LOW: 30, MEDIUM: 70 }, impact_levels: { CRITICAL: 20, MODERATE: 10 } };

try {
  questionnaire = JSON.parse(fs.readFileSync(questionnairePath, 'utf8'));
  scoringRules = JSON.parse(fs.readFileSync(scoringRulesPath, 'utf8'));
  console.log('✅ Dados mestres carregados.');
} catch (err) {
  console.error('⚠️ Erro ao carregar dados mestres, usando defaults.');
}

// Inicialização do Banco de Dados
const db = new sqlite3.Database('./radar.db', (err) => {
  if (err) console.error('❌ Erro no SQLite:', err.message);
  else console.log('✅ SQLite conectado.');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    created_at INTEGER,
    payment_status INTEGER DEFAULT 0,
    email TEXT,
    mp_payment_id TEXT,
    mp_status TEXT,
    paid_at INTEGER,
    qr_code TEXT,
    qr_code_base64 TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS answers (
    session_id TEXT,
    question_id TEXT,
    answer_label TEXT,
    weight INTEGER,
    PRIMARY KEY (session_id, question_id)
  )`);
});

// Motor de Cálculo de Resultado
function calculateResult(sessionAnswers) {
  let scoreRaw = 0;
  let maxScorePath = 0;
  
  const visibleQuestions = questionnaire.filter(q => {
    if (!q.show_if || q.show_if.length === 0) return true;
    const isAll = q.show_if_mode === 'ALL';
    const evaluator = (cond) => sessionAnswers[cond.dependsOn]?.label === cond.value;
    return isAll ? q.show_if.every(evaluator) : q.show_if.some(evaluator);
  });

  visibleQuestions.forEach(q => {
    const answer = sessionAnswers[q.id];
    if (answer) scoreRaw += answer.weight || 0;
    const maxWeight = Math.max(...q.options.map(o => o.weight));
    maxScorePath += maxWeight;
  });

  const scoreFinal = maxScorePath > 0 ? (scoreRaw / maxScorePath) * 100 : 0;
  let classification = 'LOW';
  if (scoreFinal > scoringRules.thresholds.MEDIUM) classification = 'HIGH';
  else if (scoreFinal > scoringRules.thresholds.LOW) classification = 'MEDIUM';
  
  return { scoreFinal: Math.round(scoreFinal), classification };
}

/* ===========================
   ENDPOINTS DA API
=========================== */

app.post('/api/sessions', (req, res) => {
  const sessionId = crypto.randomUUID();
  db.run("INSERT INTO sessions (id, created_at) VALUES (?, ?)", [sessionId, Date.now()], (err) => {
    if (err) return res.status(500).json({ error: 'Erro ao criar sessão.' });
    res.json({ sessionId });
  });
});

app.post('/api/sessions/:id/answer', (req, res) => {
  const { id } = req.params;
  const { questionId, label, weight } = req.body;
  db.run(`INSERT INTO answers (session_id, question_id, answer_label, weight) 
          VALUES (?, ?, ?, ?) 
          ON CONFLICT(session_id, question_id) 
          DO UPDATE SET answer_label=excluded.answer_label, weight=excluded.weight`, 
          [id, questionId, label, weight], (err) => {
    if (err) return res.status(500).json({ error: 'Erro ao salvar resposta.' });
    res.json({ success: true });
  });
});

app.get('/api/sessions/:id/result', (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM sessions WHERE id = ?", [id], (err, session) => {
    if (err || !session) return res.status(404).json({ error: 'Sessão não encontrada.' });
    
    db.all("SELECT * FROM answers WHERE session_id = ?", [id], (err, rows) => {
      const sessionAnswers = {};
      rows.forEach(r => sessionAnswers[r.question_id] = { label: r.answer_label, weight: r.weight });
      
      const calc = calculateResult(sessionAnswers);
      const response = { 
        classification: calc.classification, 
        paymentStatus: session.payment_status === 1 ? 'paid' : 'pending' 
      };

      if (session.payment_status === 1) {
        response.scoreFinal = calc.scoreFinal;
        response.factors = rows
          .filter(r => r.weight >= scoringRules.impact_levels.MODERATE)
          .map(r => ({
            questionId: r.question_id,
            questionText: questionnaire.find(q => q.id === r.question_id)?.text || r.question_id,
            answerLabel: r.answer_label,
            impact: r.weight >= scoringRules.impact_levels.CRITICAL ? 'Crítico' : 'Moderado'
          }));
      }
      res.json(response);
    });
  });
});

app.post('/api/sessions/:id/checkout', async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  // Simulação de checkout ou integração real dependendo das envs
  if (!MP_ACCESS_TOKEN) {
    // Modo Mock para Testes (se não houver chave real)
    const mockData = { 
      qr_code: "00020101021226830014br.gov.bcb.pix...", 
      qr_code_base64: "iVBORw0KGgoAAAANSUhEUgAAA...", 
      status: "pending" 
    };
    db.run("UPDATE sessions SET email = ?, mp_status = 'pending' WHERE id = ?", [email, id]);
    return res.json(mockData);
  }
  // Implementação Mercado Pago... (conforme código Etapa 5 anterior)
});

app.get('/api/sessions/:id/payment-status', (req, res) => {
  db.get("SELECT payment_status, mp_status FROM sessions WHERE id = ?", [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Sessão não encontrada.' });
    res.json({ paid: row.payment_status === 1, status: row.mp_status });
  });
});

// Servir frontend
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(PORT, () => console.log(`🚀 Servidor pronto na porta ${PORT}`));
