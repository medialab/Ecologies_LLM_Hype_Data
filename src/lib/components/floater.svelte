<script lang="ts">
	import {
		syncedCurrentIndex,
		dataSet,
		isQuoteVideoPlaying,
		syncedCurrentPeriod
	} from '$lib/stores/stores';
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import { fade, scale } from 'svelte/transition';
	import { tick } from 'svelte';
	import { cubicOut } from 'svelte/easing';

	export let index: number;
	export let animatePosition;
	export let setPosition;

	// Single media source and type for this specific period
	export let media: string = '';
	export let type: string = '';
	export let period: string = '';

	let x = 0;
	let y = 0;
	let z = 0;
	let thisFloater;
	let quoteVideo;
	let objectDistance = 0;

	let videoFloater: HTMLVideoElement;

	let showFloater = writable(false);
	let isFloaterLoaded = writable(false);

	// Viewport dimensions for precise positioning
	let viewportWidth = 0;
	let viewportHeight = 0;

	// Reactive variable to track showcase state
	$: isShowcased = index === $syncedCurrentIndex && period === $syncedCurrentPeriod;

	// Simplified function to get only essential showcase positioning
	function getShowcasePosition(isShowcased: boolean) {
		if (isShowcased) {
			console.log('showcased');
			const showcasedWidth = viewportWidth * 0.4;
			const showcasedHeight = viewportHeight * 0.5;
			const centerX = (viewportWidth - showcasedWidth) / 2;
			const centerY = (viewportHeight - showcasedHeight) / 2;

			return {
				left: centerX + 'px',
				top: centerY + 'px',
				zIndex: '600'
			};
		}

		return {
			left: `${x}px`,
			top: `${y}px`,
			zIndex: Math.floor(z).toString()
		};
	}

	// Simplified reactive position object
	$: showcasePosition = getShowcasePosition(isShowcased);

	$: if (index === $syncedCurrentIndex && period === $syncedCurrentPeriod && videoFloater) {
		videoFloater.play();
	} else if (videoFloater) {
		videoFloater.pause();
	}

	$: if (
		quoteVideo &&
		$dataSet[index].type === 'quote' &&
		index === $syncedCurrentIndex &&
		period === $syncedCurrentPeriod
	) {
		startQuoteVideoSync();
	}

	function startQuoteVideoSync() {
		if (!quoteVideo) {
			console.log('Quote video element not found');
			return;
		}

		quoteVideo.onplay = null;
		quoteVideo.onended = null;

		quoteVideo.onplay = () => {
			console.log('Quote video started playing');
			isQuoteVideoPlaying.set(true);
			console.log('isQuoteVideoPlaying: ', $isQuoteVideoPlaying);
		};

		quoteVideo.onended = () => {
			console.log('Quote video ended');
			isQuoteVideoPlaying.set(false);
			console.log('isQuoteVideoPlaying: ', $isQuoteVideoPlaying);
		};

		if (quoteVideo.paused) {
			console.log('Starting paused quote video');
			quoteVideo.play();
		} else {
			console.log('Quote video already playing');
		}
	}

	onMount(() => {
		// Since we only render visible floaters now, always show them
		showFloater.set(true);
		isFloaterLoaded.set(false);

		const position = setPosition(index);
		x = position.x;
		y = position.y;
		z = position.z;

		objectDistance = position.objectDistance;

		// Get viewport dimensions
		viewportWidth = window.innerWidth;
		viewportHeight = window.innerHeight;

		// Update viewport dimensions on resize
		const handleResize = () => {
			viewportWidth = window.innerWidth;
			viewportHeight = window.innerHeight;
		};

		window.addEventListener('resize', handleResize);

		tick().then(() => {
			animatePosition(index, thisFloater);
		});

		// Return cleanup function
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	onDestroy(() => {
		if (quoteVideo) {
			quoteVideo.pause();
			quoteVideo.src = '';
			quoteVideo.load();
		}
		if (videoFloater) {
			videoFloater.pause();
			videoFloater.src = '';
			videoFloater.load();
		}
	});
</script>

<div
	class="floater_container {isShowcased ? 'showcased' : 'non-showcased'}"
	data-index={index}
	style="
        left: {showcasePosition.left};
        opacity: {$isFloaterLoaded && $showFloater ? 1 : 0};
        top: {showcasePosition.top};
        z-index: {showcasePosition.zIndex};
        --scale-factor: {index === $syncedCurrentIndex ? 1 : objectDistance};
        --blur-amount: {Math.max(2, (100 - z) * 0.2 + 2)}px;
        transition-delay: {index * 100}ms;
        transition: {index === $syncedCurrentIndex || index === $syncedCurrentIndex - 1
		? 'all 2s ease-in-out'
		: 'none'};"
	bind:this={thisFloater}
	data-type={$dataSet[index].type}
	data-period={period}
>
	{#if media}
		<div class="floater_header">
			<p class="floater_header_text">{media.split('/').pop()}</p>
			<p class="floater_header_text">{period}</p>
		</div>
	{/if}

	<div class="floater_media">
		{#if $dataSet[index].type === 'quote'}
			<video
				transition:fade={{ duration: 1000, delay: 500 }}
				bind:this={quoteVideo}
				src={$dataSet[index].media}
				data-sveltekit-preload-data
				poster={$dataSet[index].media
					.replace('video_quote_static', '/posters')
					.replace(/\.(webm|mp4)$/, '-poster.webp')}
				playsinline
				disableremoteplayback
				disablepictureinpicture
				preload="metadata"
				on:loadeddata={() => isFloaterLoaded.set(true)}
				on:error={() => isFloaterLoaded.set(false)}
				autoplay={false}
			>
				<track kind="captions" label="Captions" src="" srclang="en" default />
			</video>
			<div class="svg_container">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"
					><path
						d="M320-400h320v-22q0-44-44-71t-116-27q-72 0-116 27t-44 71v22Zm160-160q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z"
					/></svg
				>
			</div>
		{:else if type === 'image'}
			<img
				transition:fade={{ duration: 1000, delay: 500 }}
				src={media}
				alt="Image_{index}"
				data-sveltekit-preload-data
				on:load={() => isFloaterLoaded.set(true)}
				on:error={() => isFloaterLoaded.set(false)}
			/>
			<div class="svg_container">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"
					><path
						d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z"
					/></svg
				>
			</div>
		{:else if type === 'video'}
			<video
				transition:fade={{ duration: 1000, delay: 500 }}
				bind:this={videoFloater}
				src={media}
				muted
				loop
				data-sveltekit-preload-data
				poster={'/posters/' + media.split('/').pop().replace('.webm', '-poster.webp')}
				playsinline
				disableremoteplayback
				disablepictureinpicture
				preload="metadata"
				autoplay={false}
				on:loadeddata={() => isFloaterLoaded.set(true)}
				on:error={() => isFloaterLoaded.set(false)}
			>
				<track kind="captions" label="Captions" src="" srclang="fr" default />
			</video>
			<div class="svg_container">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"
					><path
						d="M360-240h160q17 0 28.5-11.5T560-280v-40l80 42v-164l-80 42v-40q0-17-11.5-28.5T520-480H360q-17 0-28.5 11.5T320-440v160q0 17 11.5 28.5T360-240ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"
					/></svg
				>
			</div>
		{:else}
			<div class="loading"></div>
		{/if}
	</div>
</div>

<style>
	.svg_container {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 30px;
		height: 30px;
		background-color: white;
		fill: black;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 2px 0px 0px 0px;
	}

	.svg_container svg {
		width: 60%;
		height: 60%;
	}

	.floater_container[data-index='0'] {
		display: none;
	}

	.floater_container {
		position: absolute;
		transform-origin: center;

		top: 0;
		left: 0;
		display: flex;
		flex-direction: column;
		gap: 0px;
		overflow: hidden;
		transform: '';
		opacity: 0;
		transition:
			opacity 1s ease-in-out,
			filter 1s ease-in-out;
		will-change: top, left, transform, filter, transform-origin, position;
		border: 2px solid var(--dominant-light);
		border-radius: 2px;
	}

	.floater_container.showcased {
		width: 40vw;
		height: 50vh;
		transform: scale(1);
		filter: blur(0px) !important;
	}

	.floater_container.non-showcased {
		width: 300px;
		height: 230px;
		transform: scale(var(--scale-factor));
		filter: blur(var(--blur-amount));
	}

	.floater_header {
		position: relative;
		width: 100%;
		height: 20%;
		height: fit-content;
		padding: 5px;
		background-color: rgba(255, 255, 255, 0.9);
		color: black;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.floater_header_text {
		font-size: 1rem;
		font-weight: 200;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		width: max-content;
		text-transform: uppercase;
	}

	.floater_media {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		border-top: 1px solid var(--dominant-light);
		z-index: 1;
		background-color: var(--dominant-light);
	}

	:global(.floater_media video) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
	}

	:global(.floater_media img, picture) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		display: block;
	}

	.loading {
		width: 0px;
		height: 0px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f5f5f5;
		color: #666;
		font-size: 1rem;
	}

	.textual {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f5f5f5;
		color: #666;
		font-size: 2rem;
		padding: 20px;
	}

	.textual > p {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		white-space: pre-wrap;
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;
		word-wrap: break-word;
		word-break: break-word;
		hyphens: auto;
	}
</style>
