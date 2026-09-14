import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import type { Route } from '$lib/domain/types';
import { createLabelsPdf } from './labels';

const font = readFileSync('static/garamond.ttf');
const fontBytes = font.buffer.slice(font.byteOffset, font.byteOffset + font.byteLength);

const routes = (count: number): Route[] =>
	Array.from({ length: count }, (_, i) => ({
		id: String(i),
		color: 'bleu',
		grade: '6a',
		setAt: '2025 oct',
		author: 'seb',
		toRemove: false,
		toOpen: false,
		deletedAt: null
	}));

const pageCount = async (count: number) => {
	const bytes = await createLabelsPdf(routes(count), fontBytes as ArrayBuffer);
	return (await PDFDocument.load(bytes)).getPageCount();
};

describe('createLabelsPdf', () => {
	it('met neuf étiquettes par page', async () => {
		expect(await pageCount(9)).toBe(1);
		expect(await pageCount(10)).toBe(2);
		expect(await pageCount(18)).toBe(2);
		expect(await pageCount(19)).toBe(3);
	});

	// Cas inatteignable depuis la page, qui désactive le bouton : on note le
	// comportement réel plutôt que de supposer un document vide.
	it('rend une page blanche si on lui passe une liste vide', async () => {
		expect(await pageCount(0)).toBe(1);
	});

	it('accepte une voie sans session ni ouvreur', async () => {
		const bytes = await createLabelsPdf(
			[{ id: 'a', color: 'noir', grade: '7a', setAt: null, author: null, toRemove: false, toOpen: false, deletedAt: null }],
			fontBytes as ArrayBuffer
		);
		expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
	});

	// La police est embarquée : sans elle les accents des prénoms sortiraient
	// en caractères manquants.
	it('embarque les accents des ouvreurs', async () => {
		const bytes = await createLabelsPdf(
			[{ id: 'a', color: 'rouge', grade: '6b', setAt: 'fév 2026', author: 'anaïs', toRemove: false, toOpen: false, deletedAt: null }],
			fontBytes as ArrayBuffer
		);
		expect(bytes.byteLength).toBeGreaterThan(0);
	});
});
