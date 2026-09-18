import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import forms from './routes/forms.js';
import submissions from './routes/submissions.js';
import dashboard from './routes/dashboard.js';
import analytics from './routes/analytics.js';
import audit from './routes/audit.js';
import files from './routes/files.js';

import { errorHandler } from './middleware/error.js';

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: (
      process.env.CLIENT_URL ??
      'http://localhost:5173'
    ).split(','),
  })
);

app.use(
  express.json({
    limit: '10mb',
  })
);

app.use(morgan('dev'));

app.get(
  '/api/health',
  (_req, res) =>
    res.json({
      ok: true,
      service: 'apoyos-digitales-api',
    })
);

app.use('/api/forms', forms);

app.use(
  '/api/submissions',
  submissions
);

app.use(
  '/api/dashboard',
  dashboard
);

app.use(
  '/api/analytics',
  analytics
);

app.use(
  '/api/audit',
  audit
);

app.use(
  '/api/files',
  files
);

app.use(errorHandler);

const port = Number(
  process.env.PORT ?? 4000
);

app.listen(
  port,
  '0.0.0.0',
  () => {
    console.log(
      `API en puerto ${port}`
    );
  }
);