<script lang="ts">
	let { color, size }: { color: string; size: string } = $props();
</script>

<svg fill={color} height={size} width={size} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
	<path d="M9.99951,4V2h-4V4h-3V6h1v8H12V6h1V4ZM7,13H6V6H7ZM8.99951,4h-2V3h2ZM10,13H9V6h1Z" />
</svg>
