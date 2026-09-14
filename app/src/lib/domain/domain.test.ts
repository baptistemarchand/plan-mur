import { describe, expect, it } from 'vitest';
import { getAuthors, openedLines, plannedRoutes, withLineIndex } from './routes';
import { bucketize, byCountDesc, gradeBucket, sessionSortKey, UNKNOWN_SESSION } from './stats';
import { getSuggestions } from './suggestions';
import type { Route } from './types';

const route = (over: Partial<Route> = {}): Route => ({
	id: 'a',
	color: 'bleu',
	grade: '6a',
	...over
});

describe('getAuthors', () => {
	it('rend une liste vide sans ouvreur', () => {
		expect(getAuthors(route())).toEqual([]);
	});

	it('rend un seul ouvreur tel quel', () => {
		expect(getAuthors(route({ author: 'seb' }))).toEqual(['seb']);
	});

	it('découpe sur &', () => {
		expect(getAuthors(route({ author: 'seb & lea' }))).toEqual(['seb ', ' lea']);
	});

	it('découpe sur + à défaut de &', () => {
		expect(getAuthors(route({ author: 'seb + lea' }))).toEqual(['seb ', ' lea']);
	});

	it('privilégie & quand les deux séparateurs sont présents', () => {
		expect(getAuthors(route({ author: 'seb & lea + max' }))).toEqual(['seb ', ' lea + max']);
	});
});

describe('gradeBucket', () => {
	it('regroupe toutes les cotations en 4', () => {
		expect(gradeBucket('4a')).toBe('4');
		expect(gradeBucket('4c+')).toBe('4');
	});

	it('ignore le + au-dessus de 4', () => {
		expect(gradeBucket('7a+')).toBe('7a');
		expect(gradeBucket('6b')).toBe('6b');
	});
});

describe('sessionSortKey', () => {
	it('trie les sessions par année', () => {
		expect(sessionSortKey('2021 oct')).toBeLessThan(sessionSortKey('2025 oct'));
	});

	it('place les sessions inconnues en tête', () => {
		expect(sessionSortKey(UNKNOWN_SESSION)).toBe(-Infinity);
	});
});

describe('bucketize', () => {
	const routes = withLineIndex([
		[route({ id: '1', color: 'bleu' }), route({ id: '2', color: 'rouge' })],
		[route({ id: '3', color: 'bleu' })]
	]);

	it('regroupe et trie par effectif décroissant', () => {
		const buckets = bucketize(routes, {
			getBuckets: (r) => [r.color],
			sortBy: byCountDesc
		});
		expect(buckets.map((b) => [b.label, b.items.length])).toEqual([
			['bleu', 2],
			['rouge', 1]
		]);
	});

	it('range une voie dans plusieurs seaux quand elle a plusieurs ouvreurs', () => {
		const buckets = bucketize([route({ author: 'seb & lea' })], {
			getBuckets: (r) => getAuthors(r).map((a) => a.trim())
		});
		expect(buckets.map((b) => b.label)).toEqual(['lea', 'seb']);
	});
});

describe('openedLines et plannedRoutes', () => {
	const lines = [
		[route({ id: '1' }), route({ id: '2', toOpen: true })],
		[route({ id: '3', toOpen: true, deleted: true })]
	];

	it('retire les voies planifiées du plan du mur', () => {
		expect(openedLines(lines).flat().map((r) => r.id)).toEqual(['1']);
	});

	// Volontaire : les découpages par session et par ouvreur.euse montrent
	// l'historique, une voie démontée reste au crédit de qui l'a ouverte.
	it('garde les voies supprimées, que chaque appelant filtre ou non', () => {
		const withDeleted = [[route({ id: '1' }), route({ id: '2', deleted: true })]];
		expect(openedLines(withDeleted).flat().map((r) => r.id)).toEqual(['1', '2']);
	});

	it('ne planifie pas les voies supprimées', () => {
		expect(plannedRoutes(lines).map((r) => r.id)).toEqual(['2']);
	});

	it("garde la ligne d'origine de chaque voie planifiée", () => {
		expect(plannedRoutes(lines)[0].lineIndex).toBe(0);
	});
});

describe('getSuggestions', () => {
	const linesOf = (...colorsPerLine: Route['color'][][]) =>
		colorsPerLine.map((colors, i) => colors.map((color, j) => route({ id: `${i}-${j}`, color })));

	it('exclut la couleur de la ligne et de ses voisines', () => {
		const suggestions = getSuggestions(linesOf([], ['bleu'], []));
		const bleu = suggestions.find((s) => s.color === 'bleu');
		expect(bleu).toBeUndefined();
	});

	it('propose une couleur absente du voisinage', () => {
		const suggestions = getSuggestions(linesOf([], ['bleu'], [], []));
		const rouge = suggestions.find((s) => s.color === 'rouge');
		expect(rouge?.lines).toEqual([1, 2, 3, 4]);
	});

	it('numérote les lignes à partir de 1', () => {
		const suggestions = getSuggestions(linesOf(['bleu'], [], []));
		expect(suggestions.find((s) => s.color === 'bleu')?.lines).toEqual([3]);
	});

	it('écarte une ligne pleine à cinq voies', () => {
		const full = linesOf(['rouge', 'vert', 'jaune', 'orange', 'gris']);
		expect(getSuggestions(full).every((s) => !s.lines.includes(1))).toBe(true);
	});

	it('accepte encore une ligne à quatre voies', () => {
		const four = linesOf(['rouge', 'vert', 'jaune', 'orange']);
		expect(getSuggestions(four).find((s) => s.color === 'bleu')?.lines).toEqual([1]);
	});

	// Une voie supprimée n'est plus au mur : elle n'occupe pas la ligne.
	it("ne compte pas les voies supprimées dans l'occupation", () => {
		const lines = [
			[
				route({ id: '1', color: 'rouge' }),
				route({ id: '2', color: 'vert' }),
				route({ id: '3', color: 'jaune' }),
				route({ id: '4', color: 'orange' }),
				route({ id: '5', color: 'gris', deleted: true })
			]
		];
		expect(getSuggestions(lines).find((s) => s.color === 'bleu')?.lines).toEqual([1]);
	});

	it('suppose les voies à démonter déjà démontées', () => {
		const lines = [[route({ color: 'bleu', toRemove: true })]];
		expect(getSuggestions(lines).find((s) => s.color === 'bleu')?.lines).toEqual([1]);
	});
});
