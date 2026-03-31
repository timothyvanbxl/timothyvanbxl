import { json } from '@sveltejs/kit';
import { getDb } from '$lib/db.js';
import { buildDigest } from '$lib/ai.js';

export async function GET() {
	const db = getDb();
	const today = new Date().toISOString().slice(0, 10);

	let digest = db.prepare('SELECT * FROM digest WHERE date = ?').get(today);

	if (!digest) {
		const articles = db.prepare(`
			SELECT a.title, a.summary, f.name as source
			FROM articles a
			JOIN feeds f ON a.feed_id = f.id
			WHERE a.summary IS NOT NULL
			ORDER BY a.score DESC
			LIMIT 15
		`).all();

		if (articles.length > 0) {
			const content = await buildDigest(articles);
			db.prepare('INSERT OR REPLACE INTO digest (date, content) VALUES (?, ?)').run(today, content);
			digest = { date: today, content };
		}
	}

	return json({ digest: digest ?? null });
}
