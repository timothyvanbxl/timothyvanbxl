import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

const DB_PATH = process.env.DB_PATH ?? 'data/data.db';

// Ensure directory exists
mkdirSync(dirname(DB_PATH), { recursive: true });

/** @type {import('better-sqlite3').Database} */
let _db;

export function getDb() {
	if (!_db) {
		_db = new Database(DB_PATH);
		_db.pragma('journal_mode = WAL');
		_db.pragma('foreign_keys = ON');
		initSchema(_db);
	}
	return _db;
}

function initSchema(db) {
	db.exec(`
		CREATE TABLE IF NOT EXISTS feeds (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			url TEXT UNIQUE NOT NULL,
			category TEXT DEFAULT 'General',
			weight REAL DEFAULT 1.0,
			active INTEGER DEFAULT 1,
			created_at TEXT DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS articles (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			feed_id INTEGER REFERENCES feeds(id) ON DELETE CASCADE,
			title TEXT,
			link TEXT UNIQUE,
			pub_date TEXT,
			raw_content TEXT,
			summary TEXT,
			tags TEXT DEFAULT '[]',
			score REAL DEFAULT 0.0,
			fetched_at TEXT DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS feedback (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
			rating INTEGER NOT NULL,
			created_at TEXT DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS digest (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			date TEXT UNIQUE,
			content TEXT,
			created_at TEXT DEFAULT (datetime('now'))
		);

		CREATE INDEX IF NOT EXISTS idx_articles_feed_id ON articles(feed_id);
		CREATE INDEX IF NOT EXISTS idx_articles_score ON articles(score DESC);
		CREATE INDEX IF NOT EXISTS idx_articles_pub_date ON articles(pub_date DESC);
		CREATE INDEX IF NOT EXISTS idx_feedback_article_id ON feedback(article_id);
	`);

	seedDefaultFeeds(db);
}

function seedDefaultFeeds(db) {
	const count = db.prepare('SELECT COUNT(*) as n FROM feeds').get();
	if (count.n > 0) return;

	const insert = db.prepare(`
		INSERT OR IGNORE INTO feeds (name, url, category)
		VALUES (@name, @url, @category)
	`);

	const feeds = [
		{ name: 'Harvard Business Review', url: 'https://hbr.org/feeds/default', category: 'Business' },
		{ name: 'HBS Working Knowledge', url: 'https://hbswk.hbs.edu/rss/index.xml', category: 'Business' },
		{ name: 'MIT Sloan Management Review', url: 'https://sloanreview.mit.edu/feed/', category: 'Strategy' },
		{ name: 'Anthropic Blog', url: 'https://www.anthropic.com/rss.xml', category: 'AI' },
		{ name: 'Microsoft AI Blog', url: 'https://blogs.microsoft.com/ai/feed/', category: 'AI' },
		{ name: 'McKinsey Insights', url: 'https://www.mckinsey.com/rss/insights.xml', category: 'Strategy' }
	];

	const insertMany = db.transaction((feeds) => {
		for (const feed of feeds) insert.run(feed);
	});

	insertMany(feeds);
}
