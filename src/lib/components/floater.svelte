<script lang="ts">
	import {
		syncedCurrentIndex,
		dataSet,
		isQuoteVideoPlaying,
		syncedCurrentPeriod
	} from '$lib/stores/stores';
	import { onMount, onDestroy, untrack } from 'svelte';
	import { writable } from 'svelte/store';
	import { tick } from 'svelte';
	import { fade, slide, scale as scaleTransition } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';

	let {tStart, tEnd, index, setPosition, media, type, period} = $props();

	// Removed unused reactive randomVideoSrc - computed directly in template

	let width = writable(0);
	let height = writable(0);

	let x = writable(0);
	let y = writable(0);
	let z = writable(0);
	let scale = writable(0);
	let thisFloater = $state<HTMLElement | null>(null);
	let quoteVideo = $state<HTMLVideoElement | null>(null);
	// Removed unused objectDistance reactive variable

	let videoFloater = $state<HTMLVideoElement | null>(null);

	// Fix TypeScript errors and remove individual media handlers
	let isFloaterLoaded = writable(false);
	let loadTimeout: number | null = null;
	let imageElement = $state<HTMLImageElement | null>(null);

	// Centralized media readiness checker
	function checkMediaReadiness() {
		if (type === 'image' && imageElement) {
			return imageElement.complete && imageElement.naturalWidth > 0;
		} else if (type === 'video' && videoFloater) {
			return videoFloater.readyState >= 2; // HAVE_CURRENT_DATA
		} else if ($dataSet[index].type === 'quote' && quoteVideo) {
			return quoteVideo.readyState >= 2; // HAVE_CURRENT_DATA
		}
		return false;
	}

	async function handleFloaterReady() {
		await tick();
		const delay = index * 400;
		loadTimeout = setTimeout(() => {
			isFloaterLoaded.set(true);
		}, delay);
	}

	// Monitor media readiness
	$effect(() => {
		let mediaElement: HTMLImageElement | HTMLVideoElement | null = null;
		
		// Check dataSet type first since it's the actual content type
		if ($dataSet[index].type === 'quote') mediaElement = quoteVideo;
		else if (type === 'image') mediaElement = imageElement;
		else if (type === 'video') mediaElement = videoFloater;
		
		if (!mediaElement) return;
		
		const checkReady = () => {
			if (checkMediaReadiness()) {
				handleFloaterReady();
			}
		};
		
		const handleError = () => isFloaterLoaded.set(false);
		
		// Use appropriate events for each media type
		if ($dataSet[index].type === 'quote' || type === 'video') {
			mediaElement.addEventListener('loadeddata', checkReady);
			mediaElement.addEventListener('error', handleError);
		} else if (type === 'image') {
			mediaElement.addEventListener('load', checkReady);
			mediaElement.addEventListener('error', handleError);
		}
		
		// Check immediately in case media is already loaded
		checkReady();
		
		// Cleanup function
		return () => {
			if (mediaElement) {
				if ($dataSet[index].type === 'quote' || type === 'video') {
					mediaElement.removeEventListener('loadeddata', checkReady);
				} else if (type === 'image') {
					mediaElement.removeEventListener('load', checkReady);
				}
				mediaElement.removeEventListener('error', handleError);
			}
		};
	});

	// Viewport dimensions for precise positioning
	let viewportWidth = 0;
	let viewportHeight = 0;

	let isShowcased = writable(false);

	$effect(() => {
		const shouldShowcase = index === $syncedCurrentIndex && period === $syncedCurrentPeriod;
		isShowcased.set(shouldShowcase);
	});

	$effect(() => {
		if (index === $syncedCurrentIndex && period === $syncedCurrentPeriod && videoFloater) {
			videoFloater.play().catch(error => {
				console.error('Failed to play video floater:', error);
			});
		} else if (videoFloater) {
			videoFloater.pause();
		}
	});

	$effect(() => {
		if (
			quoteVideo &&
			untrack(() => $dataSet[index].type) === 'quote' &&
			index === $syncedCurrentIndex &&
			period === $syncedCurrentPeriod
		) {
			startQuoteVideoSync();
		}
	});

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
			quoteVideo.play().catch(error => {
				console.error('Failed to play quote video:', error);
				isQuoteVideoPlaying.set(false);
			});
		} else {
			console.log('Quote video already playing');
		}
	}

	let animationFrames = new Map<number, number>();

	const animatePosition = (index: number, thisFloater: HTMLElement | null): void => {
		if (!thisFloater) return;

		// Stop animation if component is not visible or destroyed
		if (!document.body.contains(thisFloater)) {
			const frameId = animationFrames.get(index);
			if (frameId) {
				cancelAnimationFrame(frameId);
				animationFrames.delete(index);
			}
			return;
		}

		let containerWidth: number;
		let containerHeight: number;

		// Set base dimensions first
		if (type === 'image') {
			containerWidth = 230;
			containerHeight = 300;
		} else {
			containerWidth = 300;
			containerHeight = 230;
		}

		if (!untrack(() => $isShowcased)) {
			// Only animate if the floater is within viewport bounds
			const rect = thisFloater.getBoundingClientRect();
			const isVisible = (
				rect.bottom >= -500 &&
				rect.top <= window.innerHeight + 500 &&
				rect.right >= -500 &&
				rect.left <= window.innerWidth + 500
			);

			if (!isVisible) {
				// Skip animation for off-screen floaters but keep the loop running
				animationFrames.set(
					index,
					requestAnimationFrame(() => animatePosition(index, thisFloater))
				);
				return;
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

			const finalX: number = Math.max(padding, Math.min(window.innerWidth - containerWidth - padding, newX));
			const finalY: number = Math.max(padding, Math.min(window.innerHeight - containerHeight - padding, newY));
			const finalZ: number = Math.max(0, Math.min(100, newZ));

			x.set(finalX);
			y.set(finalY);
			z.set(finalZ);
			scale.set(0.2 + ($z / 100) * 0.8);
			width.set(containerWidth);
			height.set(containerHeight);

		} else if (untrack(() => $isShowcased)) {
			
			setTimeout(() => {
				const scaleValue = 1;
				const aspectRatio = containerWidth / containerHeight;
				
				// Calculate dimensions that fit within 40% width and 80% height while preserving aspect ratio
				const maxWidth = 0.4 * viewportWidth;
				const maxHeight = 0.8 * viewportHeight;
				
				let floaterWidth, floaterHeight;
				
				if (maxWidth / aspectRatio <= maxHeight) {
					// Width is the limiting factor
					floaterWidth = maxWidth;
					floaterHeight = maxWidth / aspectRatio;
				} else {
					// Height is the limiting factor
					floaterHeight = maxHeight;
					floaterWidth = maxHeight * aspectRatio;
				}
				
				x.set((viewportWidth - floaterWidth) / 2);
				y.set((viewportHeight - floaterHeight) / 2);
				z.set(800);
				scale.set(scaleValue);
				width.set(floaterWidth);
				height.set(floaterHeight);
			}, 50);
			
		}

		// Always run animation for all floaters
		animationFrames.set(
			index,
			requestAnimationFrame(() => animatePosition(index, thisFloater))
		);
	};

	$effect(() => {
		if ($isShowcased) {
			console.log('showcased');
			thisFloater.classList.remove('floating');
			thisFloater.classList.add('showcased');
		} else if ($syncedCurrentIndex === index + 1 && $syncedCurrentPeriod === period) {
			thisFloater.classList.remove('showcased');
			thisFloater.classList.add('outgoing');
		} else {
			thisFloater.classList.remove('showcased');
			thisFloater.classList.add('floating');
		}
	});

	onMount(() => {

		const position = setPosition(index);
		x.set(position.x);
		y.set(position.y);
		z.set(position.z);
		scale.set(0.2 + (position.z / 100) * 0.8);

		// Removed unused objectDistance assignment

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
		// Clean up animation frames
		const frameId = animationFrames.get(index);
		if (frameId) {
			cancelAnimationFrame(frameId);
			animationFrames.delete(index);
		}
		
		// Clean up load timeout
		if (loadTimeout) {
			clearTimeout(loadTimeout);
			loadTimeout = null;
		}
		
		// Clean up video elements
		if (quoteVideo) {
			quoteVideo.pause();
			quoteVideo.onplay = null;
			quoteVideo.onended = null;
			quoteVideo.onloadeddata = null;
			quoteVideo.onerror = null;
			quoteVideo.src = '';
			quoteVideo.load();
		}
		
		if (videoFloater) {
			videoFloater.pause();
			videoFloater.onloadeddata = null;
			videoFloater.onerror = null;
			videoFloater.src = '';
			videoFloater.load();
		}
		
		// Reset stores to prevent memory leaks
		isFloaterLoaded.set(false);
		isShowcased.set(false);
	});
</script>


{#key media}
	<div
		class="floater_container"
		transition:scaleTransition={{duration: 300, delay: 0, easing: cubicInOut}}
		bind:this={thisFloater}
		data-index={index}
		data-type={type}
		data-period={period}
		style="opacity: {$isFloaterLoaded ? 1 : 0};
		visibility: {$isFloaterLoaded ? 'visible' : 'hidden'};
			transform: translate(calc(-50vw + {$x}px), calc(-50vh + {$y}px)) scale({$scale});
			width: {$width}px;
			height: {$height}px;
			max-width: {$width}px;
			max-height: {$height}px;
			filter: blur({Math.max(2, (100 - $z) * 0.15 + 2)}px);
			z-index: {Math.round($z).toString()};
			transition: {$isShowcased || index === $syncedCurrentIndex + 1 || index === $syncedCurrentIndex - 1 ? 'all 2s ease-in-out' : 'none'};
			transition-delay: {$isShowcased || index === $syncedCurrentIndex + 1 || index === $syncedCurrentIndex - 1 ? '0.1s' : '0s'};">
		
			{#if media}
				<div
					class="floater_header"
					data-type={$dataSet[index].type}
					style="color: {$dataSet[index].type === 'quote' ? 'var(--dominant-light)' : 'var(--dominant-dark)'};"
				>
					{#if type === 'image'}
						<p class="floater_header_text">.jpg</p>
					{:else if type === 'video'}
						<p class="floater_header_text">.mp4</p>
					{/if}
					{#if $isShowcased}
						<p class="floater_header_text"
						transition:slide={{duration: 1000, delay: 200, axis: 'y', easing: cubicInOut}}>{period}</p>
					{/if}
				</div>
			{/if}

		<div class="floater_media_container" data-type={$dataSet[index].type}>
			{#if $dataSet[index].type === 'quote'}
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
					autoplay={false}
				>
					<track kind="captions" label="Captions" src="" srclang="en" default />
				</video>

				<div class="svg_container">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path
							d="M320-400h320v-22q0-44-44-71t-116-27q-72 0-116 27t-44 71v22Zm160-160q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z"
						/></svg>
				</div>
				{:else if type === 'image'}
					<enhanced:img
						src={media}
						alt="Image_{index}"
						data-sveltekit-preload-data
						data-type="image"
						bind:this={imageElement}
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
						src={tStart !== null && tEnd !== null ? `${media}#t=${tStart.toFixed(3)},${tEnd.toFixed(3)}` : media}
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
{/key}

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

	.floater_header {
		position: relative;
		height: fit-content;
		width: 100%;
		padding: var(--spacing-xs);
		background-color: var(--dominant-light);
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
		color: inherit;
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

	.floater_container {
		position: absolute;
		left: 50%;
		top: 50%;
		transform-origin: center;
		display: flex;
		flex-direction: column;
		gap: 0px;
		overflow: hidden;
		opacity: 0;
		border: 1px solid var(--dominant-dark);
		border-radius: 2px;
		will-change: transform, opacity, width, height;
	}
</style>
