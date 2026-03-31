<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { data } = $props();

	const TAGS = ['All', 'AI', 'Strategy', 'Leadership', 'Product', 'Finance', 'Innovation', 'Technology', 'Operations'];

	const TAG_COLORS = {
		AI: 'bg-violet-900/60 text-violet-300 border-violet-700/50',
		Strategy: 'bg-blue-900/60 text-blue-300 border-blue-700/50',
		Leadership: 'bg-amber-900/60 text-amber-300 border-amber-700/50',
		Product: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
		Finance: 'bg-green-900/60 text-green-300 border-green-700/50',
		Innovation: 'bg-pink-900/60 text-pink-300 border-pink-700/50',
		Technology: 'bg-cyan-900/60 text-cyan-300 border-cyan-700/50',
		Operations: 'bg-orange-900/60 text-orange-300 border-orange-700/50',
		General: 'bg-gray-800 text-gray-400 border-gray-700'
	};

	/** @type {Record<number, number>} */
	let ratings = $state({});

	// Pre-populate from server data
	$effect(() => {
		for (const a of data.articles) {
			if (a.my_rating != null) ratings[a.id] = a.my_rating;
		}
	});

	async function vote(articleId, rating) {
		const current = ratings[articleId];
		const newRating = current === rating ? 0 : rating;
		ratings[articleId] = newRating;

		if (newRating === 0) return; // undo — no API call needed for now

		await fetch('/api/feedback', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ articleId, rating: newRating })
		});
	}

	function setTag(tag) {
		const url = new URL($page.url);
		if (tag === 'All') {
			url.searchParams.delete('tag');
		} else {
			url.searchParams.set('tag', tag);
		}
		goto(url.toString(), { replaceState: true });
	}

	function formatDate(dateStr) {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		const now = new Date();
		const diffH = Math.floor((now - d) / 3600000);
		if (diffH < 1) return 'Just now';
		if (diffH < 24) return `${diffH}h ago`;
		return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	}
</script>

<!-- Morning Briefing Card -->
{#if data.digest}
	<div class="mb-8 rounded-2xl bg-gradient-to-br from-brand-600/20 via-brand-500/10 to-transparent border border-brand-500/30 p-6">
		<div class="flex items-center gap-2 mb-4">
			<span class="text-xs font-semibold uppercase tracking-widest text-brand-400">Morning Briefing</span>
			<span class="text-xs text-gray-500">·</span>
			<span class="text-xs text-gray-500">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
		</div>
		<div class="prose prose-sm prose-invert max-w-none">
			{#each data.digest.content.split('\n').filter(l => l.trim()) as line}
				<p class="text-gray-200 leading-relaxed mb-2 flex gap-2">
					<span class="text-brand-400 mt-1 shrink-0">▸</span>
					<span>{line.replace(/^[-•▸]\s*/, '')}</span>
				</p>
			{/each}
		</div>
	</div>
{:else}
	<div class="mb-8 rounded-2xl border border-gray-800 p-6 text-center">
		<p class="text-gray-500 text-sm">No briefing yet today. Feeds refresh at 06:00.</p>
		<button
			onclick={() => fetch('/api/refresh', { method: 'POST' }).then(() => location.reload())}
			class="mt-3 btn-ghost text-xs"
		>
			Refresh now
		</button>
	</div>
{/if}

<!-- Tag filter strip -->
<div class="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
	{#each TAGS as tag}
		<button
			onclick={() => setTag(tag)}
			class="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
				{data.activeTag === tag
					? 'bg-brand-500 border-brand-500 text-white'
					: 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'}"
		>
			{tag}
		</button>
	{/each}
</div>

<!-- Article card grid -->
{#if data.articles.length === 0}
	<div class="text-center py-20 text-gray-500">
		<p class="text-lg mb-2">No articles yet</p>
		<p class="text-sm">Feeds will be fetched at 06:00, or you can trigger a refresh manually.</p>
	</div>
{:else}
	<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
		{#each data.articles as article (article.id)}
			<article class="card flex flex-col gap-3 group">
				<!-- Header -->
				<div class="flex items-start justify-between gap-2">
					<div class="flex items-center gap-2 min-w-0">
						<span class="text-xs text-gray-500 truncate">{article.source}</span>
						<span class="text-gray-700">·</span>
						<span class="text-xs text-gray-500">{formatDate(article.pub_date)}</span>
					</div>
				</div>

				<!-- Tags -->
				{#if article.tags?.length}
					<div class="flex flex-wrap gap-1.5">
						{#each article.tags as tag}
							<span class="tag border {TAG_COLORS[tag] ?? TAG_COLORS.General}">{tag}</span>
						{/each}
					</div>
				{/if}

				<!-- Title -->
				<h2 class="font-semibold text-gray-100 leading-snug text-[15px] group-hover:text-white transition-colors">
					{article.title}
				</h2>

				<!-- Summary -->
				{#if article.summary}
					<p class="text-sm text-gray-400 leading-relaxed flex-1">{article.summary}</p>
				{/if}

				<!-- Footer -->
				<div class="flex items-center justify-between pt-1">
					<a
						href={article.link}
						target="_blank"
						rel="noopener noreferrer"
						class="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors"
					>
						Read original →
					</a>

					<!-- Thumbs feedback -->
					<div class="flex items-center gap-1">
						<button
							onclick={() => vote(article.id, 1)}
							class="p-1.5 rounded-lg transition-colors
								{ratings[article.id] === 1
									? 'text-emerald-400 bg-emerald-900/40'
									: 'text-gray-600 hover:text-emerald-400 hover:bg-emerald-900/20'}"
							title="Good read"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
								<path d="M7.493 18.5c-.425 0-.82-.236-.975-.632A7.48 7.48 0 0 1 6 15.125c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75A.75.75 0 0 1 15 2a2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23h-.777ZM2.331 10.727a11.969 11.969 0 0 0-.831 4.398 12 12 0 0 0 .52 3.507C2.28 19.482 3.105 20 3.994 20H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 0 1-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227Z" />
							</svg>
						</button>
						<button
							onclick={() => vote(article.id, -1)}
							class="p-1.5 rounded-lg transition-colors
								{ratings[article.id] === -1
									? 'text-red-400 bg-red-900/40'
									: 'text-gray-600 hover:text-red-400 hover:bg-red-900/20'}"
							title="Not relevant"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
								<path d="M15.73 5.5h1.035A7.465 7.465 0 0 1 18 9.625a7.465 7.465 0 0 1-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 0 1-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.499 4.499 0 0 0-.322 1.672v.633A.75.75 0 0 1 9 22a2.25 2.25 0 0 1-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H3.622c-1.026 0-1.945-.694-2.054-1.715A12.137 12.137 0 0 1 1.5 12.25c0-2.848.992-5.464 2.649-7.521.388-.482.987-.729 1.605-.729H9.77a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23ZM21.669 14.023c.536-1.362.831-2.845.831-4.398 0-1.22-.182-2.398-.52-3.507-.26-.85-1.084-1.368-1.973-1.368H19.1c-.445 0-.72.498-.523.898.591 1.2.924 2.55.924 3.977a8.958 8.958 0 0 1-1.302 4.666c-.245.403.028.959.5.959h1.053c.832 0 1.612-.453 1.918-1.227Z" />
							</svg>
						</button>
					</div>
				</div>
			</article>
		{/each}
	</div>
{/if}
