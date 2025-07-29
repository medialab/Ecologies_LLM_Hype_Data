<script>
	let { children } = $props();

	import { syncedCurrentPeriod, syncedCurrentIndex } from '$lib/stores/stores';

</script>

{@render children()}
