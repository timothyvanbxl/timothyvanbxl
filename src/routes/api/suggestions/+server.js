import { json } from '@sveltejs/kit';
import { getDb } from '$lib/db.js';
import { suggestFeeds } from '$lib/ai.js';

export async function GET() {
	const db = getDb();

	const currentFeeds = db.prepare('SELECT name, url, category, weight FROM feeds').all();
	const feedbackHistory = db.prepare(`
		SELECT a.title, a.tags, fb.rating
		FROM feedback fb
		JOIN articles a ON a.id = fb.article_id
		ORDER BY fb.created_at DESC
		LIMIT 50
	`).all().map((f) => ({ ...f, tags: JSON.parse(f.tags ?? '[]') }));

	const suggestions = await suggestFeeds(currentFeeds, feedbackHistory);

	return json({ suggestions });
}
