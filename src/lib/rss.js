import Parser from 'rss-parser';
import { getDb } from './db.js';
import { summarise, tagArticle } from './ai.js';

const parser = new Parser({
	timeout: 10000,
	headers: { 'User-Agent': 'AI-RSS-Reader/1.0' }
});

/**
 * Fetch all active feeds, store new articles, and generate AI summaries + tags.
 */
export async function fetchAllFeeds() {
	const db = getDb();
	const feeds = db.prepare('SELECT * FROM feeds WHERE active = 1').all();

	console.log(`[RSS] Fetching ${feeds.length} feeds...`);

	for (const feed of feeds) {
		try {
			await fetchFeed(feed);
		} catch (err) {
			console.error(`[RSS] Failed to fetch ${feed.url}:`, err.message);
		}
	}

	console.log('[RSS] Done fetching all feeds.');
}

/**
 * Fetch a single feed and upsert new articles.
 * @param {{id: number, url: string, name: string}} feed
 */
async function fetchFeed(feed) {
	const db = getDb();
	let parsed;

	try {
		parsed = await parser.parseURL(feed.url);
	} catch (err) {
		console.error(`[RSS] Parse error for ${feed.url}:`, err.message);
		return;
	}

	const insertArticle = db.prepare(`
		INSERT OR IGNORE INTO articles (feed_id, title, link, pub_date, raw_content)
		VALUES (@feed_id, @title, @link, @pub_date, @raw_content)
	`);

	const newLinks = [];

	for (const item of parsed.items.slice(0, 20)) {
		const link = item.link || item.guid;
		if (!link) continue;

		const result = insertArticle.run({
			feed_id: feed.id,
			title: item.title ?? 'Untitled',
			link,
			pub_date: item.pubDate ?? item.isoDate ?? new Date().toISOString(),
			raw_content: item.contentSnippet ?? item.content ?? item.summary ?? ''
		});

		if (result.changes > 0) {
			newLinks.push(link);
		}
	}

	console.log(`[RSS] ${feed.name}: ${newLinks.length} new articles`);

	// Process new articles sequentially to respect rate limits
	for (const link of newLinks) {
		await processArticle(link);
	}
}

/**
 * Generate AI summary + tags for a single article.
 * @param {string} link
 */
async function processArticle(link) {
	const db = getDb();
	const article = db.prepare('SELECT * FROM articles WHERE link = ?').get(link);
	if (!article || article.summary) return;

	try {
		const summary = await summarise(article.title, article.raw_content);
		const tags = await tagArticle(article.title, summary);

		// Compute initial score based on recency
		const ageHours = (Date.now() - new Date(article.pub_date).getTime()) / 3600000;
		const recencyScore = Math.max(0.1, 1 - ageHours / 168); // decay over 7 days

		db.prepare(`
			UPDATE articles
			SET summary = @summary, tags = @tags, score = @score
			WHERE id = @id
		`).run({
			summary,
			tags: JSON.stringify(tags),
			score: recencyScore,
			id: article.id
		});

		console.log(`[AI] Processed: ${article.title.slice(0, 60)}...`);
	} catch (err) {
		console.error(`[AI] Failed to process article ${article.id}:`, err.message);
	}
}
