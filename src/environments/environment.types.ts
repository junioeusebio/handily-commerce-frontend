/** Shape shared by all `environment*.ts` fileReplacements targets. */
export interface AppEnvironment {
  production: boolean;
  /** Host + route prefix only (no version segment), e.g. `http://localhost:5228/api`. */
  apiBaseUrl: string;
  /** Matches backend `Api:Version`, e.g. `v1`. */
  apiVersion: string;
}
