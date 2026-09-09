/** App-wide infrastructure (interceptors, guards, config). No business rules. */
export {
  APP_ENVIRONMENT,
  provideAppEnvironment,
  resolveApiRoot,
  type AppEnvironment,
} from './config/app-environment';

export { APP_VERSION } from './config/app-version';
