/**
 * POS module's local auth wrapper.
 *
 * Now that the shared AuthService (libs/shared/auth) speaks the POS shape
 * natively, this file is just a re-export so any POS component that imports
 * from `./core/services/auth.service` keeps working unchanged.
 */
export {
  AuthService,
  type AuthUser,
  type SiteInfo,
} from '@platinumv3/shared/auth';
