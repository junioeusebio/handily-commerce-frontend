/** Eixos da BNCC Computação (kebab-case, como serializado pelo BE). */
export type BnccAxis = 'pensamento-computacional' | 'mundo-digital' | 'cultura-digital';

/** Rótulos de exibição para cada eixo da BNCC Computação. */
export const BNCC_AXIS_LABELS: Readonly<Record<BnccAxis, string>> = {
  'pensamento-computacional': 'Pensamento Computacional',
  'mundo-digital': 'Mundo Digital',
  'cultura-digital': 'Cultura Digital',
};

/** Curso de formação oferecido às redes municipais (`GET {apiRoot}/courses`, BE-owned). */
export interface Course {
  id: string;
  title: string;
  axis: BnccAxis;
  summary: string;
  audience: string;
  /** Carga horária total em horas, quando definida. */
  workloadHours?: number;
  /** Ordem de exibição no catálogo (menor primeiro). Opcional: só vem quando o BE devolve. */
  sortOrder?: number;
}
