<script>
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
	import { writable } from 'svelte/store';
	import { isPopUpShowing } from '$lib/stores/stores.js';
	import { fade, fly } from 'svelte/transition';
	import popSound from '$lib/media/popsound.mp3';

	let { chatText, index } = $props();

	let randomNumber = writable(100);
	let localShowing = $state(false);

	const calculateRandomNumber = () => {
		$randomNumber = Math.floor(Math.random() * 41 + 60);
	};

	let popSoundElement;

	$effect(() => {
		if ($isPopUpShowing === true && popSoundElement) {
			calculateRandomNumber();
			setTimeout(() => {
				localShowing = true;
				if (popSoundElement) popSoundElement.play();
			}, 800 * index);
		} else {
			setTimeout(() => {
				localShowing = false;
			}, 100 * index);
		}
	});
</script>

<div
	class="chat_container"
	style="max-width: {$randomNumber}% !important;"
	class:showing={localShowing}
>
	<p class="chat_text">{@html chatText}</p>
</div>

<audio bind:this={popSoundElement} src={popSound} playsinline autoplay={false}></audio>

<style>
	.chat_container {
		display: flex;
		height: auto;
		min-height: fit-content;

		padding: var(--spacing-m);
		justify-content: flex-start;
		align-items: flex-start;
		gap: 0px;
		background-color: #f2f2f2;
		border-radius: 10px;
		opacity: 0;
		transform: translateX(100%);
		transition: all 1s ease-in-out;
		overflow-wrap: break-word;
		flex-wrap: wrap;
	}

	.chat_container.showing {
		opacity: 1;
		transform: translateX(0%);
		transition: all 1s ease-in-out;
	}

	.chat_text {
		font-size: 1.2rem;
		font-weight: 400;
		line-height: 1.2;
		text-align: left;
		white-space: pre-wrap;
		word-wrap: break-word;
		margin: 0;
		padding: 0;
	}

	:global(.chat_text b) {
		font-weight: 600;
	}
</style>
