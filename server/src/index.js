import cors from 'cors';
import express from 'express';
import session from 'express-session';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authRouter } from './routes/auth.js';
import { booksRouter } from './routes/books.js';
import { customFieldsRouter } from './routes/customFields.js';
import { schemaRouter } from './routes/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(
  session({
    name: 'bookshelf.sid',
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  })
);

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not signed in' });
  next();
}

app.use('/api/auth', authRouter);
app.use('/api/books', requireAuth, booksRouter);
app.use('/api/custom-fields', requireAuth, customFieldsRouter);
app.use('/api/schema', requireAuth, schemaRouter);

const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

app.listen(PORT, () => {
  console.log(`Bookshelf server listening on http://localhost:${PORT}`);
});
