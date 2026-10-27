/** Corpo de `POST {apiRoot}/leads` (BE-owned). `message` é opcional. */
export interface LeadRequest {
  name: string;
  email: string;
  municipality: string;
  /** Telefone BR só com dígitos (10 ou 11). */
  phone: string;
  message?: string;
}

/** Resposta 201 de `POST {apiRoot}/leads`. */
export interface LeadCreated {
  id: string;
}
