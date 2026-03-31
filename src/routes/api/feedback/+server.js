import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/db.js';

export async function POST({ request }) {
	const body = await request.json();
	const { articleId, rating } = body;

	if (!articleId || ![-1, 1].includes(rating)) {
		error(400, 'Invalid feedback payload');
	}

	const db = getDb();

	const article = db.prepare('SELECT id, feed_id FROM articles WHERE id = ?').get(articleId);
	if (!article) error(404, 'Article not found');

	// Record feedback
	db.prepare('INSERT INTO feedback (article_id, rating) VALUES (?, ?)').run(articleId, rating);

	// Update article score
	db.prepare('UPDATE articles SET score = score + ? WHERE id = ?').run(rating * 0.5, articleId);

	// Update feed weight (clamped 0.1 – 3.0)
	db.prepare(`
		UPDATE feeds
		SET weight = MAX(0.1, MIN(3.0, weight + ?))
		WHERE id = ?
	`).run(rating * 0.05, article.feed_id);

	return json({ ok: true });
}
