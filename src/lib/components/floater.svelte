<script lang="ts">
	import {
		syncedCurrentIndex,
		dataSet,
		isQuoteVideoPlaying,
		syncedCurrentPeriod
	} from '$lib/stores/stores';
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import { tick } from 'svelte';

	// Pre-computed clip range (if provided)
	export let tStart: number | null = null;
	export let tEnd: number | null = null;

	let randomVideoSrc: string = '';

	// Compute the video source based on provided clip boundaries.
	$: if (type === 'video') {
		if (tStart !== null && tEnd !== null) {
			randomVideoSrc = `${media}#t=${tStart.toFixed(3)},${tEnd.toFixed(3)}`;
		} else {
			randomVideoSrc = media;
		}
	}

	export let index: number;
	export let setPosition;

	// Single media source and type for this specific period
	export let media: string = '';
	export let type: string = '';
	export let period: string = '';

	let width = writable(0);
	let height = writable(0);

	let x = writable(0);
	let y = writable(0);
	let z = writable(0);
	let thisFloater;
	let quoteVideo;
	let objectDistance = 0;

	let videoFloater: HTMLVideoElement;

	let showFloater = writable(false);
	let isFloaterLoaded = writable(false);

	// Viewport dimensions for precise positioning
	let viewportWidth = 0;
	let viewportHeight = 0;

	let isShowcased = writable(false);

	// Reactive variable to track showcase state
	$: isShowcased.set(index === $syncedCurrentIndex && period === $syncedCurrentPeriod);

	$: if (index === $syncedCurrentIndex && period === $syncedCurrentPeriod && videoFloater) {
		videoFloater.play();
	} else if (videoFloater) {
		videoFloater.pause();
	}

	// Reactive positioning based on x, y, z stores
	$: if (thisFloater && !$isShowcased) {
		const scale = 0.2 + ($z / 100) * 0.8;
		thisFloater.style.left = $x + 'px';
		thisFloater.style.top = $y + 'px';
		thisFloater.style.width = $width + 'px';
		thisFloater.style.height = $height + 'px';
		thisFloater.style.maxWidth = $width + 'px';
		thisFloater.style.maxHeight = $height + 'px';
		thisFloater.style.transform = `scale(${scale})`;
		thisFloater.style.filter = `blur(${Math.max(2, (100 - $z) * 0.15 + 2)}px)`;
		thisFloater.style.zIndex = Math.round($z).toString();
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
		};

		quoteVideo.onended = () => {
			console.log('Quote video ended');
			isQuoteVideoPlaying.set(false);
		};

		if (quoteVideo.paused) {
			console.log('Starting paused quote video');
			quoteVideo.play();
		} else {
			console.log('Quote video already playing');
		}
	}

	let animationFrames = new Map<number, number>();

	const animatePosition = (index: number, thisFloater: HTMLElement): void => {
		if (!thisFloater) return;

		if ($isShowcased) {
			// Add showcase classes instead of inline styles
			if (thisFloater.classList.contains('not_showcased')) {
				thisFloater.classList.remove('not_showcased');
				thisFloater.classList.add('showcased');
			}
			

		} else {
			if (thisFloater.classList.contains('showcased')) {
				thisFloater.classList.remove('showcased');
				thisFloater.classList.add('yet_showcased');
			}
			
			const time: number = performance.now() * 0.005;
			const uniqueOffset: number = index * 0.7;

			const baseAmplitudeX: number = window.innerWidth * 0.3;
			const baseAmplitudeY: number = window.innerHeight * 0.3;
			const baseAmplitudeZ: number = 30;

			const waveSpeedX: number = 0.001 * (1 + (index % 3) * 0.5);
			const waveSpeedY: number = 0.001 * (1 + (index % 4) * 0.3);
			const waveSpeedZ: number = 0.001 * (1 + (index % 5) * 0.2);

			const waveX: number = Math.sin(time * waveSpeedX + uniqueOffset) * baseAmplitudeX;
			const waveY: number = Math.cos(time * waveSpeedY + uniqueOffset * 1.3) * baseAmplitudeY;
			const waveZ: number = Math.sin(time * waveSpeedZ + uniqueOffset * 1.8) * baseAmplitudeZ;

			const centerOffsetX: number = ((index % 7) - 3) * 100;
			const centerOffsetY: number = ((index % 5) - 2) * 80;

			const centerX: number = window.innerWidth / 2 + centerOffsetX;
			const centerY: number = window.innerHeight / 2 + centerOffsetY;
			const centerZ: number = 50;

			const secondaryX: number = Math.sin(time * 0.15 + uniqueOffset * 0.8) * 80;
			const secondaryY: number = Math.cos(time * 0.12 + uniqueOffset * 1.2) * 60;

			const newX: number = centerX + waveX + secondaryX;
			const newY: number = centerY + waveY + secondaryY;
			const newZ: number = centerZ + waveZ + Math.sin(time * 0.08 + uniqueOffset) * 25;

			const padding: number = 20;
			// Set base dimensions depending on media orientation
			let containerWidth: number;
			let containerHeight: number;
			
			if (type === 'image') {
				// vertical orientation
				containerWidth = 230;
				containerHeight = 300;

			} else {
				containerWidth = 300;
				containerHeight = 230;
			}

			const finalX: number = Math.max(padding, Math.min(window.innerWidth - containerWidth - padding, newX));
			const finalY: number = Math.max(padding, Math.min(window.innerHeight - containerHeight - padding, newY));
			const finalZ: number = Math.max(0, Math.min(100, newZ));

			// Update writable stores - Svelte reactivity will handle the rest
			x.set(finalX);
			y.set(finalY);
			z.set(finalZ);
			width.set(containerWidth);
			height.set(containerHeight);
		}

		// Always run animation for all floaters
		animationFrames.set(
			index,
			requestAnimationFrame(() => animatePosition(index, thisFloater))
		);
	};

	onMount(() => {
		// Since we only render visible floaters now, always show them
		showFloater.set(true);
		isFloaterLoaded.set(false);

		const position = setPosition(index);
		x.set(position.x);
		y.set(position.y);
		z.set(position.z);

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

		if ($dataSet[index].type === 'video') {
			width.set(Math.round(320));
			height.set(Math.round(230));

		} else if ($dataSet[index].type === 'image') {
			width.set(Math.round(230));
			height.set(Math.round(320));
		}

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
	class="floater_container not_showcased"
	bind:this={thisFloater}
	data-index={index}
	data-type={type}
	data-period={period}
	style="
        opacity: {$isFloaterLoaded && $showFloater ? 1 : 0};
        z-index: {$isShowcased ? 600 : Math.floor($z).toString()};
        --scale-factor: {index === $syncedCurrentIndex ? 1 : objectDistance};
        --blur-amount: {Math.max(2, (100 - $z) * 0.2 + 2)}px;
        left: {$x}px;
        top: {$y}px;
        width: {$width}px;
        height: {$height}px;
		transition: {$syncedCurrentIndex === index || $syncedCurrentIndex === index +1 || $syncedCurrentIndex === index -1 ? 'all 2s ease-in-out' : 'none'};"
>
	{#if media}
		<div class="floater_header" data-type={$dataSet[index].type}>
			<p class="floater_header_text">{media.split('/').pop().slice(0, 10)}.jpg</p>
			{#if $isShowcased}
				<p class="floater_header_text">{period}</p>
			{/if}
		</div>
	{/if}

	<div class="floater_media_container" data-type={$dataSet[index].type}>
		{#if $dataSet[index].type === 'quote'}
			<!--This must be like this so we obtain the correct video from the JSON that's stores in the .media field-->
			<video
				bind:this={quoteVideo}
				src={$dataSet[index].media}
				data-sveltekit-preload-data
				data-type="quote"
				data-source={$dataSet[index].type}
				poster={$dataSet[index].media
					.replace('video_quote_static', '/posters')
					.replace(/\.(webm|mp4)$/, '_poster.webp')}
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
				src={media}
				alt="Image_{index}"
				data-sveltekit-preload-data
				data-type="image"
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
				bind:this={videoFloater}
				src={randomVideoSrc}
				muted
				loop
				data-sveltekit-preload-data
				data-type="video"
				poster={'/posters/' + media.split('/').pop().replace(/\.(webm|mp4)$/, '_poster.webp')}
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
		width: var(--spacing-l);
		height: var(--spacing-l);
		background-color: var(--dominant-light);
		fill: var(--dominant-dark);
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 2px 0px 0px 0px;
		border-left: 1px solid var(--dominant-dark);
		border-top: 1px solid var(--dominant-dark);
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
		display: flex;
		flex-direction: column;
		gap: 0px;
		overflow: hidden;
		transform: '';
		opacity: 0;
		will-change: top, left, transform, filter, transform-origin, position;
		border: 1px solid var(--dominant-dark);
		border-radius: 2px;
	}

	.floater_header {
		position: relative;
		height: fit-content;
		width: 100%;
		padding: var(--spacing-xs);
		background-color: var(--dominant-light);
		color: var(--dominant-dark);
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid var(--dominant-dark);
	}

	.floater_header_text {
		font-size: 1rem;
		font-weight: 200;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		width: fit-content;
		text-transform: uppercase;
	}

	.floater_media_container {
		position: relative;
		border-top: 1px solid var(--dominant-light);
		z-index: 1;
		background-color: var(--dominant-light);
		width: 100%;
		height: 100%;
	}

	:global(.floater_media_container > image, picture, video) {
		object-fit: cover;
		object-position: center;
		display: block;
		width: 100%;
		height: 100%;
	}

	:global(.floater_header[data-type="quote"]) {
		background-color: var(--dominant-dark);
		color: var(--dominant-light);
	}

	.loading {
		width: 0px;
		height: 0px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f5f5f5;
		color: #666;
	}

	:global(.floater_container.showcased) {
		z-index: 600 !important;
		left: 50% !important;
		top: 50% !important;
		transform: translate(-50%, -50%) !important;
		filter: blur(0px) !important;
	}

	:global(.floater_container.showcased[data-type="video"], .floater_container.showcased[data-source="quote"]) {
		width: 90% !important;
		height: 90% !important;
	}

	:global(.floater_container.showcased[data-type="quote"]) {
		width: 90% !important;
		height: 90% !important;
	}

	:global(.floater_container.showcased[data-type="image"]) {
		width: 40% !important;
		height: 90% !important;
	}

	:global(.floater_container.yet_showcased) {
		top: inherit;
		left: inherit;
		transform: inherit;
		filter: inherit;
		z-index: inherit;
		width: inherit;
		height: inherit;
	}
</style>
