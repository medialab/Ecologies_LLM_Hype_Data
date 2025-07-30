<script lang="ts">
	import {
		syncedCurrentIndex,
		dataSet,
		syncedCurrentPeriod,
		randomIndex,
		isPopUpShowing,
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

	let animationFrames = new Map<number, number>();
	
	const periods: string[] = ['september_october', 'november_december', 'january_february', 'march_april'];
	let periodMedia: PeriodMediaData = {};
	let mediaMappings: PeriodMapping[] = [];
	let visibleFloaters = $state<VisibleFloater[]>([]);
	let isDataLoaded = $state<boolean>(false);
	// Removed unused reactive chats variable - using data.chats directly

	//$inspect('chats', chats);

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

	const updateVisibleFloaters = (currentPeriod: string): VisibleFloater[] => {
		const result: VisibleFloater[] = [];
		const limit: number = 100;
		
		// Get current index with proper default
		const currentIndex = Math.max(0, untrack(() => $syncedCurrentIndex));
		
		// Calculate symmetric range with boundary checks
		const halfLimit = Math.floor(limit / 2);
		const indexMin: number = currentIndex - halfLimit;
		const indexMax: number = currentIndex + halfLimit;

		if (!mediaMappings || mediaMappings.length === 0) {
			console.warn("mediaMappings not yet populated");
			return result;
		}

		for (let index = indexMin; index <= indexMax; index++) {
			// Ensure index is within mediaMappings bounds
			if (index < mediaMappings.length) {
				const mediaMap: PeriodMapping = mediaMappings[index];
				if (mediaMap) {
					const mappedPeriod = currentPeriod === 'intro' ? 'november_december' : currentPeriod; //fallback
					
					// Only render floaters for the current period
					const media: string | null = mediaMap[mappedPeriod]?.url;
					const type: 'image' | 'video' | null = mediaMap[mappedPeriod]?.type;

					if (media && type) {
						// For video types, use a deterministic clip range based on index
						// This prevents videos from jumping on re-renders
						let tStart: number | undefined;
						let tEnd: number | undefined;
						if (type === 'video') {
							// Use index as seed for consistent video segments
							const seed = index % 10; // Creates 10 different possible start times
							const segmentDuration = 30; // 30 second clips
							const maxStart = 30; // More conservative assumption about video length
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
		if (!isDataLoaded) return;
		
		const currentPeriod: string = $syncedCurrentPeriod;
		
		visibleFloaters = updateVisibleFloaters(currentPeriod);
	});

	onMount(async () => {
		await fetchAllMediaData();
	});

	onDestroy(() => {
		animationFrames.forEach((frame: number) => cancelAnimationFrame(frame));
		animationFrames.clear();
	});
</script>
{#if data.chats.length > 0 && $randomIndex >= 0 && $randomIndex < data.chats.length}
	<PromptScroller conversation={data.chats[$randomIndex]} />
{/if}

{#each visibleFloaters as floater}
	{#key $syncedCurrentPeriod}
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
	{/key}
{/each}

<div class="dot_grid_container"></div>
