const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  ...(redisUrl.startsWith('rediss://') ? { tls: {} } : {}),
});

const applicationQueue = new Queue('applications', { connection });

module.exports = { applicationQueue, connection };
