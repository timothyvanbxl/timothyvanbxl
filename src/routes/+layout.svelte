<script>
	import '../app.css';
	import { page } from '$app/stores';

	const TAGS = ['All', 'AI', 'Strategy', 'Leadership', 'Product', 'Finance', 'Innovation', 'Technology', 'Operations'];

	let { children } = $props();

	const navLinks = [
		{ href: '/', label: 'Briefing' },
		{ href: '/feeds', label: 'Feeds' },
		{ href: '/suggestions', label: 'Suggestions' }
	];
</script>

<div class="min-h-screen bg-gray-950 text-gray-100">
	<!-- Top nav -->
	<header class="border-b border-gray-800 sticky top-0 z-50 bg-gray-950/90 backdrop-blur">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between h-14">
				<div class="flex items-center gap-8">
					<a href="/" class="flex items-center gap-2">
						<span class="text-brand-500 font-bold text-lg tracking-tight">Briefing</span>
					</a>
					<nav class="flex items-center gap-1">
						{#each navLinks as link}
							<a
								href={link.href}
								class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
									{$page.url.pathname === link.href
										? 'bg-gray-800 text-gray-100'
										: 'text-gray-400 hover:text-gray-100 hover:bg-gray-900'}"
							>
								{link.label}
							</a>
						{/each}
					</nav>
				</div>
				<span class="text-xs text-gray-500">
					{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
				</span>
			</div>
		</div>
	</header>

	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		{@render children()}
	</main>
</div>
