import type { Category, Classification, Classifier, FilterMode } from '../../types';
import { normalize } from './normalize';
import { RULES, type Rule } from './rules';

export const THRESHOLDS: Record<FilterMode, number> = { soft: 5, broad: 3 };

interface Compiled extends Rule {
  re: RegExp;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Palabras completas, con plural opcional.
// Ordenadas de más larga a más corta: una frase consume su texto y los términos
// contenidos en ella ("congreso" dentro de "congreso de los diputados") no puntúan dos veces.
const COMPILED: Compiled[] = [...RULES]
  .sort((a, b) => b.term.length - a.term.length)
  .map((rule) => ({
    ...rule,
    re: new RegExp(`(?<![a-z0-9])${escape(rule.term)}(?:s|es)?(?![a-z0-9])`, 'g'),
  }));

const EMPTY: Classification = { political: false, confidence: 0, categories: [], reasonCodes: [] };

export const classify: Classifier = (text, mode) => {
  const t = normalize(text ?? '');
  if (!t) return EMPTY;

  const byCategory = new Map<Category, number>();
  let hits = 0;
  let rest = t;
  for (const rule of COMPILED) {
    if (rule.unless?.test(t)) continue;
    rule.re.lastIndex = 0;
    if (!rule.re.test(rest)) continue;
    rule.re.lastIndex = 0;
    rest = rest.replace(rule.re, ' ');
    byCategory.set(rule.category, (byCategory.get(rule.category) ?? 0) + rule.weight);
    hits++;
  }

  // Los debates públicos sólo cuentan con contexto político previo.
  const debates = byCategory.get('debates') ?? 0;
  const core = [...byCategory].reduce((n, [c, w]) => (c === 'debates' ? n : n + w), 0);
  if (core === 0 && debates > 0) byCategory.delete('debates');

  let score = [...byCategory.values()].reduce((a, b) => a + b, 0);
  score += Math.max(0, byCategory.size - 1); // bonus por diversidad de señales

  if (hits === 0 || score === 0) return EMPTY;

  const categories = [...byCategory.keys()];
  return {
    political: score >= THRESHOLDS[mode],
    confidence: Math.min(1, score / 10),
    categories,
    reasonCodes: [...categories.map((c) => `cat:${c}`), `score:${score}`],
  };
};
