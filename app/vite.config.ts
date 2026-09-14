import cloudflare from '@sveltejs/adapter-cloudflare';
import node from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

// Cloudflare est la cible de production ; la cible Node est construite en CI
// pour garder le chemin self-host vérifié, pas seulement imaginé.
const adapter = process.env.ADAPTER === 'node' ? node() : cloudflare();

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter
		})
	],
	test: {
		include: ['src/**/*.test.ts']
	}
});
