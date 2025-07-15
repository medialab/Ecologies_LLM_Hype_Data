<script>
	let { children } = $props();
</script>

{@render children()}


<style>

@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap');
:global(*) {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: "Instrument Sans";
        user-select: none;
        -webkit-user-select: none;
        transition: all 0.5s ease-in-out;
		-webkit-tap-highlight-color: transparent;
    }

	:global(*:focus) {
		outline: none;
		box-shadow: none;
		-webkit-tap-highlight-color: transparent;
	}

	:root {
		--dominant-color: #0059FF;
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

		z-index: 0;
	}

	:global(html) {
		background-color: var(--dominant-color);
		background-image: url('/dot_bg.png');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		background-attachment: fixed;
	}

	:global(body) {
		backdrop-filter: blur(1px);
	}

	
</style>