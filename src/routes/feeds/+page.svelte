<script>
	let { data, form } = $props();

	const CATEGORIES = ['General', 'AI', 'Strategy', 'Business', 'Technology', 'Leadership', 'Finance', 'Innovation'];

	function weightLabel(weight) {
		if (weight >= 1.5) return { text: 'High', cls: 'text-emerald-400' };
		if (weight >= 0.8) return { text: 'Normal', cls: 'text-gray-400' };
		return { text: 'Low', cls: 'text-red-400' };
	}
</script>

<div class="max-w-4xl mx-auto">
	<div class="mb-6">
		<h1 class="text-xl font-semibold text-gray-100">Feeds</h1>
		<p class="text-sm text-gray-500 mt-1">Manage your subscribed RSS feeds. Feed weight reflects your reading preferences.</p>
	</div>

	<!-- Add feed form -->
	<div class="card mb-6">
		<h2 class="text-sm font-semibold text-gray-300 mb-4">Add a feed</h2>
		<form method="POST" action="?/add" class="flex flex-col sm:flex-row gap-3">
			<input
				type="text"
				name="name"
				placeholder="Feed name"
				required
				class="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-500"
			/>
			<input
				type="url"
				name="url"
				placeholder="https://example.com/rss.xml"
				required
				class="flex-[2] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-500"
			/>
			<select
				name="category"
				class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-500"
			>
				{#each CATEGORIES as cat}
					<option value={cat}>{cat}</option>
				{/each}
			</select>
			<button type="submit" class="btn-primary shrink-0">Add feed</button>
		</form>
		{#if form?.error}
			<p class="mt-2 text-sm text-red-400">{form.error}</p>
		{/if}
	</div>

	<!-- Feed list -->
	<div class="space-y-2">
		{#each data.feeds as feed}
			<div class="card flex items-center gap-4">
				<!-- Active indicator -->
				<div class="w-2 h-2 rounded-full shrink-0 {feed.active ? 'bg-emerald-500' : 'bg-gray-600'}"></div>

				<!-- Info -->
				<div class="flex-1 min-w-0">
					<div class="flex items-center gap-2">
						<span class="font-medium text-sm text-gray-100 truncate">{feed.name}</span>
						<span class="tag bg-gray-800 text-gray-400 border border-gray-700">{feed.category}</span>
					</div>
					<div class="flex items-center gap-3 mt-1">
						<span class="text-xs text-gray-500 truncate">{feed.url}</span>
						<span class="text-xs text-gray-600">·</span>
						<span class="text-xs text-gray-500">{feed.article_count} articles</span>
						<span class="text-xs text-gray-600">·</span>
						<span class="text-xs {weightLabel(feed.weight).cls}">
							{weightLabel(feed.weight).text} weight ({feed.weight.toFixed(2)})
						</span>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex items-center gap-2 shrink-0">
					<form method="POST" action="?/toggle">
						<input type="hidden" name="id" value={feed.id} />
						<button type="submit" class="btn-ghost text-xs">
							{feed.active ? 'Pause' : 'Resume'}
						</button>
					</form>
					<form method="POST" action="?/remove">
						<input type="hidden" name="id" value={feed.id} />
						<button
							type="submit"
							class="btn-ghost text-xs text-red-500 hover:text-red-400 hover:bg-red-900/20"
							onclick={(e) => { if (!confirm('Remove this feed?')) e.preventDefault(); }}
						>
							Remove
						</button>
					</form>
				</div>
			</div>
		{:else}
			<p class="text-center py-12 text-gray-500">No feeds yet. Add one above.</p>
		{/each}
	</div>
</div>
