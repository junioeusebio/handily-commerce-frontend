/** `GET {apiRoot}/ping` — stable BE probe contract. */
export interface PingResponse {
  service: string;
  apiVersion: string;
  status: string;
}

/** `GET {apiRoot}/health` — ASP.NET health JSON writer. */
export interface HealthResponse {
  status: string;
  service: string;
}

/** `GET {apiRoot}/apiVersion` — product version for the FE footer. */
export interface ApiVersionResponse {
  version: string;
  service?: string;
  apiRouteVersion?: string;
}
