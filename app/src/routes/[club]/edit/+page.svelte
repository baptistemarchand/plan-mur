<script lang="ts">
	import Editor from '$lib/editor/Editor.svelte';

	let { data } = $props();
</script>

{#key data.club.slug}
	<Editor club={data.club} lines={data.lines} revision={data.revision} />
{/key}
