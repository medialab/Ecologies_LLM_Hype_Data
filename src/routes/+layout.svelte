<script>
	let { children } = $props();

	import { syncedCurrentPeriod, syncedCurrentIndex } from '$lib/stores/stores';

	$effect(() => {
		if ($syncedCurrentIndex) {
			if ($syncedCurrentPeriod === 'intro') {
				document.documentElement.style.setProperty('--dominant-color', '#FFFFFF');
			} else if ($syncedCurrentPeriod === 'september_october') {
				document.documentElement.style.setProperty('--dominant-color', '#97d2fb');
			} else if ($syncedCurrentPeriod === 'november_december') {
				document.documentElement.style.setProperty('--dominant-color', '#fb9799');
			} else if ($syncedCurrentPeriod === 'january_february') {
				document.documentElement.style.setProperty('--dominant-color', '#a8e2b4');
			} else if ($syncedCurrentPeriod === 'march_april') {
				document.documentElement.style.setProperty('--dominant-color', '#e8d1f2');
			}
		}
	});
</script>

{@render children()}

<style>
	@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap');
	@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400..700;1,400..700&display=swap');

	:global(*) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
		font-family: 'Instrument Sans';
		user-select: none;
		-webkit-user-select: none;
		-webkit-tap-highlight-color: transparent;
	}

	:global(*:focus) {
		outline: none;
		box-shadow: none;
		-webkit-tap-highlight-color: transparent;
	}

	:root {
		--dominant-color: #ffffff;
		--dominant-light: #ffffff;
		--dominant-dark: #000000;
		--spacing-xs: 5px;
		--spacing-s: 10px;
		--spacing-m: 20px;
		--spacing-l: 40px;
		--spacing-xl: 80px;
	}

	:global(html, body) {
		margin: 0;
		padding: 0;
		user-select: none;
		scroll-behavior: none;
		overflow: hidden;
		width: 100%;
		height: 100%;

		-webkit-user-zoom: none;
		-moz-user-zoom: none;
		-ms-user-zoom: none;
		-o-user-zoom: none;

		-webkit-user-scroll: none;
		-moz-user-scroll: none;
		-ms-user-scroll: none;
		-o-user-scroll: none;

		z-index: -1;
		position: relative;
	}

	:global(picture > img, img, video) {
		object-fit: cover;
		object-position: center;
		display: block;
		width: 100%;
		height: 100%;
	}

	:global(.dot_grid_container) {
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
		z-index: -1;
		background-color: var(--dominant-color);
		background-image: url('/dot_bg.png');
	}

	:global(p) {
		font-family: 'Instrument Sans';
		font-size: 1rem;
		font-weight: 400;
		color: var(--dominant-dark);
	}

	:global(footer, header) {
		width: 100%;
		position: absolute;
		bottom: 0;
		left: 0;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: flex-end;
		color: var(--dominant-dark);
		background-color: transparent;
		padding: var(--spacing-m);
		text-transform: uppercase;
	}

	:global(header) {
		top: 0;
		bottom: unset;
	}

</style>
