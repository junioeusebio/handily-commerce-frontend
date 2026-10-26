/** App-wide infrastructure (interceptors, guards, config). No business rules. */
export {
  APP_ENVIRONMENT,
  provideAppEnvironment,
  resolveApiRoot,
  type AppEnvironment,
} from './config/app-environment';

export { APP_VERSION } from './config/app-version';

export {
  ADMIN_LOGIN_URL,
  AuthService,
  type LoginRequest,
  type LoginResponse,
  type MeResponse,
} from './auth/auth.service';
export { authInterceptor, needsAuth } from './auth/auth.interceptor';
export { authGuard, guestGuard } from './auth/auth.guard';
