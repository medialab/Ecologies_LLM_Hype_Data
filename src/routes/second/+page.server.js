export async function load() {
	try {
		const chats = await import('$lib/stores/conversations.json', { assert: { type: 'json' } });
		return { chats: chats.default };
	} catch (error) {
		console.error('Error loading chats data:', error);
		return { chats: [] };
	}
}