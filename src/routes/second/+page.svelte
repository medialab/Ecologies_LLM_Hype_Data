<script>
	import {
		syncedCurrentIndex,
		dataSet,
		syncedCurrentPeriod,
	} from '$lib/stores/stores';
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import Floater from '$lib/components/floater.svelte';
	import { fade } from 'svelte/transition';

	let animationFrames = new Map();

	const periods = ['september_october', 'november_december', 'january_february', 'march_april'];
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
			// Ensure z-index is strictly an integer value
			thisFloater.style.zIndex = Math.round(z).toString();
			thisFloater.style.transform = `scale(${scale})`;
			thisFloater.style.filter = `blur(${Math.max(2, (100 - z) * 0.15 + 2)}px)`;
		}

		animationFrames.set(
			index,
			requestAnimationFrame(() => animatePosition(index, thisFloater))
		);
	};

	$: if ($dataSet[$syncedCurrentIndex]) {
		const lowerText = $dataSet[$syncedCurrentIndex].text.toLowerCase();
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

	// Calculate which floaters should be rendered based on visibility logic
	$: visibleFloaters = (() => {
		const result = [];
		const currentIndex = $syncedCurrentIndex;
		const currentPeriod = $syncedCurrentPeriod;
		const limit = 50;

		if (currentIndex === -1) return result;

		const indexMin = currentIndex - limit;
		const indexMax = currentIndex + limit;

		for (let index = 0; index < $dataSet.length; index++) {
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

	$: console.log("visibleFloaters length", visibleFloaters.length);

	onMount(() => {
		syncedCurrentIndex.set(-1);
		syncedCurrentPeriod.set('september_october');
		fetchAllMediaData();

		console.log("dataSet length", $dataSet.length);
	});

	onDestroy(() => {
		animationFrames.forEach((frame) => cancelAnimationFrame(frame));
		animationFrames.clear();
	});
</script>

{#each visibleFloaters as floater}
	<div in:fade={{ duration: 500, delay: floater.index * 2 }} out:fade={{ duration: 500, delay: floater.index * 2 }}>
		<Floater
			index={floater.index}
			{animatePosition}
			{setPosition}
			media={floater.media}
			type={floater.type}
			period={floater.period}
		/>
	</div>
{/each}

<div class="dot_grid_container"></div>
