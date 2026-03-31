import { json } from '@sveltejs/kit';
import { runMorningRefresh } from '$lib/scheduler.js';

export async function POST() {
	// Fire and forget — don't await so the request returns immediately
	runMorningRefresh().catch((err) => console.error('[API] Refresh error:', err));
	return json({ ok: true, message: 'Refresh started' });
}
