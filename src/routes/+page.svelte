<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import {
		syncedCurrentIndex,
		dataSet,
		syncedCurrentPeriod,
		isQuoteAudioPlaying,
		isQuoteVideoPlaying,
		isAudioTimelinePlaying,
		randomIndex,
		isPopUpShowing
	} from '$lib/stores/stores';
	import { writable } from 'svelte/store';
	//import narrationAudio from '$lib/media/narratio_debug.wav';
	import narrationAudio from '$lib/media/narratio.mp3';
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';

	let audioElement = $state<HTMLAudioElement | null>(null);
	let scrollContainer = $state<HTMLElement | null>(null);
	let scrollAnimationId = null;
	
	let lastSegmentIndex = -1;
	let lastSegmentStartTime = 0;
	let rafId = null;

	let audioCurrentTime = writable(null);
	let audioDuration = writable(null);
	

	let audioVolume = new Tween(0, { duration: 800, easing: cubicInOut });

	//Tween the audio volume

	$effect(() => {
		if (audioElement) {
			audioElement.volume = audioVolume.current;
		}
	});

	async function fadeInAndPlay() {
		if (!audioElement) return;
		console.log('🎵 Setting isAudioTimelinePlaying to TRUE');
		isAudioTimelinePlaying.set(true);
		await audioElement.play();
		await audioVolume.set(1);
	}

	async function fadeOutAndPause() {
		if (!audioElement) return;
		console.log('🔇 fadeOutAndPause: Starting - isAudioTimelinePlaying:', $isAudioTimelinePlaying);
		await audioVolume.set(0);
		audioElement.pause();
		console.log('🔇 fadeOutAndPause: Setting isAudioTimelinePlaying to FALSE');
		isAudioTimelinePlaying.set(false);
		console.log('🔇 fadeOutAndPause: After setting - isAudioTimelinePlaying:', $isAudioTimelinePlaying);
	}

	//Start playback cycle : ok

	const startPlayback = () => {
		if (audioElement) {
			startSyncLoop();
		}
	};

	// Stop playback without resetting
	const stopPlayback = async () => {
		if (audioElement) {
			await stopSyncLoop();
		}
	};

	const handleTransitionPeriod = (period: string) => {
		syncedCurrentPeriod.set(period);
		console.log('Transitioning to period:', period);
	};

	async function startSyncLoop() {
		if (audioElement) {
		await fadeInAndPlay();

		if (rafId || !audioElement) return;

		const loop = () => {
			if (!$isAudioTimelinePlaying) {
				rafId = null;
				return;
			}

			if (!audioElement) {
				rafId = null;
				return;
			}

			const currentTime = $audioCurrentTime * 1000;

			manageAudioTimeline(currentTime);
			rafId = requestAnimationFrame(loop);
		};

		rafId = requestAnimationFrame(loop);
		}
	}

	//Stop raf cycle : ok

	async function stopSyncLoop() {
		// Cancel animation frame FIRST to stop manageAudioTimeline from running
		if (rafId) {
			console.log("🛑 Canceling animation frame FIRST");
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		
		await fadeOutAndPause();
		console.log("isAudioTimelinePlaying", $isAudioTimelinePlaying);
	}

	//Time evaluation cycle : ok
	$effect(() => {
		if ($isQuoteAudioPlaying) {
			console.log('🔈 Quote audio is playing 🔈');
		} else {
			console.log('🔈 Quote audio is NOT playing 🔈');
		}
	});

	$effect(() => {
		if ($isQuoteVideoPlaying) {
			console.log('📽️ Quote video is playing 📽️');
		} else {
			console.log('📽️ Quote video is NOT playing 📽️');
		}
	});

	/*$effect(() => {
		console.log('🔍 Auto-start effect check:', {
			isQuoteVideoPlaying: $isQuoteVideoPlaying,
			isAudioTimelinePlaying: $isAudioTimelinePlaying, 
			syncedCurrentIndex: $syncedCurrentIndex,
			isPopUpShowing: $isPopUpShowing
		});
		
		if (!$isQuoteVideoPlaying && !$isAudioTimelinePlaying && $syncedCurrentIndex !== -1 && !$isPopUpShowing) {
			console.log('✅✅ No quote video or audio playing, no popup active, continuing normally');
			startSyncLoop();
		}
	});*/

	function manageAudioTimeline(currentTime) {
		let foundIndex = -1;

		for (let i = 0; i < segmentStartTimes.length; i++) {
			const start = segmentStartTimes[i];
			const segObj = $dataSet[i];
			const end = segObj.end !== undefined ? segObj.end : start + segObj.duration;
			if (currentTime >= start && currentTime < end) {
				foundIndex = i;

				if (segObj.type === 'quote') {
					isQuoteAudioPlaying.set(true);
					//console.log('✍️This is a quote video segment');
					//console.log('🔍 Debug: currentTime:', currentTime, 'end:', end, 'difference:', end - currentTime);

					if (end - currentTime <= 400) {
						console.log('🪫 Audio segment ending soon, checking quote video status');

						if ($isQuoteVideoPlaying === true) {
							console.log('⚠️ Quote video is playing, stopping audio and waiting');
							isQuoteAudioPlaying.set(false);
							
							if ($isAudioTimelinePlaying === true) {
								console.log("Stopping sync loop from manageAudioTimeline");
								stopSyncLoop();
							}
						} else if ($isQuoteVideoPlaying === false) {
							console.log('✅ No quote video playing, continuing normally');
						}
					}
				}
				break;
			}
		}

		if (foundIndex === -1) return;

		if (foundIndex !== lastSegmentIndex) {
			const jsonStart = segmentStartTimes[foundIndex];
			const currentSeg = $dataSet[foundIndex];
			if (audioElement) {
				audioVolume.target = currentSeg.type === 'quote' ? 0.5 : 1;
			}

			lastSegmentIndex = foundIndex;
			lastSegmentStartTime = currentTime;
		}
		syncedCurrentIndex.set(foundIndex);
	}

	let segmentStartTimes = [];

	$effect(() => {
		if (segmentStartTimes.length === 0 && $dataSet.length) {
			if ($dataSet[0] && $dataSet[0].start !== undefined) {
				segmentStartTimes = $dataSet.map((seg) => seg.start);
			} else {
				// Fallback for legacy datasets without "start" field
				let cumulative = 0;
				segmentStartTimes = $dataSet.map((seg) => {
					const start = cumulative;
					cumulative += seg.duration;
					return start;
				});
			}
		}
	});

	$effect(() => {
		if ($syncedCurrentIndex > -1 && $isAudioTimelinePlaying) {
			const spanElement = document.getElementById(`sub_text_${$syncedCurrentIndex}`);

			if (spanElement) {
				//console.log("Span element found, animating scroll");
				animatedScrollTo(spanElement);
			}
		}
	});

	let isMultipleOf = $derived($syncedCurrentIndex % 3 === 0);

	$effect(() => {
		if (isMultipleOf) {
			console.log("isMultipleOf: ", isMultipleOf);
		
			untrack(() => {
				if ($syncedCurrentIndex !== -1 && $syncedCurrentIndex !== 0 && $syncedCurrentIndex !== 1) {
					console.log("Casistic 1");

					if (!$isQuoteVideoPlaying && !$isQuoteAudioPlaying && $isAudioTimelinePlaying) {
						console.log("Casistic 2");
						console.log("Setting pop up to true");

						const convAmount = 551;

						if (convAmount) {
							$randomIndex = Math.floor(Math.random() * convAmount);
							console.log("Random index: ", randomIndex);
						}

						isPopUpShowing.set(true);
						console.log("Setting popuoshowing to true: ", $isPopUpShowing);
						console.log("🏹 Stopping sync loop");
						
						stopSyncLoop().then(() => {
							setTimeout(() => {
								startSyncLoop();
								setTimeout(() => {
									isPopUpShowing.set(false);
									console.log("Setting popuoshowing to false: ", $isPopUpShowing);
								}, 1000);
							}, 15000);
						});
					}
				}
			});
		}
	});

	const animatedScrollTo = (element, duration = 500) => {
		if (!element || !scrollContainer) return;
		//console.log("Animating scroll to element");

		// Cancel any in-flight animation before starting a new one
		if (scrollAnimationId) {
			cancelAnimationFrame(scrollAnimationId);
			scrollAnimationId = null;
		}

		const containerRect = scrollContainer.getBoundingClientRect();
		const elementRect = element.getBoundingClientRect();

		const startScrollTop = scrollContainer.scrollTop;
		const targetScrollTop =
			startScrollTop +
			elementRect.top -
			containerRect.top -
			containerRect.height / 2 +
			elementRect.height / 2;

		const startTime = performance.now();

		const animateScroll = (currentTime) => {
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / duration, 1);

			const easeInOut =
				progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

			const currentScrollTop = startScrollTop + (targetScrollTop - startScrollTop) * easeInOut;
			scrollContainer.scrollTop = currentScrollTop;

			if (progress < 1 && duration > 0) {
				scrollAnimationId = requestAnimationFrame(animateScroll);
			} else if (duration === 0) {
				scrollContainer.scrollTop = targetScrollTop;
				scrollAnimationId = null;
			}
		};

		scrollAnimationId = requestAnimationFrame(animateScroll);
	};

	const resetCycle = async () => {
		console.log("🔄 RESET: Starting reset cycle");
		console.log("🔄 RESET: isAudioTimelinePlaying before stop:", $isAudioTimelinePlaying);
		
		// Set index to -1 FIRST to prevent auto-start effect from triggering
		console.log('🔄 RESET: Setting syncedCurrentIndex to -1 FIRST');
		syncedCurrentIndex.set(-1);
		
		await stopSyncLoop();
		
		console.log("🔄 RESET: isAudioTimelinePlaying after stop:", $isAudioTimelinePlaying);

		if (audioElement) {
			audioElement.pause();
			audioElement.currentTime = 0;
		}

		audioVolume.target = 0;
		
		console.log("🔄 RESET: Final isAudioTimelinePlaying:", $isAudioTimelinePlaying);
	};

	//Period processing : ok

	$effect(() => {
		if ($dataSet[$syncedCurrentIndex]) {
			const lowerText = $dataSet[$syncedCurrentIndex].text.toLowerCase();

			if (lowerText.includes('september') || lowerText.includes('october')) {
				handleTransitionPeriod('september_october');
				
			} else if (lowerText.includes('november') || lowerText.includes('december')) {
				handleTransitionPeriod('november_december');

			} else if (lowerText.includes('january') || lowerText.includes('february')) {
				handleTransitionPeriod('january_february');

			} else if (lowerText.includes('march') || lowerText.includes('april')) {
				handleTransitionPeriod('march_april');

			}
		}
	});

	function formatTimecode(seconds) {
		const hours = Math.floor(seconds / 3600)
			.toString()
			.padStart(2, '0');
		const minutes = Math.floor((seconds % 3600) / 60)
			.toString()
			.padStart(2, '0');
		const secs = Math.floor(seconds % 60)
			.toString()
			.padStart(2, '0');
		return { hours, minutes, secs };
	}

	let timestamp = $derived(formatTimecode($audioCurrentTime));



	onMount(() => {
		if (audioElement) {
			audioDuration.set(audioElement.duration);
			audioCurrentTime.set(audioElement.currentTime);
			//console.log("Audio duration set to", audioElement.duration);
			//console.log("Audio current time set to", audioElement.currentTime);

			audioElement.ontimeupdate = () => {
				audioCurrentTime.set(audioElement.currentTime);
				//console.log("Audio current time set to", audioElement.currentTime);
			};
		}

		const handleBeforeUnload = () => resetCycle();
		window.addEventListener('beforeunload', handleBeforeUnload);

		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key === ' ') {
				event.preventDefault();
				if ($isAudioTimelinePlaying) {
					stopPlayback();
				} else {
					startPlayback();
				}
			} else if (event.key === 'MediaPlayPause') {
				event.preventDefault();
				if ($isAudioTimelinePlaying) {
					stopPlayback();
				} else {
					startPlayback();
				}
			}
		};
		window.addEventListener('keydown', handleKeydown);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			window.removeEventListener('keydown', handleKeydown);
		};
	});
</script>



<div class="scroller_container">
	<div class="grid_console">
			<h1 class="console_title" style="text-transform: capitalize;">
				{$syncedCurrentPeriod.split('_').join(' & ')}
			</h1>
			<div class="subtitle_container" bind:this={scrollContainer}>
				<div class="sub_text_container">
					<p class="sub_text">
						{#each $dataSet as segment, index}
							<span
								id={`sub_text_${index}`}
								class={index === $syncedCurrentIndex
									? 'currentSpan'
									: index === $syncedCurrentIndex + 1
										? 'nextSpan'
										: index === $syncedCurrentIndex - 1
											? 'prevSpan'
											: ''}
							>
								{@html segment.text}
							</span>&nbsp;
						{/each}
					</p>
				</div>
			</div>
	</div>
	
	
</div>

<footer>
	<p>
		Segment N°{$syncedCurrentIndex}
	</p>

	<div class="button_container">
		<button onclick={startPlayback} class:isAudioTimelinePlaying={!$isAudioTimelinePlaying}>
			<p class="button_text">▶︎</p>
		</button>

		<button onclick={stopPlayback} class:isAudioTimelinePlaying={$isAudioTimelinePlaying}>
			<p class="button_text">❙❙</p>
		</button>

		<button onclick={resetCycle} class:isAudioTimelinePlaying={$isAudioTimelinePlaying || !$isAudioTimelinePlaying} style="background-color: var(--dominant-dark);">
			<p class="button_text">↺</p>
		</button>

		<!---<progress class="progress_bar" value={$audioCurrentTime || 0} max={$audioDuration || 100}
		></progress>-->
	</div>

	{#if audioElement}
		<div class="timestamp_container">
			{#key timestamp.hours}
				<p in:slide={{ duration: 300, axis: 'y', easing: cubicInOut }}>
					{timestamp.hours}
				</p>
			{/key}
			<p style="width: fit-content !important;">:</p>
			{#key timestamp.minutes}
				<p in:slide={{ duration: 300, axis: 'y', easing: cubicInOut }}>
					{timestamp.minutes}
				</p>
			{/key}
			<p style="width: fit-content !important;">:</p>
			{#key timestamp.secs}
				<p in:slide={{ duration: 300, axis: 'y', easing: cubicInOut }}>
					{timestamp.secs}
				</p>
			{/key}
		</div>
	{/if}
</footer>

<header>
	<p>
		Period {$syncedCurrentPeriod}
	</p>
	<p>
		From the Data&Society paper
	</p>
</header>

<audio
	bind:this={audioElement}
	src={narrationAudio}
	playsinline
>
	<track kind="captions" label="Captions" src="" srclang="en" default />
</audio>

<div class="dot_grid_container"></div>

<style>
	.button_container {
		z-index: 2;
		padding-top: var(--spacing-m);
		border-radius: var(--spacing-s);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-s);
		position: static;
		width: 20%;
	}

	progress {
		width: 100%;
		height: var(--spacing-s);
		border-radius: var(--spacing-s);
		border: none;
		overflow: hidden;
		backdrop-filter: blur(var(--spacing-s));
	}

	progress::-webkit-progress-bar {
		background-color: rgba(255, 255, 255, 0.1);
		border-radius: var(--spacing-s);
		border: 1px solid var(--dominant-dark);
		filter: blur(1px);
	}

	progress::-webkit-progress-value {
		background-color: var(--dominant-dark);
		border-radius: var(--spacing-s);
		transition: width 0.3s;
	}
	progress::-moz-progress-bar {
		background-color: var(--dominant-dark);
		border-radius: var(--spacing-s);
		transition: width 0.3s;
	}

	button {
		background-color: var(--dominant-dark);
		border: 1px solid var(--dominant-dark);
		padding: var(--spacing-s) var(--spacing-m);
		border-radius: 30px;
		color: var(--dominant-color);
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
	}

	button.isAudioTimelinePlaying {
		opacity: 1;
		pointer-events: auto;
	}

	button:active {
		transform: scale(0.9);
		transition: all 0.3s ease-in-out;
	}

	button:hover {
		transform: scale(0.95);
		transition: all 0.3s ease-in-out;
	}

	.button_text {
		font-size: 1.1rem;
		font-weight: 400;
		color: var(--dominant-light);
	}

	.scroller_container {
		width: 100%;
		height: 100%;
		padding: var(--spacing-m) 10% var(--spacing-m) 10%;
		grid-gap: var(--spacing-m);
	}

	.subtitle_container {
		background-color: transparent;
		display: flex;
		justify-content: center;
		align-items: center;
		display: flex;
		flex-direction: column;
		gap: 50px;
		width: 65%;
		overflow: scroll;
		scrollbar-width: none;
		-ms-overflow-style: none;
		z-index: 1;
		margin-top: 150px;
	}

	.grid_console {
		width: 80%;
		aspect-ratio: 4 / 3;
		max-height: 900px;
		height: auto;
		overflow: hidden;
		border: 2px solid var(--dominant-light);
		border-radius: 0px;
		background-color: var(--dominant-dark);
		z-index: 5;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		align-items: flex-end;
	}

	.console_title {
		font-family: 'Instrument Serif';
		font-size: 5;
		font-weight: 400;
		color: var(--dominant-light);
		text-align: left;
		position: absolute;
		top: -25px;
		left: -5px;
		width: 100%;
	}

	.sub_text {
		font-family: 'Instrument Sans';
		font-size: 1.8rem;
		text-justify: distribute-all-lines;
		text-align: justify;
		color: rgba(255, 255, 255, 0);
		font-weight: 400;
	}

	.sub_text_container {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		justify-content: flex-start;
		align-items: flex-start;
		padding-top: 300px;
		padding-right: var(--spacing-m);
		height: 100%;
	}

	::-webkit-scrollbar {
		display: none;
	}

	:global(.sub_text > span) {
		color: rgba(255, 255, 255, 0);
		filter: blur(3px);
		transition: all 2s ease-in-out;
	}

	:global(span.prevSpan) {
		color: rgba(255, 255, 255, 0.2);
		filter: blur(3px);
	}

	:global(span.nextSpan) {
		color: rgba(255, 255, 255, 0.2);
		filter: blur(3px);
	}

	:global(span.currentSpan) {
		color: rgba(255, 255, 255, 1);
		filter: blur(0px);
	}

	
	footer > p {
		width: max-content;
		height: fit-content;
	}

	.timestamp_container {
		width: max-content;
		display: flex;
		flex-direction: row;
		justify-content: flex-end;
		align-items: center;
		gap: 2px;
	}

	@media (min-width: 1512px) {
		.console_title {
			font-size: 8rem;
		}

		.sub_text {
			font-size: 3rem;
			line-height: 1.11;
		}
	}

	@media (max-width: 1512px) {
		.console_title {
			font-size: 6rem;
		}

		.sub_text {
			font-size: 1.9rem;
			line-height: 1.11;
		}
	}

	
</style>
