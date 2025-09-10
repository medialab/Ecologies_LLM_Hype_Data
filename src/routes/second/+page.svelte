<script lang="ts">
	import {
		syncedCurrentIndex,
		dataSet,
		syncedCurrentPeriod,
		randomIndex,
		isPopUpShowing,
		isQuoteVideoPlaying,
		isQuoteAudioPlaying,
		isAudioTimelinePlaying,
		rightClicked
	} from '$lib/stores/stores';
	import { onMount, onDestroy, untrack } from 'svelte';
	import { get } from 'svelte/store';
	import Floater from '$lib/components/floater.svelte';
	import { fade } from 'svelte/transition';
	import PromptScroller from '$lib/components/prompts.svelte';
	import { floaterLimiter } from '$lib/stores/stores';

	$inspect(rightClicked);

	interface MediaItem {
		default: string;
	}

	interface MediaData {
		images: MediaItem[];
		videos: MediaItem[];
	}

	interface PeriodMediaData {
		[key: string]: MediaData;
	}

	interface MediaMapping {
		url: string | null;
		type: 'image' | 'video' | null;
	}

	interface PeriodMapping {
		[key: string]: MediaMapping;
	}

	interface VisibleFloater {
		index: number;
		media: string;
		type: 'image' | 'video';
		period: string;
		tStart?: number;
		tEnd?: number;
		width?: number;
		height?: number;
	}

	interface PositionData {
		x: number;
		y: number;
		z: number;
		objectDistance: number;
	}

	interface ChatData {
		title: string;
		id: string;
		author: string;
		conversation: Array<{
			prompt: string;
		}>;
	}

	const { data } = $props<{ data: { chats: ChatData[] } }>();

	const filteredChats = $derived(
		data.chats.filter((chat) => chat.conversation && chat.conversation.length > 0)
	);

	let animationFrames = new Map<number, number>();

	const periods: string[] = [
		'intro',
		'september_october',
		'november_december',
		'january',
		'february',
		'march_april'
	];
	let periodMedia: PeriodMediaData = {};
	// Make mediaMappings reactive so derived floaters recompute on updates
	let mediaMappings = $state<PeriodMapping[]>([]);

	let isDataLoaded = $state<boolean>(false);

	// New: fetch a single period (lazy/on-demand)
	const loaded = new Set<string>();

	const fetchPeriod = async (period: string): Promise<void> => {
		if (!period || loaded.has(period)) return;

		const response = await fetch(`/second?period=${period}`);
		if (!response.ok) {
			periodMedia[period] = { images: [], videos: [] };
			loaded.add(period);
			buildMediaMappings();
			return;
		}

		const data: MediaData = await response.json();
		periodMedia[period] = {
			images: data.images || [],
			videos: data.videos || []
		};
		loaded.add(period);
		buildMediaMappings();
	};

	const switchReadiness = () => {
		rightClicked.set(!$rightClicked);
	};

	/*
	// Old: fetch all periods upfront (commented out per request)
	const fetchAllMediaData = async (): Promise<void> => {
		const promises = periods.map(async (period: string) => {
			const response = await fetch(`/second?period=${period}`);
			if (!response.ok) {
				return { period, data: { images: [], videos: [] } };
			}
			const data: MediaData = await response.json();
			return { period, data };
		});

		const results = await Promise.all(promises);

		results.forEach(({ period, data }) => {
			periodMedia[period] = {
				images: data.images || [],
				videos: data.videos || []
			};
		});

		buildMediaMappings();
	};
	*/

	function buildMediaMappings(): void {
		const ds = get(dataSet);

		mediaMappings = ds.map((_, dsIndex) => {
			const mapping: PeriodMapping = {};

			periods.forEach((p: string) => {
				const imgs: MediaItem[] = periodMedia[p]?.images ?? [];
				const vids: MediaItem[] = periodMedia[p]?.videos ?? [];

				if (vids.length > 0) {
					if (dsIndex % 2 === 0) {
						const imgIndex = dsIndex / 2;
						if (imgIndex < imgs.length) {
							mapping[p] = { url: imgs[imgIndex].default, type: 'image' };
						} else {
							const vidIndex = Math.floor(Math.random() * vids.length);
							mapping[p] = { url: vids[vidIndex].default, type: 'video' };
						}
					} else {
						const vidIndex = Math.floor(Math.random() * vids.length);
						mapping[p] = { url: vids[vidIndex].default, type: 'video' };
					}
				} else {
					if (dsIndex < imgs.length) {
						mapping[p] = { url: imgs[dsIndex].default, type: 'image' };
					} else {
						mapping[p] = { url: null, type: null };
					}
				}
			});
			return mapping;
		});
	}

	const setPosition = (
		index: number,
		containerWidth: number = 100,
		containerHeight: number = 50
	): PositionData => {
		const padding: number = 40;

		const cols: number = Math.ceil(Math.sqrt(index + 1));
		const rows: number = Math.ceil((index + 1) / cols);

		const gridX: number = (index % cols) / Math.max(1, cols - 1);
		const gridY: number = Math.floor(index / cols) / Math.max(1, rows - 1);

		const randomOffsetX: number = (Math.random() - 0.5) * 200;
		const randomOffsetY: number = (Math.random() - 0.5) * 200;

		const x: number =
			gridX * (window.innerWidth - containerWidth - padding - $floaterLimiter) +
			padding +
			randomOffsetX;

		const y: number =
			gridY * (window.innerHeight - containerHeight - padding * 2) + padding + randomOffsetY;

		const boundedX: number = Math.max(
			padding,
			Math.min(window.innerWidth - containerWidth - $floaterLimiter, x)
		);

		const boundedY: number = Math.max(
			padding,
			Math.min(window.innerHeight - containerHeight - padding, y)
		);

		const z: number = index === 0 ? 50 : index + 1;

		const baseScale: number = 0.5;
		const scaleMultiplier: number = 0.8;
		const objectDistance: number = baseScale + (z / 50) * scaleMultiplier;

		return { x: boundedX, y: boundedY, z, objectDistance };
	};

	const updateVisibleFloaters = (currentPeriod: string): VisibleFloater[] => {
		const result: VisibleFloater[] = [];
		const limit: number = 300;

		const currentIndex = Math.max(
			0,
			untrack(() => $syncedCurrentIndex)
		);

		const halfLimit = Math.floor(limit / 2);
		const indexMin: number = Math.max(0, currentIndex - halfLimit);
		const indexMax: number = currentIndex + halfLimit;

		if (!mediaMappings || mediaMappings.length === 0) {
			console.warn('mediaMappings not yet populated');
			return result;
		}

		for (let index = indexMin; index <= indexMax; index++) {
			if (index < mediaMappings.length) {
				const mediaMap: PeriodMapping = mediaMappings[index];
				if (mediaMap) {
					// Use the actual current period, no mapping needed
					const media: string | null = mediaMap[currentPeriod]?.url;
					const type: 'image' | 'video' | null = mediaMap[currentPeriod]?.type;

					if (media && type) {
						let tStart: number | undefined;
						let tEnd: number | undefined;

						if (type === 'video') {
							const seed = index % 10;
							const segmentDuration = 30;
							const maxStart = 30;
							tStart = (seed / 10) * maxStart;
							tEnd = tStart + segmentDuration;
						}

						result.push({
							index,
							media,
							type,
							period: currentPeriod,
							tStart,
							tEnd
						});
					}
				}
			}
		}

		return result;
	};

	$effect(() => {
		if ($syncedCurrentIndex % 7 === 0) {
			if (
				untrack(
					() => $syncedCurrentIndex !== -1 && $syncedCurrentIndex !== 0 && $syncedCurrentIndex !== 1
				)
			) {
				if (
					untrack(() => !$isQuoteVideoPlaying && !$isQuoteAudioPlaying && $isAudioTimelinePlaying)
				) {
					const convAmount = filteredChats.length;
					if (convAmount === 0) return;

					const newRandomIndex = Math.floor(Math.random() * convAmount);
					untrack(() => ($randomIndex = newRandomIndex));

					const currentChat = filteredChats[newRandomIndex];
					const promptCount = currentChat.conversation.length;
					const timeoutDuration = promptCount * 2000;

					untrack(() => isPopUpShowing.set(true));

					setTimeout(() => {
						isPopUpShowing.set(false);
						console.log(
							'Setting popupshowing to false: ',
							untrack(() => $isPopUpShowing)
						);
					}, timeoutDuration);
				}
			}
		}
	});

	onMount(async () => {
		console.log('onMount called, current period:', $syncedCurrentPeriod);
		console.log('Dataset loaded:', get(dataSet).length, 'items');

		await fetchPeriod(get(syncedCurrentPeriod));
		isDataLoaded = true;
		console.log('Initial period loaded, isDataLoaded = true');
		if ($rightClicked) {
			switchReadiness();
		}
	});

	// Lazy-load any newly selected period on demand
	$effect(() => {
		const current = $syncedCurrentPeriod;
		fetchPeriod(current);
	});

	$effect(() => {
		if ($syncedCurrentPeriod === true) {
			isPopUpShowing.set(false);
		}
	});

	const introFloaters = $derived(isDataLoaded ? updateVisibleFloaters('intro') : []);
	const septemberOctoberFloaters = $derived(
		isDataLoaded ? updateVisibleFloaters('september_october') : []
	);
	const novemberDecemberFloaters = $derived(
		isDataLoaded ? updateVisibleFloaters('november_december') : []
	);
	const januaryFloaters = $derived(isDataLoaded ? updateVisibleFloaters('january') : []);
	const februaryFloaters = $derived(isDataLoaded ? updateVisibleFloaters('february') : []);
	const marchAprilFloaters = $derived(isDataLoaded ? updateVisibleFloaters('march_april') : []);

	onDestroy(() => {
		animationFrames.forEach((frame: number) => cancelAnimationFrame(frame));
		animationFrames.clear();
	});
</script>

{#if filteredChats.length > 0 && $randomIndex >= 0 && $randomIndex < filteredChats.length}
	<PromptScroller conversation={filteredChats[$randomIndex]} />
{/if}

{#if $syncedCurrentPeriod === 'intro'}
	<section in:fade={{ duration: 5000 }} out:fade={{ duration: 1000 }}>
		{#each introFloaters as floater (floater.index)}
			<div>
				<Floater
					index={floater.index}
					{setPosition}
					media={floater.media}
					type={floater.type}
					period={floater.period}
					tStart={floater.tStart}
					tEnd={floater.tEnd}
				/>
			</div>
		{/each}
	</section>
{/if}
{#if $syncedCurrentPeriod === 'september_october'}
	<section in:fade={{ duration: 5000 }} out:fade={{ duration: 1000 }}>
		{#each septemberOctoberFloaters as floater (floater.index)}
			<div>
				<Floater
					index={floater.index}
					{setPosition}
					media={floater.media}
					type={floater.type}
					period={floater.period}
					tStart={floater.tStart}
					tEnd={floater.tEnd}
				/>
			</div>
		{/each}
	</section>
{/if}
{#if $syncedCurrentPeriod === 'november_december'}
	<section in:fade={{ duration: 5000 }} out:fade={{ duration: 1000 }}>
		{#each novemberDecemberFloaters as floater (floater.index)}
			<div>
				<Floater
					index={floater.index}
					{setPosition}
					media={floater.media}
					type={floater.type}
					period={floater.period}
					tStart={floater.tStart}
					tEnd={floater.tEnd}
				/>
			</div>
		{/each}
	</section>
{/if}
{#if $syncedCurrentPeriod === 'january'}
	<section in:fade={{ duration: 5000 }} out:fade={{ duration: 1000 }}>
		{#each januaryFloaters as floater (floater.index)}
			<div>
				<Floater
					index={floater.index}
					{setPosition}
					media={floater.media}
					type={floater.type}
					period={floater.period}
					tStart={floater.tStart}
					tEnd={floater.tEnd}
				/>
			</div>
		{/each}
	</section>
{/if}
{#if $syncedCurrentPeriod === 'february'}
	<section in:fade={{ duration: 5000 }} out:fade={{ duration: 1000 }}>
		{#each februaryFloaters as floater (floater.index)}
			<div>
				<Floater
					index={floater.index}
					{setPosition}
					media={floater.media}
					type={floater.type}
					period={floater.period}
					tStart={floater.tStart}
					tEnd={floater.tEnd}
				/>
			</div>
		{/each}
	</section>
{/if}
{#if $syncedCurrentPeriod === 'march_april'}
	<section in:fade={{ duration: 5000 }} out:fade={{ duration: 1000 }}>
		{#each marchAprilFloaters as floater (floater.index)}
			<div>
				<Floater
					index={floater.index}
					{setPosition}
					media={floater.media}
					type={floater.type}
					period={floater.period}
					tStart={floater.tStart}
					tEnd={floater.tEnd}
				/>
			</div>
		{/each}
	</section>
{/if}

<button onclick={switchReadiness} class="right_clicked_button" class:isRightClicked={$rightClicked}>
	<p class="button_text">[Ready to start ?]</p>
</button>

<div class="dot_grid_container"></div>

<div class="indicators_container">
	<button>
		<p class="button_text">
			[Audio Timeline is: {$isAudioTimelinePlaying ? 'Playing' : 'Not Playing'}]
		</p>
	</button>

	<button>
		<p class="button_text">[Video quote is: {$isQuoteVideoPlaying ? 'Playing' : 'Not playing'}]</p>
	</button>
</div>

<style>
	.indicators_container {
		display: flex;
		flex-direction: row;
		gap: var(--spacing-s);
		position: absolute;

		bottom: 0px;
		left: 0px;
		width: 100%;

		z-index: 50;
		padding: var(--spacing-m);
		cursor: pointer;

		pointer-events: auto !important;
		justify-content: space-between;
		align-items: center;
		column-gap: var(--spacing-m);
		color: var(--dominant-dark);
	}

	.right_clicked_button {
		opacity: 1;
		z-index: 400;
		position: absolute;
		right: 50%;
		transform: scale(1) translateY(0px) translateX(50%);
		bottom: 0px;
		padding: var(--spacing-m);
		width: fit-content;
		pointer-events: auto !important;
		background-color: transparent;
	}

	.indicators_container button {
		opacity: 1;
	}

	.right_clicked_button:active {
		transform: scale(0.9) translateY(0px) translateX(50%);
		transition: all 0.3s ease-in-out;
	}

	button.isRightClicked {
		transform: scale(0.9) translateY(400px) translateX(50%);
		transition: all 0.3s ease-in-out;
	}
</style>
