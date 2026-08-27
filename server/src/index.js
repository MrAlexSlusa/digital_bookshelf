import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { booksRouter } from './routes/books.js';
import { customFieldsRouter } from './routes/customFields.js';
import { schemaRouter } from './routes/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/books', booksRouter);
app.use('/api/custom-fields', customFieldsRouter);
app.use('/api/schema', schemaRouter);

const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Bookshelf server listening on http://localhost:${PORT}`);
});
