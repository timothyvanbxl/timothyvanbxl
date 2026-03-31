import { getDb } from '$lib/db.js';
import { suggestFeeds } from '$lib/ai.js';
import { fail, redirect } from '@sveltejs/kit';

export async function load() {
	const db = getDb();

	const currentFeeds = db.prepare('SELECT name, url, category, weight FROM feeds').all();

	const feedbackHistory = db.prepare(`
		SELECT a.title, a.tags, fb.rating
		FROM feedback fb
		JOIN articles a ON a.id = fb.article_id
		ORDER BY fb.created_at DESC
		LIMIT 50
	`).all().map((f) => ({
		...f,
		tags: JSON.parse(f.tags ?? '[]')
	}));

	const suggestions = await suggestFeeds(currentFeeds, feedbackHistory);

	return { suggestions, currentFeeds };
}

export const actions = {
	subscribe: async ({ request }) => {
		const data = await request.formData();
		const url = data.get('url')?.toString();
		const name = data.get('name')?.toString();
		const category = data.get('category')?.toString() || 'General';

		if (!url || !name) return fail(400, { error: 'Missing data.' });

		const db = getDb();
		try {
			db.prepare('INSERT OR IGNORE INTO feeds (name, url, category) VALUES (?, ?, ?)').run(name, url, category);
		} catch {
			return fail(500, { error: 'Failed to subscribe.' });
		}

		redirect(303, '/feeds');
	}
};
