import { getContext, setContext } from 'svelte';
import { customAlphabet } from 'nanoid';
import { MAX_ROUTES_PER_LINE } from '$lib/domain/suggestions';
import type { Club, Route } from '$lib/domain/types';

// Même alphabet et même longueur que la version Fresh : les identifiants
// existants restent valides.
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 7);

const SYNC_DELAY_MS = 3000;

export type SyncState = 'DIRTY' | 'LOADING' | 'SYNCED' | 'CONFLICT';

const firstRouteId = (line: Route[] = []): string | undefined =>
	line.find((route) => !route.deletedAt)?.id;

export class EditorState {
	lines = $state<Route[][]>([]);
	revision = $state(0);
	selectedLine = $state(0);
	selectedRouteId = $state<string | undefined>(undefined);
	syncState = $state<SyncState>('SYNCED');
	authorPopup = $state(false);
	setAtPopup = $state(false);

	readonly club: Club;
	#timer: ReturnType<typeof setTimeout> | undefined;
	// Volontairement non réactif, et doublé de syncState qui, lui, est affiché.
	// markDirty est appelé depuis un $effect : s'il lisait un état réactif, cet
	// effet dépendrait de ce que sync() réécrit et se rappellerait en boucle.
	#conflicted = false;

	constructor(club: Club, lines: Route[][], revision: number) {
		this.club = club;
		this.lines = lines;
		this.revision = revision;
		this.selectedRouteId = firstRouteId(lines[0]);
	}

	currentLine = $derived(this.lines[this.selectedLine] ?? []);
	visibleRoutes = $derived(this.currentLine.filter((route) => !route.deletedAt));
	currentRoute = $derived(this.currentLine.find((route) => route.id === this.selectedRouteId));
	get canAddLine() {
		return this.lines.length < this.club.maxLines;
	}

	canAddRoute = $derived(this.visibleRoutes.length < MAX_ROUTES_PER_LINE);

	/** Valeurs déjà saisies, proposées avant la saisie libre. */
	allSetAts = $derived(
		[...new Set(this.lines.flat().map((route) => route.setAt))].filter(Boolean).sort() as string[]
	);

	// Les saisies collectives ("a & b") ne sont pas des ouvreurs proposables.
	allAuthors = $derived(
		[...new Set(this.lines.flat().map((route) => route.author))]
			.filter(
				(author): author is string =>
					!!author && !author.includes('+') && !author.includes('/') && !author.includes('&')
			)
			.sort()
	);

	selectLine(index: number) {
		this.selectedLine = index;
		this.selectedRouteId = firstRouteId(this.lines[index]);
	}

	addLine() {
		this.lines = [...this.lines, []];
		this.selectLine(this.lines.length - 1);
	}

	addRoute() {
		const id = nanoid();
		this.lines = this.lines.map((routes, i) =>
			i === this.selectedLine
				? [
						...routes,
						{
							id,
							grade: '4a',
							color: 'blanc' as const,
							setAt: null,
							author: null,
							toRemove: false,
							toOpen: false,
							deletedAt: null
						}
					]
				: routes
		);
		this.selectedRouteId = id;
	}

	updateCurrent(update: (route: Route) => Partial<Route>) {
		this.lines = this.lines.map((routes, i) =>
			i === this.selectedLine
				? routes.map((route) =>
						route.id === this.selectedRouteId ? { ...route, ...update(route) } : route
					)
				: routes
		);
	}

	deleteCurrent() {
		this.updateCurrent(() => ({ deletedAt: new Date().toISOString() }));
		this.selectedRouteId = firstRouteId(this.lines[this.selectedLine]);
	}

	markDirty() {
		if (this.#conflicted) {
			return;
		}
		this.syncState = 'DIRTY';
		clearTimeout(this.#timer);
		this.#timer = setTimeout(() => this.sync(), SYNC_DELAY_MS);
	}

	async sync() {
		this.syncState = 'LOADING';
		const response = await fetch(`/${this.club.slug}/sync`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ lines: this.lines, revision: this.revision })
		});

		if (response.status === 409) {
			// Quelqu'un a écrit entre-temps. On arrête d'émettre plutôt que
			// d'écraser son travail : l'utilisateur recharge.
			this.#conflicted = true;
			clearTimeout(this.#timer);
			this.syncState = 'CONFLICT';
			return;
		}
		if (!response.ok) {
			this.syncState = 'DIRTY';
			return;
		}

		this.revision = ((await response.json()) as { revision: number }).revision;
		this.syncState = 'SYNCED';
	}
}

const KEY = Symbol('editor');

export const setEditorState = (state: EditorState) => setContext(KEY, state);
export const getEditorState = (): EditorState => getContext(KEY);
