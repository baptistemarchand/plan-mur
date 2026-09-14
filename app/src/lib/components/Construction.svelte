<script lang="ts">
	let { color, size }: { color: string; size: string } = $props();
</script>

<svg fill={color} height={size} width={size} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
	<path
		fill-rule="evenodd"
		d="M8 1 13 12.6H3L8 1Zm-2.05 5 4.1 0-.5-1.2-3.1 0-.5 1.2Zm-1.1 3.5 6.3 0-.55-1.4-5.2 0-.55 1.4Z"
	/>
	<rect x="1.4" y="13.3" width="13.2" height="2" rx="0.6" />
</svg>
