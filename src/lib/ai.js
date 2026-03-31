import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-6';

/**
 * Generate a 3-5 sentence executive summary of an article.
 * @param {string} title
 * @param {string} content
 * @returns {Promise<string>}
 */
export async function summarise(title, content) {
	const truncated = content?.slice(0, 4000) ?? '';
	const message = await client.messages.create({
		model: MODEL,
		max_tokens: 300,
		messages: [
			{
				role: 'user',
				content: `You are a chief of staff preparing executive briefings. Summarise this article in 3-5 sentences. Be concise, direct, and business-focused. Highlight the key insight and why it matters.

Title: ${title}
Content: ${truncated}

Summary:`
			}
		]
	});
	return message.content[0].text.trim();
}

/**
 * Auto-tag an article with 1-3 tags from the fixed taxonomy.
 * @param {string} title
 * @param {string} summary
 * @returns {Promise<string[]>}
 */
export async function tagArticle(title, summary) {
	const taxonomy = ['AI', 'Strategy', 'Leadership', 'Product', 'Finance', 'Innovation', 'Operations', 'Technology', 'Marketing', 'People'];
	const message = await client.messages.create({
		model: MODEL,
		max_tokens: 60,
		messages: [
			{
				role: 'user',
				content: `Classify this article with 1-3 tags from this exact list: ${taxonomy.join(', ')}.
Respond with ONLY a JSON array, e.g. ["AI","Strategy"]. No other text.

Title: ${title}
Summary: ${summary}`
			}
		]
	});

	try {
		const tags = JSON.parse(message.content[0].text.trim());
		return Array.isArray(tags) ? tags.filter((t) => taxonomy.includes(t)).slice(0, 3) : [];
	} catch {
		return [];
	}
}

/**
 * Build a morning briefing digest from top articles.
 * @param {Array<{title: string, summary: string, source: string}>} articles
 * @returns {Promise<string>}
 */
export async function buildDigest(articles) {
	const articleList = articles
		.slice(0, 15)
		.map((a, i) => `${i + 1}. [${a.source}] ${a.title}: ${a.summary}`)
		.join('\n');

	const message = await client.messages.create({
		model: MODEL,
		max_tokens: 600,
		messages: [
			{
				role: 'user',
				content: `You are a chief of staff. Based on today's top articles, write a morning briefing with exactly 5 bullet points. Each bullet should be one crisp sentence capturing a key insight or development. Focus on what a senior executive needs to know today. Use direct, assertive language — no fluff.

Format: Return ONLY the 5 bullet points as a markdown list (- bullet text). No intro, no outro.

Today's articles:
${articleList}`
			}
		]
	});
	return message.content[0].text.trim();
}

/**
 * Suggest new RSS feeds based on reading history and feedback.
 * @param {Array<{name: string, url: string, category: string, weight: number}>} currentFeeds
 * @param {Array<{title: string, tags: string[], rating: number}>} feedbackHistory
 * @returns {Promise<Array<{name: string, url: string, category: string, reason: string}>>}
 */
export async function suggestFeeds(currentFeeds, feedbackHistory) {
	const likedTopics = feedbackHistory
		.filter((f) => f.rating > 0)
		.flatMap((f) => f.tags)
		.slice(0, 30);

	const currentUrls = currentFeeds.map((f) => f.url).join('\n');

	const message = await client.messages.create({
		model: MODEL,
		max_tokens: 800,
		messages: [
			{
				role: 'user',
				content: `You are a content strategist. Based on a user's reading preferences, suggest 5 RSS feeds they are not already subscribed to.

User's liked topics (from upvoted articles): ${likedTopics.join(', ') || 'AI, Strategy, Leadership'}

Currently subscribed feeds:
${currentUrls}

Return ONLY a JSON array of 5 objects with this exact structure:
[{"name": "Feed Name", "url": "https://feed-url.com/rss", "category": "Category", "reason": "One sentence why this fits their interests"}]

Only suggest feeds with real, working RSS URLs. Focus on high-quality business, tech, and AI sources.`
			}
		]
	});

	try {
		const text = message.content[0].text.trim();
		const jsonMatch = text.match(/\[[\s\S]*\]/);
		if (!jsonMatch) return [];
		return JSON.parse(jsonMatch[0]);
	} catch {
		return [];
	}
}
