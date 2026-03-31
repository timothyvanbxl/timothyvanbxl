<script>
	let { data } = $props();

	const TAG_COLORS = {
		AI: 'bg-violet-900/60 text-violet-300 border-violet-700/50',
		Strategy: 'bg-blue-900/60 text-blue-300 border-blue-700/50',
		Business: 'bg-amber-900/60 text-amber-300 border-amber-700/50',
		Technology: 'bg-cyan-900/60 text-cyan-300 border-cyan-700/50',
		Leadership: 'bg-amber-900/60 text-amber-300 border-amber-700/50',
		General: 'bg-gray-800 text-gray-400 border-gray-700'
	};

	const subscribedUrls = new Set(data.currentFeeds.map((f) => f.url));
</script>

<div class="max-w-3xl mx-auto">
	<div class="mb-6">
		<h1 class="text-xl font-semibold text-gray-100">Feed Suggestions</h1>
		<p class="text-sm text-gray-500 mt-1">
			Claude analysed your reading history and thumbs feedback to recommend feeds you'll likely enjoy.
		</p>
	</div>

	{#if data.suggestions.length === 0}
		<div class="card text-center py-12">
			<p class="text-gray-400">Not enough reading history yet.</p>
			<p class="text-sm text-gray-500 mt-1">Give a few articles a thumbs up or down to train the suggestions.</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each data.suggestions as suggestion}
				{@const alreadySubscribed = subscribedUrls.has(suggestion.url)}
				<div class="card flex items-start gap-4">
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-1">
							<span class="font-semibold text-gray-100">{suggestion.name}</span>
							{#if suggestion.category}
								<span class="tag border {TAG_COLORS[suggestion.category] ?? TAG_COLORS.General}">
									{suggestion.category}
								</span>
							{/if}
						</div>
						<p class="text-sm text-gray-400 mb-2">{suggestion.reason}</p>
						<span class="text-xs text-gray-600 truncate block">{suggestion.url}</span>
					</div>

					<div class="shrink-0">
						{#if alreadySubscribed}
							<span class="text-xs text-gray-500 italic">Already subscribed</span>
						{:else}
							<form method="POST" action="?/subscribe">
								<input type="hidden" name="url" value={suggestion.url} />
								<input type="hidden" name="name" value={suggestion.name} />
								<input type="hidden" name="category" value={suggestion.category ?? 'General'} />
								<button type="submit" class="btn-primary text-xs">Subscribe</button>
							</form>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<div class="mt-6 p-4 rounded-xl border border-gray-800 bg-gray-900/50">
		<p class="text-xs text-gray-500">
			Suggestions refresh each time you visit this page. The more you interact with articles, the better Claude's recommendations become.
		</p>
	</div>
</div>
