<script>
	let { children } = $props();

	import { syncedCurrentPeriod, syncedCurrentIndex } from '$lib/stores/stores';
</script>

{@render children()}

<style>
	:global(.button_container) {
		z-index: 2;
		border-radius: var(--spacing-s);
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--spacing-s);
		position: static;
		width: 70%;
	}

	:global(button) {
		background-color: transparent;
		color: var(--dominant-dark);
		transform: scale(1);
		transition: all 0.1s ease-in-out;
		transform-origin: center;
		will-change: transform;
		align-self: center;
		cursor: pointer;
		justify-content: center;
		pointer-events: none;
		opacity: 0.1;
		transition: all 0.3s ease-in-out;
		width: max-content;
		border: 0px;
	}

	:global(button.isAudioTimelinePlaying) {
		opacity: 1;
		pointer-events: auto;
	}

	:global(button:active) {
		transform: scale(0.9);
		transition: all 0.3s ease-in-out;
	}

	:global(button:hover) {
		transform: scale(0.95);
		transition: all 0.3s ease-in-out;
	}

	:global(.button_text) {
		font-size: 0.8rem;
		font-weight: 400;
		width: max-content;
		white-space: nowrap;
		height: fit-content;
	}

	:global(.header_text) {
		font-family: 'Instrument Serif';
		font-size: 1.5rem;
		font-weight: 400;
		text-align: left;
		text-transform: none;
	}

	:global(.header_text i) {
		font-style: italic;
		font-family: inherit;
		font-weight: 400;
		font-size: inherit;
		text-transform: none;
	}
</style>
