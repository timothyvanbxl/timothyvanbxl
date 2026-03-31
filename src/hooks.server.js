import { startScheduler } from '$lib/scheduler.js';

// Start the cron scheduler once on server boot
startScheduler();
