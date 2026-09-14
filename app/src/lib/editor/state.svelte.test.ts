import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Club, Route } from '$lib/domain/types';
import { EditorState } from './state.svelte';

const club: Club = { id: 1, slug: 'picetcol', name: 'Pic et col', lineCount: 2, maxLines: 4 };

const base = { setAt: null, author: null, toRemove: false, toOpen: false, deletedAt: null };

const lines = (): Route[][] => [[{ id: 'a', color: 'bleu', grade: '6a', ...base }], []];

let fetchMock: ReturnType<typeof vi.fn>;

const respond = (status: number, revision = 1) =>
	Promise.resolve({
		ok: status < 400,
		status,
		json: () => Promise.resolve({ revision })
	} as Response);

beforeEach(() => {
	vi.useFakeTimers();
	fetchMock = vi.fn(() => respond(200, 1));
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('planification des écritures', () => {
	it('écrit une seule fois par modification, puis se tait', async () => {
		const state = new EditorState(club, lines(), 0);
		state.markDirty();
		await vi.advanceTimersByTimeAsync(10_000);
		expect(fetchMock).toHaveBeenCalledTimes(1);

		// Une synchro terminée ne doit jamais en replanifier une autre.
		await vi.advanceTimersByTimeAsync(60_000);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('regroupe des modifications rapprochées en une écriture', async () => {
		const state = new EditorState(club, lines(), 0);
		state.markDirty();
		await vi.advanceTimersByTimeAsync(500);
		state.markDirty();
		await vi.advanceTimersByTimeAsync(10_000);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});

describe('sync', () => {
	it('avance la révision sur succès', async () => {
		const state = new EditorState(club, lines(), 4);
		fetchMock.mockReturnValue(respond(200, 5));
		await state.sync();
		expect(state.revision).toBe(5);
		expect(state.syncState).toBe('SYNCED');
	});

	it("passe en conflit sur 409 et cesse d'émettre", async () => {
		const state = new EditorState(club, lines(), 4);
		fetchMock.mockReturnValue(respond(409));
		await state.sync();
		expect(state.syncState).toBe('CONFLICT');
		expect(state.revision).toBe(4);

		state.markDirty();
		await vi.advanceTimersByTimeAsync(10_000);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('reste sale sur erreur serveur pour laisser une chance au coup suivant', async () => {
		const state = new EditorState(club, lines(), 4);
		fetchMock.mockReturnValue(respond(500));
		await state.sync();
		expect(state.syncState).toBe('DIRTY');
	});
});

describe('mutations', () => {
	it('ajoute une ligne et la sélectionne', () => {
		const state = new EditorState(club, lines(), 0);
		state.addLine();
		expect(state.lines).toHaveLength(3);
		expect(state.selectedLine).toBe(2);
		expect(state.selectedRouteId).toBeUndefined();
	});

	it('refuse de dépasser le plafond du club', () => {
		const state = new EditorState(club, lines(), 0);
		state.addLine();
		state.addLine();
		expect(state.canAddLine).toBe(false);
	});

	it('sélectionne la voie créée', () => {
		const state = new EditorState(club, lines(), 0);
		state.addRoute();
		expect(state.currentRoute).toMatchObject({ grade: '4a', color: 'blanc' });
	});

	it('crée une voie complète, sans champ mort hérité de Fresh', () => {
		const state = new EditorState(club, lines(), 0);
		state.addRoute();
		expect(state.currentRoute).toEqual({
			id: expect.any(String),
			grade: '4a',
			color: 'blanc',
			setAt: null,
			author: null,
			toRemove: false,
			toOpen: false,
			deletedAt: null
		});
	});

	it('retombe sur une voie vivante après suppression', () => {
		const state = new EditorState(
			club,
			[[{ id: 'a', color: 'bleu', grade: '6a', ...base }, { id: 'b', color: 'rouge', grade: '7a', ...base }]],
			0
		);
		state.deleteCurrent();
		expect(state.selectedRouteId).toBe('b');
	});

	it('ne plante pas quand la ligne devient vide', () => {
		const state = new EditorState(club, lines(), 0);
		state.deleteCurrent();
		expect(state.selectedRouteId).toBeUndefined();
		expect(state.currentRoute).toBeUndefined();
	});

	it("n'ouvre pas les saisies collectives comme ouvreurs proposables", () => {
		const state = new EditorState(
			club,
			[
				[
					{ id: 'a', color: 'bleu', grade: '6a', ...base, author: 'seb' },
					{ id: 'b', color: 'rouge', grade: '7a', ...base, author: 'lea & max' }
				]
			],
			0
		);
		expect(state.allAuthors).toEqual(['seb']);
	});
});
