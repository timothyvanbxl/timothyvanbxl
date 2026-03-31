import cron from 'node-cron';
import { fetchAllFeeds } from './rss.js';
import { buildDigest } from './ai.js';
import { getDb } from './db.js';

let started = false;

/**
 * Start the morning refresh cron job (runs at 06:00 daily).
 * Call this once from your server startup hook.
 */
export function startScheduler() {
	if (started) return;
	started = true;

	// Run at 06:00 every day
	cron.schedule('0 6 * * *', runMorningRefresh, { timezone: 'Europe/Brussels' });

	console.log('[Scheduler] Morning refresh cron registered (06:00 daily).');
}

export async function runMorningRefresh() {
	console.log('[Scheduler] Starting morning refresh...');
	try {
		await fetchAllFeeds();
		await generateTodaysDigest();
		console.log('[Scheduler] Morning refresh complete.');
	} catch (err) {
		console.error('[Scheduler] Morning refresh failed:', err);
	}
}

async function generateTodaysDigest() {
	const db = getDb();
	const today = new Date().toISOString().slice(0, 10);

	// Skip if already generated today
	const existing = db.prepare('SELECT id FROM digest WHERE date = ?').get(today);
	if (existing) return;

	// Get top 15 articles from the last 24 hours with summaries
	const articles = db.prepare(`
		SELECT a.title, a.summary, f.name as source
		FROM articles a
		JOIN feeds f ON a.feed_id = f.id
		WHERE a.summary IS NOT NULL
		  AND a.fetched_at > datetime('now', '-24 hours')
		ORDER BY a.score DESC
		LIMIT 15
	`).all();

	if (articles.length === 0) return;

	const content = await buildDigest(articles);

	db.prepare('INSERT OR REPLACE INTO digest (date, content) VALUES (?, ?)').run(today, content);
	console.log('[Scheduler] Digest generated for', today);
}
