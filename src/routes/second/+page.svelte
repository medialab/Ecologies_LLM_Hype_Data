<script lang="ts">
	import {
		syncedCurrentIndex,
		dataSet,
		syncedCurrentPeriod,
		isPopUpShowing,
		randomIndex,
		chats
	} from '$lib/stores/stores';
	import { onMount, onDestroy, untrack } from 'svelte';
	import { get } from 'svelte/store';
	import Floater from '$lib/components/floater.svelte';
	import { fade } from 'svelte/transition';
	import PromptScroller from '$lib/components/prompts.svelte';

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
	}

	interface PositionData {
		x: number;
		y: number;
		z: number;
		objectDistance: number;
	}

	let animationFrames = new Map<number, number>();
	
	const periods: string[] = ['september_october', 'november_december', 'january_february', 'march_april'];
	let periodMedia: PeriodMediaData = {};
	let mediaMappings: PeriodMapping[] = [];
	let visibleFloaters = $state<VisibleFloater[]>([]);
	let isDataLoaded = $state<boolean>(false);

	// $effect(() => {
	// 	$inspect("visibleFloaters", visibleFloaters);
	// });

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
		isDataLoaded = true;
	};

	

	function buildMediaMappings(): void {
		const ds = get(dataSet);
		mediaMappings = ds.map(() => {
			const mapping: PeriodMapping = {};

			periods.forEach((p: string) => {
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

	const setPosition = (index: number, containerWidth: number = 300, containerHeight: number = 230): PositionData => {
		const padding: number = 40;

		// Create a more distributed initial positioning using a grid-like approach
		const cols: number = Math.ceil(Math.sqrt(index + 1));
		const rows: number = Math.ceil((index + 1) / cols);

		const gridX: number = (index % cols) / Math.max(1, cols - 1);
		const gridY: number = Math.floor(index / cols) / Math.max(1, rows - 1);

		// Add some randomness to break the perfect grid
		const randomOffsetX: number = (Math.random() - 0.5) * 200;
		const randomOffsetY: number = (Math.random() - 0.5) * 200;

		const x: number = gridX * (window.innerWidth - containerWidth - padding * 2) + padding + randomOffsetX;
		const y: number =
			gridY * (window.innerHeight - containerHeight - padding * 2) + padding + randomOffsetY;

		// Ensure bounds
		const boundedX: number = Math.max(padding, Math.min(window.innerWidth - containerWidth - padding, x));
		const boundedY: number = Math.max(padding, Math.min(window.innerHeight - containerHeight - padding, y));

		// Set z-index based on index, ensuring index 0 has good visibility
		const z: number = index === 0 ? 50 : index + 1;

		// Adjust scale calculation to ensure good visibility for index 0
		const baseScale: number = 0.5;
		const scaleMultiplier: number = 0.8;
		const objectDistance: number = baseScale + (z / 50) * scaleMultiplier;

		return { x: boundedX, y: boundedY, z, objectDistance };
	};

	

	$effect(() => {
		if ($dataSet[$syncedCurrentIndex]) {
			const lowerText: string = $dataSet[$syncedCurrentIndex].text.toLowerCase();
			if (lowerText.includes('september') || lowerText.includes('october')) {
				document.documentElement.style.setProperty('--dominant-color', '#97d2fb');
			} else if (lowerText.includes('november') || lowerText.includes('december')) {
				document.documentElement.style.setProperty('--dominant-color', '#fb9799');
			} else if (lowerText.includes('january') || lowerText.includes('february')) {
				document.documentElement.style.setProperty('--dominant-color', '#a8e2b4');
			} else if (lowerText.includes('march') || lowerText.includes('april')) {
				document.documentElement.style.setProperty('--dominant-color', '#e8d1f2');
			}
		}
	});

	// $effect(() => {
	// 	$inspect("syncedCurrentIndex", $syncedCurrentIndex);
	// });

	const updateVisibleFloaters = (currentPeriod: string, currentIndex: number): VisibleFloater[] => {
		const result: VisibleFloater[] = [];
		const limit: number = 50;

		// $inspect("DEBUG currentIndex:", currentIndex);
		// $inspect("DEBUG currentPeriod:", currentPeriod);
		// $inspect("DEBUG mediaMappings.length:", mediaMappings.length);

		//if (currentIndex === -1) return result;

		const indexMin: number = currentIndex - limit;
		const indexMax: number = currentIndex + limit;

		// $inspect("DEBUG indexRange:", { indexMin, indexMax, dataSetLength: $dataSet.length });

		for (let index = 0; index < $dataSet.length; index++) {
			if (index >= indexMin && index <= indexMax) {
				const mediaMap: PeriodMapping = mediaMappings[index];
				// if (index < 5) { // Debug first 5 items
				// 	$inspect(`DEBUG mediaMap[${index}]:`, mediaMap);
				// }
				if (mediaMap) {

					const mappedPeriod = currentPeriod === 'intro' ? 'september_october' : currentPeriod; //fallback
					
					// Only render floaters for the current period
					const media: string | null = mediaMap[mappedPeriod]?.url;
					const type: 'image' | 'video' | null = mediaMap[mappedPeriod]?.type;

					if (media && type) {
						// For video types, precompute a random 30-second clip range so the heavy metadata lookup isn't done in every Floater instance.
						let tStart: number | undefined;
						let tEnd: number | undefined;
						if (type === 'video') {
							const maxStart = 60; // Assumes videos are > 90 s; adjust if needed
							tStart = Math.random() * maxStart;
							tEnd = tStart + 30;
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

		// $inspect("DEBUG final result.length:", result.length);

		return result;
	};

	$effect(() => {
		if (!isDataLoaded) return;
		
		const currentPeriod: string = $syncedCurrentPeriod;
		const currentIndex: number = untrack(() => $syncedCurrentIndex);
		
		visibleFloaters = updateVisibleFloaters(currentPeriod, currentIndex);
	});

	// $inspect("visibleFloaters length", visibleFloaters.length);

	onMount(async () => {
		await fetchAllMediaData();
	});

	onDestroy(() => {
		animationFrames.forEach((frame: number) => cancelAnimationFrame(frame));
		animationFrames.clear();
	});
</script>
{#if chats.length > 0 && $randomIndex >= 0 && $randomIndex < chats.length}
	<PromptScroller conversation={chats[$randomIndex]} />
{/if}

{#each visibleFloaters as floater}
	<div in:fade={{ duration: 500, delay: floater.index * 100 }} out:fade={{ duration: 500, delay: floater.index * 100 }} style="transition: none;">
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

<div class="dot_grid_container"></div>
