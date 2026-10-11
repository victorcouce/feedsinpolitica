import type { Category } from '../../types';

export interface Rule {
  term: string; // ya normalizado (sin acentos, minúsculas)
  weight: number;
  category: Category;
  /** Si el texto coincide con este patrón, la regla se ignora (términos ambiguos). */
  unless?: RegExp;
}

const SPORTS = /\b(futbol|liga|gol|goles|entrenador|champions|baloncesto|tenis|jugador|jugadores|estadio|equipo|mundial|nba|f1)\b/;
const POLICY_OF = /\bpolitica de (devoluciones|privacidad|cookies|empresa|precios|cancelacion|envios|calidad)\b/;

const r = (category: Category, weight: number, terms: string[], unless?: RegExp): Rule[] =>
  terms.map((term) => ({ term, weight, category, unless }));

/**
 * Las listas de partidos y líderes cubren el espectro de forma equivalente
 * (mismo peso para todos). Si se añade un nombre, hay que añadir sus homólogos.
 */
export const RULES: Rule[] = [
  // A — Actores políticos
  // Inequívocos: una sola mención basta. Mismo peso para todo el espectro.
  ...r('actors', 5, [
    'psoe', 'partido popular', 'esquerra republicana', 'junts', 'pnv', 'eh bildu', 'bildu',
    'compromis', 'mas madrid', 'coalicion canaria', 'movimiento sumar', 'partido socialista',
    'izquierda unida',
  ]),
  ...r('actors', 5, [
    'pedro sanchez', 'feijoo', 'abascal', 'yolanda diaz', 'puigdemont', 'junqueras', 'ione belarra',
    'irene montero', 'pablo iglesias', 'ines arrimadas', 'albert rivera', 'pablo casado', 'mariano rajoy',
    'aitor esteban', 'arnaldo otegi', 'felipe gonzalez', 'isabel diaz ayuso',
    'santiago abascal', 'oriol junqueras', 'salvador illa', 'pere aragones',
  ]),
  // Ambiguos (siglas cortas, apellidos): necesitan otra señal.
  ...r('actors', 3, ['vox', 'erc', 'pp', 'bng', 'upn', 'ayuso', 'sanchez', 'zapatero']),
  ...r('actors', 3, ['presidente del gobierno', 'portavoz parlamentario', 'portavoz del gobierno', 'lider de la oposicion']),
  ...r('actors', 2, ['ministro', 'ministra', 'diputado', 'diputada', 'senador', 'senadora', 'conseller', 'consejero autonomico']),

  // B — Procesos electorales
  ...r('electoral', 4, ['campana electoral', 'debate electoral', 'programa electoral', 'junta electoral', 'encuesta electoral', 'sondeo electoral']),
  ...r('electoral', 3, [
    'elecciones', 'electoral', 'electorales', 'candidato', 'candidata', 'candidatura', 'escrutinio', 'mitin',
    'colegio electoral', 'cabeza de lista', 'precampana', 'mayoria absoluta', 'voto en blanco', 'escanos', 'urnas',
  ]),
  ...r('electoral', 2, ['papeleta', 'abstencion', 'autonomicas', 'municipales', 'generales']),
  ...r('electoral', 1, ['voto', 'votar', 'votantes', 'encuesta']),

  // C — Instituciones
  ...r('institutions', 3, ['congreso de los diputados', 'cortes generales', 'gobierno de espana', 'moncloa']),
  ...r('institutions', 2, ['congreso', 'senado', 'parlamento', 'tribunal constitucional', 'asamblea de madrid']),
  ...r('institutions', 1, ['gobierno', 'ministerio', 'oposicion', 'generalitat']),

  // D — Expresiones políticas
  ...r('expressions', 4, ['mocion de censura', 'ley de amnistia', 'sesion de control']),
  ...r('expressions', 3, [
    'investidura', 'coalicion de gobierno', 'pacto de gobierno', 'acuerdo parlamentario', 'proposicion de ley',
    'presupuestos generales', 'legislatura', 'cuestion de confianza', 'comision de investigacion', 'financiacion autonomica',
  ]),
  ...r('expressions', 2, ['proyecto de ley', 'decreto ley', 'reforma fiscal', 'amnistia', 'salario minimo']),
  ...r('expressions', 1, ['politica', 'politico', 'politicos', 'politicas', 'corrupcion', 'dimision', 'pleno'], POLICY_OF),
  ...r('expressions', 1, ['partido', 'partidos'], SPORTS),

  // E — Debates públicos (sólo puntúan si ya hay otra señal política)
  ...r('debates', 1, [
    'vivienda', 'inmigracion', 'impuestos', 'fiscalidad', 'sanidad publica', 'servicios publicos', 'pensiones',
  ]),
];
