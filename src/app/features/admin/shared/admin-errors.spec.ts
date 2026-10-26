import { HttpErrorResponse } from '@angular/common/http';

import { errorMessage, validationErrors } from './admin-errors';

describe('admin-errors', () => {
  it('maps 400 ValidationProblem to first message per camelCase field', () => {
    const err = new HttpErrorResponse({
      status: 400,
      error: { errors: { Title: ['Obrigatório', 'x'], 'items[0].unitPrice': ['>= 0'], empty: [] } },
    });
    expect(validationErrors(err)).toEqual({ title: 'Obrigatório', 'items[0].unitPrice': '>= 0' });
  });

  it('ignores non-400 and non-http errors', () => {
    expect(validationErrors(new HttpErrorResponse({ status: 500 }))).toEqual({});
    expect(validationErrors(new Error('x'))).toEqual({});
    expect(validationErrors(new HttpErrorResponse({ status: 400, error: null }))).toEqual({});
  });

  it('returns friendly messages by status', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 0 }))).toContain('API');
    expect(errorMessage(new HttpErrorResponse({ status: 400 }))).toContain('Revise');
    expect(errorMessage(new HttpErrorResponse({ status: 401 }))).toContain('Sessão');
    expect(errorMessage(new HttpErrorResponse({ status: 404 }))).toContain('não encontrado');
    expect(errorMessage(new HttpErrorResponse({ status: 500 }))).toContain('Algo deu errado');
    expect(errorMessage('x')).toContain('Algo deu errado');
  });
});
