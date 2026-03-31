import { getDb } from '$lib/db.js';
import { fail, redirect } from '@sveltejs/kit';

export async function load() {
	const db = getDb();
	const feeds = db.prepare(`
		SELECT f.*, COUNT(a.id) as article_count
		FROM feeds f
		LEFT JOIN articles a ON a.feed_id = f.id
		GROUP BY f.id
		ORDER BY f.created_at DESC
	`).all();

	return { feeds };
}

export const actions = {
	add: async ({ request }) => {
		const data = await request.formData();
		const url = data.get('url')?.toString().trim();
		const name = data.get('name')?.toString().trim();
		const category = data.get('category')?.toString().trim() || 'General';

		if (!url || !name) {
			return fail(400, { error: 'Name and URL are required.' });
		}

		try {
			new URL(url);
		} catch {
			return fail(400, { error: 'Invalid URL.' });
		}

		const db = getDb();
		try {
			db.prepare('INSERT INTO feeds (name, url, category) VALUES (?, ?, ?)').run(name, url, category);
		} catch (err) {
			if (err.message.includes('UNIQUE')) {
				return fail(409, { error: 'This feed is already subscribed.' });
			}
			return fail(500, { error: 'Failed to add feed.' });
		}

		redirect(303, '/feeds');
	},

	toggle: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const db = getDb();
		db.prepare('UPDATE feeds SET active = NOT active WHERE id = ?').run(id);
		redirect(303, '/feeds');
	},

	remove: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const db = getDb();
		db.prepare('DELETE FROM feeds WHERE id = ?').run(id);
		redirect(303, '/feeds');
	}
};
