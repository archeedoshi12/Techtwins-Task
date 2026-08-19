require('dotenv').config();
const { Worker } = require('bullmq');
const { pool, initDB } = require('./db');
const { connection } = require('./queue');

const SKILL_KEYWORDS = [
  'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c++',
  'react', 'nextjs', 'node', 'express', 'nestjs', 'graphql', 'rest',
  'postgresql', 'mysql', 'mongodb', 'redis', 'docker', 'kubernetes',
  'aws', 'gcp', 'azure', 'terraform', 'ci/cd', 'git',
  'machine learning', 'deep learning', 'nlp', 'data science',
];

function extractSkills(resumeText) {
  const lower = resumeText.toLowerCase();
  return SKILL_KEYWORDS.filter((skill) => lower.includes(skill));
}

async function startWorker() {
  await initDB();

  const worker = new Worker(
    'applications',
    async (job) => {
      const { applicationId } = job.data;

      // Check if already processed (guard against duplicate job execution)
      const { rows } = await pool.query(
        'SELECT status FROM applications WHERE id = $1',
        [applicationId]
      );
      if (!rows.length || rows[0].status === 'processed') return;

      // Simulate AI processing delay
      await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));

      const { rows: appRows } = await pool.query(
        'SELECT resume_text FROM applications WHERE id = $1',
        [applicationId]
      );
      if (!appRows.length) return;

      const skills = extractSkills(appRows[0].resume_text);

      await pool.query(
        "UPDATE applications SET status = 'processed', skills = $1 WHERE id = $2",
        [skills, applicationId]
      );

      console.log(`[worker] Processed application ${applicationId}, skills: ${skills.join(', ')}`);
    },
    { connection, concurrency: 5 }
  );

  worker.on('failed', (job, err) => {
    console.error(`[worker] Job ${job?.id} failed:`, err.message);
  });

  console.log('[worker] Started and waiting for jobs...');
}

startWorker().catch(console.error);
