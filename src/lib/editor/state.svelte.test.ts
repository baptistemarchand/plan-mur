import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Club, Route } from '$lib/domain/types';
import { EditorState } from './state.svelte';

const club: Club = { id: 1, slug: 'picetcol', name: 'Pic et col', maxLines: 4 };

const base = { setAt: null, author: null, toRemove: false, toOpen: false, deletedAt: null };

const lines = (): Route[][] => [[{ id: 'a', color: 'bleu', grade: '6a', ...base }], []];

let fetchMock: ReturnType<typeof vi.fn>;

const respond = (status: number) => Promise.resolve({ ok: status < 400, status } as Response);

/** Corps de la n-ième requête, tel qu'il est parti. */
const sent = (call: number) => JSON.parse(fetchMock.mock.calls[call][1].body);

/** Les écritures passent par une file : elles partent au tour de boucle suivant. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
	fetchMock = vi.fn(() => respond(204));
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('écriture', () => {
	it('écrit une fois par modification, et rien au montage', async () => {
		const state = new EditorState(club, lines());
		expect(fetchMock).not.toHaveBeenCalled();

		state.updateCurrent(() => ({ grade: '7a' }));
		await settle();
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('vise la voie modifiée et porte sa place au mur', async () => {
		const state = new EditorState(club, lines());
		state.updateCurrent(() => ({ grade: '7a' }));
		await settle();

		expect(fetchMock.mock.calls[0][0]).toBe('/picetcol/routes/a');
		expect(fetchMock.mock.calls[0][1].method).toBe('PUT');
		expect(sent(0)).toMatchObject({ id: 'a', grade: '7a', lineIndex: 0, position: 0 });
	});

	it("n'écrit rien quand on change de ligne ou qu'on en ajoute une", async () => {
		const state = new EditorState(club, lines());
		state.selectLine(1);
		state.addLine();
		await settle();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('écrit la voie créée', async () => {
		const state = new EditorState(club, lines());
		state.addRoute();
		await settle();
		expect(sent(0)).toMatchObject({ grade: '4a', color: 'blanc', lineIndex: 0, position: 1 });
	});

	it('écrit la date de suppression', async () => {
		const state = new EditorState(club, lines());
		state.deleteCurrent();
		await settle();
		expect(sent(0).deletedAt).toEqual(expect.any(String));
	});

	// Une rafale d'appuis part en autant de requêtes ; rien ne garantit leur
	// ordre d'arrivée, d'où la file. Sans elle, deux appuis peuvent s'inverser.
	it('enchaîne les écritures au lieu de les lancer en parallèle', async () => {
		let resolveFirst: (value: Response) => void = () => {};
		fetchMock.mockReturnValueOnce(new Promise<Response>((r) => (resolveFirst = r)));

		const state = new EditorState(club, lines());
		state.updateCurrent(() => ({ grade: '7a' }));
		state.updateCurrent(() => ({ grade: '7b' }));
		await settle();

		expect(fetchMock).toHaveBeenCalledTimes(1);

		resolveFirst({ ok: true, status: 204 } as Response);
		await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
		expect(sent(1).grade).toBe('7b');
	});
});

describe("état d'enregistrement", () => {
	it('repasse au vert quand la voie est écrite', async () => {
		const state = new EditorState(club, lines());
		state.updateCurrent(() => ({ grade: '7a' }));
		expect(state.saveState).toBe('SAVING');

		await vi.waitFor(() => expect(state.saveState).toBe('SAVED'));
	});

	it('signale un refus du serveur', async () => {
		fetchMock.mockReturnValue(respond(500));
		const state = new EditorState(club, lines());
		state.updateCurrent(() => ({ grade: '7a' }));

		await vi.waitFor(() => expect(state.saveState).toBe('FAILED'));
	});

	it('signale une coupure réseau', async () => {
		fetchMock.mockReturnValue(Promise.reject(new Error('offline')));
		const state = new EditorState(club, lines());
		state.updateCurrent(() => ({ grade: '7a' }));

		await vi.waitFor(() => expect(state.saveState).toBe('FAILED'));
	});

	it("ressort de l'échec dès qu'une écriture passe", async () => {
		fetchMock.mockReturnValueOnce(respond(500));
		const state = new EditorState(club, lines());
		state.updateCurrent(() => ({ grade: '7a' }));
		await vi.waitFor(() => expect(state.saveState).toBe('FAILED'));

		state.updateCurrent(() => ({ grade: '7b' }));
		await vi.waitFor(() => expect(state.saveState).toBe('SAVED'));
	});
});

describe('mutations', () => {
	it('ajoute une ligne et la sélectionne', () => {
		const state = new EditorState(club, lines());
		state.addLine();
		expect(state.lines).toHaveLength(3);
		expect(state.selectedLine).toBe(2);
		expect(state.selectedRouteId).toBeUndefined();
	});

	it('refuse de dépasser le plafond du club', () => {
		const state = new EditorState(club, lines());
		state.addLine();
		state.addLine();
		expect(state.canAddLine).toBe(false);
	});

	it('crée une voie complète, sans champ mort hérité de Fresh', () => {
		const state = new EditorState(club, lines());
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
		const state = new EditorState(club, [
			[
				{ id: 'a', color: 'bleu', grade: '6a', ...base },
				{ id: 'b', color: 'rouge', grade: '7a', ...base }
			]
		]);
		state.deleteCurrent();
		expect(state.selectedRouteId).toBe('b');
	});

	it('ne plante pas quand la ligne devient vide', () => {
		const state = new EditorState(club, lines());
		state.deleteCurrent();
		expect(state.selectedRouteId).toBeUndefined();
		expect(state.currentRoute).toBeUndefined();
	});

	it("n'ouvre pas les saisies collectives comme ouvreurs proposables", () => {
		const state = new EditorState(club, [
			[
				{ id: 'a', color: 'bleu', grade: '6a', ...base, author: 'seb' },
				{ id: 'b', color: 'rouge', grade: '7a', ...base, author: 'lea & max' }
			]
		]);
		expect(state.allAuthors).toEqual(['seb']);
	});
});
