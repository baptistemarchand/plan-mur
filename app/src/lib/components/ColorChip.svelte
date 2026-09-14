<script lang="ts">
	import { getSwatch, type Color } from '$lib/domain/colors';

	let { color, classes = '' }: { color: Color; classes?: string } = $props();
</script>

<div class="border border-black rounded px-2 {getSwatch(color)} {classes}">{color}</div>
