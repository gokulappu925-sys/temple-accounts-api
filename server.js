require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./db');

const app = express();
app.use(express.json({ limit: '20mb' })); // large enough for a full backup/restore upload

const allowedOrigins = (process.env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  }
}));

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/backup', require('./routes/backup'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api', require('./routes/generic'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server. Please try again.' });
});

async function ensureSchemaAndAdmin() {
  const sql = fs.readFileSync(path.join(__dirname, 'migrations', 'schema.sql'), 'utf8');
  await pool.query(sql);

  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM users');
  if (rows[0].n === 0) {
    const username = process.env.INITIAL_ADMIN_USERNAME || 'admin';
    const password = process.env.INITIAL_ADMIN_PASSWORD || 'change-me-immediately';
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, password_hash, role, full_name) VALUES ($1,$2,$3,$4)',
      [username, hash, 'admin', 'Administrator']);
    console.log(`Created initial admin account "${username}". Log in and change the password immediately.`);
  }
}

const PORT = process.env.PORT || 4000;
ensureSchemaAndAdmin()
  .then(() => { app.listen(PORT, () => console.log(`Temple Accounts API listening on port ${PORT}`)); })
  .catch(err => { console.error('Startup failed:', err); process.exit(1); });
