<script lang="ts">
	import {
		syncedCurrentIndex,
		dataSet,
		syncedCurrentPeriod,
		randomIndex,
		isPopUpShowing,
		isQuoteVideoPlaying,
		isQuoteAudioPlaying,
		isAudioTimelinePlaying
	} from '$lib/stores/stores';
	import { onMount, onDestroy, untrack } from 'svelte';
	import { get } from 'svelte/store';
	import Floater from '$lib/components/floater.svelte';
	import { fade } from 'svelte/transition';
	import PromptScroller from '$lib/components/prompts.svelte';
	import { floaterLimiter } from '$lib/stores/stores';

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
		date: string;
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
		'january_february',
		'march_april'
	];
	let periodMedia: PeriodMediaData = {};
	let mediaMappings: PeriodMapping[] = [];

	let isDataLoaded = $state<boolean>(false);


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

	function buildMediaMappings(): void {
		const ds = get(dataSet);
		mediaMappings = ds.map(() => {
			const mapping: PeriodMapping = {};

			periods.forEach((p: string) => {
				// Use whatever data is available for this period
				const imgs: MediaItem[] = periodMedia[p]?.images ?? [];
				const vids: MediaItem[] = periodMedia[p]?.videos ?? [];
				const list = [
					...imgs.map((img: MediaItem) => ({ url: img.default, type: 'image' as const })),
					...vids.map((vid: MediaItem) => ({ url: vid.default, type: 'video' as const }))
				];


				mapping[p] =
					list.length > 0
						? list[Math.floor(Math.random() * list.length)]
						: { url: null, type: null };
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
			gridX * (window.innerWidth - containerWidth - padding - $floaterLimiter) + padding + randomOffsetX;
			
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
		const limit: number = 200;

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
		if ($syncedCurrentIndex) {
			updateVisibleFloaters($syncedCurrentPeriod);
			//console.log(' 🤲🏼 updateVisibleFloaters called');
		}
	});

	$effect(() => {
		const convAmount = 551;

		if ($syncedCurrentIndex % 3 === 0) {
			if (
				untrack(
					() => $syncedCurrentIndex !== -1 && $syncedCurrentIndex !== 0 && $syncedCurrentIndex !== 1
				)
			) {
				if (
					untrack(() => !$isQuoteVideoPlaying && !$isQuoteAudioPlaying && $isAudioTimelinePlaying)
				) {
					untrack(() => ($randomIndex = Math.floor(Math.random() * convAmount)));

					untrack(() => isPopUpShowing.set(true));

					$inspect(
						'Effect triggered - syncedCurrentIndex:',
						untrack(() => $syncedCurrentIndex)
					);
					$inspect(
						'Effect triggered - isMultipleOf13:',
						untrack(() => $syncedCurrentIndex % 13 === 0)
					);
					$inspect(
						'Setting popuoshowing to true: ',
						untrack(() => $isPopUpShowing)
					);

					setTimeout(() => {
						isPopUpShowing.set(false);
						console.log('Setting popupshowing to false: ', untrack(() => $isPopUpShowing));
					}, 10000);

					

					/*stopSyncLoop().then(() => {
						setTimeout(() => {
							startSyncLoop();
							setTimeout(() => {
								isPopUpShowing.set(false);
								console.log('Setting popupshowing to false: ', untrack(() => $isPopUpShowing));
							}, 1000);
						}, 15000);
					});*/
				}
			}
		}
	});

	onMount(async () => {
		console.log('onMount called, current period:', $syncedCurrentPeriod);
		console.log('Dataset loaded:', get(dataSet).length, 'items');

		syncedCurrentPeriod.set('intro');
		
		await fetchAllMediaData().then(() => {
			isDataLoaded = true;
			console.log('Data loaded, isDataLoaded = true');
		});
	});

	// Reactive effect to fetch data when period changes
	$effect(() => {
		console.log('Period changed to:', $syncedCurrentPeriod, 'isDataLoaded:', isDataLoaded);
		if (isDataLoaded) {
			fetchAllMediaData();
		}
	});

	let visibleFloaters = $derived.by(() => {
		console.log('visibleFloaters recomputed, isDataLoaded:', isDataLoaded, 'period:', $syncedCurrentPeriod);
		return isDataLoaded ? updateVisibleFloaters($syncedCurrentPeriod) : [];
	});

	onDestroy(() => {
		animationFrames.forEach((frame: number) => cancelAnimationFrame(frame));
		animationFrames.clear();
	});
</script>

{#if filteredChats.length > 0 && $randomIndex >= 0 && $randomIndex < filteredChats.length}
	<PromptScroller conversation={filteredChats[$randomIndex]} />
{/if}


<div class="dot_grid_container"></div>

		{#each visibleFloaters as floater}
		{#key $syncedCurrentPeriod}
			<div
				in:fade={{ duration: 500, delay: floater.index * 25 }}
				out:fade={{ duration: 500, delay: floater.index * 25 }}
			>	
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
		{/key}
	{/each}

<style>
	
</style>