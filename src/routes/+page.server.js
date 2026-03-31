import { getDb } from '$lib/db.js';

export async function load({ url }) {
	const db = getDb();
	const tag = url.searchParams.get('tag') ?? 'All';
	const today = new Date().toISOString().slice(0, 10);

	// Today's digest
	const digest = db.prepare('SELECT * FROM digest WHERE date = ?').get(today) ?? null;

	// Articles with feed info, filtered by tag if specified
	let query = `
		SELECT
			a.id,
			a.title,
			a.link,
			a.pub_date,
			a.summary,
			a.tags,
			a.score,
			f.name as source,
			f.category,
			(SELECT rating FROM feedback WHERE article_id = a.id ORDER BY id DESC LIMIT 1) as my_rating
		FROM articles a
		JOIN feeds f ON a.feed_id = f.id
		WHERE a.summary IS NOT NULL
	`;

	const params = [];

	if (tag && tag !== 'All') {
		query += ` AND json_each.value = ?`;
		query = `
			SELECT
				a.id,
				a.title,
				a.link,
				a.pub_date,
				a.summary,
				a.tags,
				a.score,
				f.name as source,
				f.category,
				(SELECT rating FROM feedback WHERE article_id = a.id ORDER BY id DESC LIMIT 1) as my_rating
			FROM articles a
			JOIN feeds f ON a.feed_id = f.id,
			json_each(a.tags)
			WHERE a.summary IS NOT NULL
			  AND json_each.value = ?
			GROUP BY a.id
		`;
		params.push(tag);
	}

	query += ' ORDER BY a.score DESC, a.pub_date DESC LIMIT 60';

	const articles = db.prepare(query).all(...params).map((a) => ({
		...a,
		tags: JSON.parse(a.tags ?? '[]')
	}));

	return { articles, digest, activeTag: tag };
}
