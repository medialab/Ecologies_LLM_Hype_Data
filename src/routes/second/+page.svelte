<script>
	import {
		syncedCurrentIndex,
		dataSet,
		syncedCurrentPeriod,
		entitiesLimit
	} from '$lib/stores/stores';
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import Floater from '$lib/components/floater.svelte';

	let animationFrames = new Map();

	const periods = ['september', 'october_november', 'december_january', 'february', 'march'];
	let periodMedia = {};
	let mediaMappings = [];

	const fetchAllMediaData = async () => {
		const promises = periods.map(async (period) => {
			const response = await fetch(`/second?period=${period}`);
			if (!response.ok) {
				return { period, data: { images: [], videos: [] } };
			}
			const data = await response.json();
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

	function buildMediaMappings() {
		const ds = get(dataSet);
		mediaMappings = ds.map(() => {
			const mapping = {};
			periods.forEach((p) => {
				const imgs = periodMedia[p]?.images ?? [];
				const vids = periodMedia[p]?.videos ?? [];
				const list = [
					...imgs.map((img) => ({ url: img.default, type: 'image' })),
					...vids.map((vid) => ({ url: vid.default, type: 'video' }))
				];
				mapping[p] =
					list.length > 0
						? list[Math.floor(Math.random() * list.length)]
						: { url: null, type: null };
			});
			return mapping;
		});
	}

	const setPosition = (index, containerWidth = 300, containerHeight = 230) => {
		const padding = 40;

		// Create a more distributed initial positioning using a grid-like approach
		const cols = Math.ceil(Math.sqrt(index + 1));
		const rows = Math.ceil((index + 1) / cols);

		const gridX = (index % cols) / Math.max(1, cols - 1);
		const gridY = Math.floor(index / cols) / Math.max(1, rows - 1);

		// Add some randomness to break the perfect grid
		const randomOffsetX = (Math.random() - 0.5) * 200;
		const randomOffsetY = (Math.random() - 0.5) * 200;

		const x = gridX * (window.innerWidth - containerWidth - padding * 2) + padding + randomOffsetX;
		const y =
			gridY * (window.innerHeight - containerHeight - padding * 2) + padding + randomOffsetY;

		// Ensure bounds
		const boundedX = Math.max(padding, Math.min(window.innerWidth - containerWidth - padding, x));
		const boundedY = Math.max(padding, Math.min(window.innerHeight - containerHeight - padding, y));

		// Set z-index based on index, ensuring index 0 has good visibility
		const z = index === 0 ? 50 : index + 1;

		// Adjust scale calculation to ensure good visibility for index 0
		const baseScale = 0.5;
		const scaleMultiplier = 0.8;
		const objectDistance = baseScale + (z / 50) * scaleMultiplier;

		return { x: boundedX, y: boundedY, z, objectDistance };
	};

	const animatePosition = (index, thisFloater) => {
		if (thisFloater && index !== $syncedCurrentIndex) {
			const time = performance.now() * 0.005;
			const uniqueOffset = index * 0.7;

			const baseAmplitudeX = window.innerWidth * 0.3;
			const baseAmplitudeY = window.innerHeight * 0.3;
			const baseAmplitudeZ = 30;

			const waveSpeedX = 0.001 * (1 + (index % 3) * 0.5);
			const waveSpeedY = 0.001 * (1 + (index % 4) * 0.3);
			const waveSpeedZ = 0.001 * (1 + (index % 5) * 0.2);

			const waveX = Math.sin(time * waveSpeedX + uniqueOffset) * baseAmplitudeX;
			const waveY = Math.cos(time * waveSpeedY + uniqueOffset * 1.3) * baseAmplitudeY;
			const waveZ = Math.sin(time * waveSpeedZ + uniqueOffset * 1.8) * baseAmplitudeZ;

			const centerOffsetX = ((index % 7) - 3) * 100;
			const centerOffsetY = ((index % 5) - 2) * 80;

			const centerX = window.innerWidth / 2 + centerOffsetX;
			const centerY = window.innerHeight / 2 + centerOffsetY;
			const centerZ = 50;

			const secondaryX = Math.sin(time * 0.15 + uniqueOffset * 0.8) * 80;
			const secondaryY = Math.cos(time * 0.12 + uniqueOffset * 1.2) * 60;

			const newX = centerX + waveX + secondaryX;
			const newY = centerY + waveY + secondaryY;
			const newZ = centerZ + waveZ + Math.sin(time * 0.08 + uniqueOffset) * 25;

			const padding = 20;
			const containerWidth = 300;
			const containerHeight = 230;

			const x = Math.max(padding, Math.min(window.innerWidth - containerWidth - padding, newX));
			const y = Math.max(padding, Math.min(window.innerHeight - containerHeight - padding, newY));
			const z = Math.max(0, Math.min(100, newZ));

			const roundedZ = Math.round(z);

			const scale = 0.2 + (z / 100) * 0.8;

			thisFloater.style.left = x + 'px';
			thisFloater.style.top = y + 'px';
			thisFloater.style.zIndex = Math.floor(roundedZ);
			thisFloater.style.transform = `scale(${scale})`;
			thisFloater.style.filter = `blur(${Math.max(2, (100 - z) * 0.15 + 2)}px)`;
		}

		animationFrames.set(
			index,
			requestAnimationFrame(() => animatePosition(index, thisFloater))
		);
	};

	$: if ($dataSet[$syncedCurrentIndex]) {
		if ($dataSet[$syncedCurrentIndex].text.toLowerCase().includes('september') === true) {
			document.documentElement.style.setProperty('--dominant-color', '#97d2fb');
		} else if ($dataSet[$syncedCurrentIndex].text.toLowerCase().includes('october') === true) {
			document.documentElement.style.setProperty('--dominant-color', '#fb9799');
		} else if ($dataSet[$syncedCurrentIndex].text.toLowerCase().includes('december') === true) {
			document.documentElement.style.setProperty('--dominant-color', '#a8e2b4');
		} else if ($dataSet[$syncedCurrentIndex].text.toLowerCase().includes('february') === true) {
			document.documentElement.style.setProperty('--dominant-color', '#e8d1f2');
		} else if ($dataSet[$syncedCurrentIndex].text.toLowerCase().includes('april') === true) {
			document.documentElement.style.setProperty('--dominant-color', '#ffce93');
		}
	}

	// Calculate which floaters should be rendered based on visibility logic
	$: visibleFloaters = (() => {
		const result = [];
		const currentIndex = $syncedCurrentIndex;
		const currentPeriod = $syncedCurrentPeriod;
		const limit = $entitiesLimit;

		if (currentIndex === -1) return result;

		const indexMin = currentIndex - limit;
		const indexMax = currentIndex + limit;

		for (let index = 0; index < $dataSet.length; index++) {
			// Only include floaters within the entities limit range
			if (index >= indexMin && index <= indexMax) {
				const mediaMap = mediaMappings[index];
				if (mediaMap) {
					// Only render floaters for the current period
					const media = mediaMap[currentPeriod]?.url;
					const type = mediaMap[currentPeriod]?.type;

					if (media) {
						result.push({
							index,
							media,
							type,
							period: currentPeriod
						});
					}
				}
			}
		}

		//console.log(result);

		return result;
	})();

	onMount(() => {
		syncedCurrentIndex.set(-1);
		syncedCurrentPeriod.set('september');
		fetchAllMediaData();
	});

	onDestroy(() => {
		animationFrames.forEach((frame) => cancelAnimationFrame(frame));
		animationFrames.clear();
	});
</script>

{#each visibleFloaters as floater}
	<Floater
		index={floater.index}
		{animatePosition}
		{setPosition}
		media={floater.media}
		type={floater.type}
		period={floater.period}
	/>
{/each}

<div class="dot_grid_container"></div>
