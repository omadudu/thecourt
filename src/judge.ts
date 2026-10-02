export type Judgment = {
	score: number;
	verdict: string;
	words: number;
};

export function judgeBrief(text: string | null): Judgment {
	if (text === null || text.trim().length === 0) {
		return {
			score: 0,
			verdict: "No brief.md on main. The attempt has nothing to judge.",
			words: 0,
		};
	}

	const words = text.trim().split(/\s+/).length;
	const score = Math.min(100, words);
	return {
		score,
		verdict: `Brief has ${words} words. The score is that count, capped at 100.`,
		words,
	};
}
