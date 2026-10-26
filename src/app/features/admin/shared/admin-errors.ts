import { HttpErrorResponse } from '@angular/common/http';

/**
 * Mapeia o ValidationProblem (400) `{errors:{campo:[msg]}}` para o primeiro erro
 * de cada campo, com chave em camelCase (ex.: `items[0].unitPrice`).
 */
export function validationErrors(err: unknown): Record<string, string> {
  if (!(err instanceof HttpErrorResponse) || err.status !== 400) {
    return {};
  }
  const errors = (err.error as { errors?: Record<string, string[]> } | null)?.errors ?? {};
  const out: Record<string, string> = {};
  for (const [key, msgs] of Object.entries(errors)) {
    if (msgs?.[0]) {
      out[key.charAt(0).toLowerCase() + key.slice(1)] = msgs[0];
    }
  }
  return out;
}

/** Mensagem curta em português para falhas gerais da API admin. */
export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Não foi possível falar com a API. Tente de novo.';
    if (err.status === 400) return 'Revise os campos destacados.';
    if (err.status === 401) return 'Sessão expirada. Entre de novo.';
    if (err.status === 404) return 'Registro não encontrado (talvez já tenha sido apagado).';
  }
  return 'Algo deu errado. Tente de novo em instantes.';
}

/** Classes Tailwind compartilhadas dos campos de formulário do admin. */
export const ADMIN_INPUT =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 aria-invalid:border-red-600 disabled:cursor-not-allowed disabled:opacity-60';
