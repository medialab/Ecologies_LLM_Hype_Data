<script>
	let { children } = $props();
</script>

{@render children()}


<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		user-select: none;
		scroll-behavior: none;
		overflow: hidden;
		width: 100vw;
		height: 100vh;

		-webkit-user-zoom: none;
		-moz-user-zoom: none;
		-ms-user-zoom: none;
		-o-user-zoom: none;

		-webkit-user-scroll: none;
		-moz-user-scroll: none;
		-ms-user-scroll: none;
		-o-user-scroll: none;

	}
</style>