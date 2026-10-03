import express from 'express';

console.log('🚀 Minimal test server starting...');

const app = express();
const PORT = 5000;

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:5000`);
});