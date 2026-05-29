import {
  __export,
  __objRest,
  __spreadProps,
  __spreadValues
} from "./chunk-7WUTQBRG.js";

// ../../node_modules/@azure/msal-common/dist-browser/utils/Constants.mjs
var Constants_exports = {};
__export(Constants_exports, {
  AADAuthority: () => AADAuthority,
  AAD_INSTANCE_DISCOVERY_ENDPT: () => AAD_INSTANCE_DISCOVERY_ENDPT,
  AAD_TENANT_DOMAIN_SUFFIX: () => AAD_TENANT_DOMAIN_SUFFIX,
  ADFS: () => ADFS,
  APP_METADATA: () => APP_METADATA,
  AUTHORITY_METADATA_CACHE_KEY: () => AUTHORITY_METADATA_CACHE_KEY,
  AUTHORITY_METADATA_REFRESH_TIME_SECONDS: () => AUTHORITY_METADATA_REFRESH_TIME_SECONDS,
  AUTHORIZATION_PENDING: () => AUTHORIZATION_PENDING,
  AZURE_REGION_AUTO_DISCOVER_FLAG: () => AZURE_REGION_AUTO_DISCOVER_FLAG,
  AuthenticationScheme: () => AuthenticationScheme,
  AuthorityMetadataSource: () => AuthorityMetadataSource,
  CACHE_ACCOUNT_TYPE_ADFS: () => CACHE_ACCOUNT_TYPE_ADFS,
  CACHE_ACCOUNT_TYPE_GENERIC: () => CACHE_ACCOUNT_TYPE_GENERIC,
  CACHE_ACCOUNT_TYPE_MSAV1: () => CACHE_ACCOUNT_TYPE_MSAV1,
  CACHE_ACCOUNT_TYPE_MSSTS: () => CACHE_ACCOUNT_TYPE_MSSTS,
  CACHE_KEY_SEPARATOR: () => CACHE_KEY_SEPARATOR,
  CIAM_AUTH_URL: () => CIAM_AUTH_URL,
  CLIENT_INFO: () => CLIENT_INFO,
  CLIENT_INFO_SEPARATOR: () => CLIENT_INFO_SEPARATOR,
  CLIENT_MISMATCH_ERROR: () => CLIENT_MISMATCH_ERROR,
  CODE_GRANT_TYPE: () => CODE_GRANT_TYPE,
  CONSUMER_UTID: () => CONSUMER_UTID,
  CacheOutcome: () => CacheOutcome,
  CacheType: () => CacheType,
  ClaimsRequestKeys: () => ClaimsRequestKeys,
  CodeChallengeMethodValues: () => CodeChallengeMethodValues,
  CredentialType: () => CredentialType,
  DEFAULT_AUTHORITY: () => DEFAULT_AUTHORITY,
  DEFAULT_AUTHORITY_HOST: () => DEFAULT_AUTHORITY_HOST,
  DEFAULT_COMMON_TENANT: () => DEFAULT_COMMON_TENANT,
  DEFAULT_MAX_THROTTLE_TIME_SECONDS: () => DEFAULT_MAX_THROTTLE_TIME_SECONDS,
  DEFAULT_THROTTLE_TIME_SECONDS: () => DEFAULT_THROTTLE_TIME_SECONDS,
  DEFAULT_TOKEN_RENEWAL_OFFSET_SEC: () => DEFAULT_TOKEN_RENEWAL_OFFSET_SEC,
  DSTS: () => DSTS,
  EMAIL_SCOPE: () => EMAIL_SCOPE,
  EncodingTypes: () => EncodingTypes,
  FORWARD_SLASH: () => FORWARD_SLASH,
  GrantType: () => GrantType,
  HTTP_BAD_REQUEST: () => HTTP_BAD_REQUEST,
  HTTP_CLIENT_ERROR: () => HTTP_CLIENT_ERROR,
  HTTP_CLIENT_ERROR_RANGE_END: () => HTTP_CLIENT_ERROR_RANGE_END,
  HTTP_CLIENT_ERROR_RANGE_START: () => HTTP_CLIENT_ERROR_RANGE_START,
  HTTP_GATEWAY_TIMEOUT: () => HTTP_GATEWAY_TIMEOUT,
  HTTP_GONE: () => HTTP_GONE,
  HTTP_MULTI_SIDED_ERROR: () => HTTP_MULTI_SIDED_ERROR,
  HTTP_NOT_FOUND: () => HTTP_NOT_FOUND,
  HTTP_REDIRECT: () => HTTP_REDIRECT,
  HTTP_REQUEST_TIMEOUT: () => HTTP_REQUEST_TIMEOUT,
  HTTP_SERVER_ERROR: () => HTTP_SERVER_ERROR,
  HTTP_SERVER_ERROR_RANGE_END: () => HTTP_SERVER_ERROR_RANGE_END,
  HTTP_SERVER_ERROR_RANGE_START: () => HTTP_SERVER_ERROR_RANGE_START,
  HTTP_SERVICE_UNAVAILABLE: () => HTTP_SERVICE_UNAVAILABLE,
  HTTP_SUCCESS: () => HTTP_SUCCESS,
  HTTP_SUCCESS_RANGE_END: () => HTTP_SUCCESS_RANGE_END,
  HTTP_SUCCESS_RANGE_START: () => HTTP_SUCCESS_RANGE_START,
  HTTP_TOO_MANY_REQUESTS: () => HTTP_TOO_MANY_REQUESTS,
  HTTP_UNAUTHORIZED: () => HTTP_UNAUTHORIZED,
  HeaderNames: () => HeaderNames,
  HttpMethod: () => HttpMethod,
  IMDS_ENDPOINT: () => IMDS_ENDPOINT,
  IMDS_TIMEOUT: () => IMDS_TIMEOUT,
  IMDS_VERSION: () => IMDS_VERSION,
  INVALID_GRANT_ERROR: () => INVALID_GRANT_ERROR,
  INVALID_INSTANCE: () => INVALID_INSTANCE,
  JsonWebTokenTypes: () => JsonWebTokenTypes,
  KNOWN_PUBLIC_CLOUDS: () => KNOWN_PUBLIC_CLOUDS,
  NOT_APPLICABLE: () => NOT_APPLICABLE,
  NOT_AVAILABLE: () => NOT_AVAILABLE,
  OAuthResponseType: () => OAuthResponseType,
  OFFLINE_ACCESS_SCOPE: () => OFFLINE_ACCESS_SCOPE,
  OIDC_DEFAULT_SCOPES: () => OIDC_DEFAULT_SCOPES,
  OIDC_SCOPES: () => OIDC_SCOPES,
  ONE_DAY_IN_MS: () => ONE_DAY_IN_MS,
  OPENID_SCOPE: () => OPENID_SCOPE,
  PROFILE_SCOPE: () => PROFILE_SCOPE,
  PasswordGrantConstants: () => PasswordGrantConstants,
  PersistentCacheKeys: () => PersistentCacheKeys,
  PromptValue: () => PromptValue,
  REGIONAL_AUTH_PUBLIC_CLOUD_SUFFIX: () => REGIONAL_AUTH_PUBLIC_CLOUD_SUFFIX,
  RESOURCE_DELIM: () => RESOURCE_DELIM,
  RegionDiscoveryOutcomes: () => RegionDiscoveryOutcomes,
  RegionDiscoverySources: () => RegionDiscoverySources,
  ResponseMode: () => ResponseMode,
  S256_CODE_CHALLENGE_METHOD: () => S256_CODE_CHALLENGE_METHOD,
  SERVER_TELEM_CACHE_KEY: () => SERVER_TELEM_CACHE_KEY,
  SERVER_TELEM_CATEGORY_SEPARATOR: () => SERVER_TELEM_CATEGORY_SEPARATOR,
  SERVER_TELEM_MAX_CACHED_ERRORS: () => SERVER_TELEM_MAX_CACHED_ERRORS,
  SERVER_TELEM_MAX_CUR_HEADER_BYTES: () => SERVER_TELEM_MAX_CUR_HEADER_BYTES,
  SERVER_TELEM_MAX_LAST_HEADER_BYTES: () => SERVER_TELEM_MAX_LAST_HEADER_BYTES,
  SERVER_TELEM_OVERFLOW_FALSE: () => SERVER_TELEM_OVERFLOW_FALSE,
  SERVER_TELEM_OVERFLOW_TRUE: () => SERVER_TELEM_OVERFLOW_TRUE,
  SERVER_TELEM_SCHEMA_VERSION: () => SERVER_TELEM_SCHEMA_VERSION,
  SERVER_TELEM_UNKNOWN_ERROR: () => SERVER_TELEM_UNKNOWN_ERROR,
  SERVER_TELEM_VALUE_SEPARATOR: () => SERVER_TELEM_VALUE_SEPARATOR,
  SHR_NONCE_VALIDITY: () => SHR_NONCE_VALIDITY,
  SKU: () => SKU,
  THE_FAMILY_ID: () => THE_FAMILY_ID,
  THROTTLING_PREFIX: () => THROTTLING_PREFIX,
  URL_FORM_CONTENT_TYPE: () => URL_FORM_CONTENT_TYPE,
  X_MS_LIB_CAPABILITY_VALUE: () => X_MS_LIB_CAPABILITY_VALUE
});
var SKU = "msal.js.common";
var DEFAULT_AUTHORITY = "https://login.microsoftonline.com/common/";
var DEFAULT_AUTHORITY_HOST = "login.microsoftonline.com";
var DEFAULT_COMMON_TENANT = "common";
var ADFS = "adfs";
var DSTS = "dstsv2";
var AAD_INSTANCE_DISCOVERY_ENDPT = `${DEFAULT_AUTHORITY}discovery/instance?api-version=1.1&authorization_endpoint=`;
var CIAM_AUTH_URL = ".ciamlogin.com";
var AAD_TENANT_DOMAIN_SUFFIX = ".onmicrosoft.com";
var RESOURCE_DELIM = "|";
var CONSUMER_UTID = "9188040d-6c67-4c5b-b112-36a304b66dad";
var OPENID_SCOPE = "openid";
var PROFILE_SCOPE = "profile";
var OFFLINE_ACCESS_SCOPE = "offline_access";
var EMAIL_SCOPE = "email";
var CODE_GRANT_TYPE = "authorization_code";
var S256_CODE_CHALLENGE_METHOD = "S256";
var URL_FORM_CONTENT_TYPE = "application/x-www-form-urlencoded;charset=utf-8";
var AUTHORIZATION_PENDING = "authorization_pending";
var NOT_APPLICABLE = "N/A";
var NOT_AVAILABLE = "Not Available";
var FORWARD_SLASH = "/";
var IMDS_ENDPOINT = "http://169.254.169.254/metadata/instance/compute/location";
var IMDS_VERSION = "2020-06-01";
var IMDS_TIMEOUT = 2e3;
var AZURE_REGION_AUTO_DISCOVER_FLAG = "TryAutoDetect";
var REGIONAL_AUTH_PUBLIC_CLOUD_SUFFIX = "login.microsoft.com";
var KNOWN_PUBLIC_CLOUDS = [
  "login.microsoftonline.com",
  "login.windows.net",
  "login.microsoft.com",
  "sts.windows.net"
];
var SHR_NONCE_VALIDITY = 240;
var INVALID_INSTANCE = "invalid_instance";
var HTTP_SUCCESS = 200;
var HTTP_SUCCESS_RANGE_START = 200;
var HTTP_SUCCESS_RANGE_END = 299;
var HTTP_REDIRECT = 302;
var HTTP_CLIENT_ERROR = 400;
var HTTP_CLIENT_ERROR_RANGE_START = 400;
var HTTP_BAD_REQUEST = 400;
var HTTP_UNAUTHORIZED = 401;
var HTTP_NOT_FOUND = 404;
var HTTP_REQUEST_TIMEOUT = 408;
var HTTP_GONE = 410;
var HTTP_TOO_MANY_REQUESTS = 429;
var HTTP_CLIENT_ERROR_RANGE_END = 499;
var HTTP_SERVER_ERROR = 500;
var HTTP_SERVER_ERROR_RANGE_START = 500;
var HTTP_SERVICE_UNAVAILABLE = 503;
var HTTP_GATEWAY_TIMEOUT = 504;
var HTTP_SERVER_ERROR_RANGE_END = 599;
var HTTP_MULTI_SIDED_ERROR = 600;
var HttpMethod = {
  GET: "GET",
  POST: "POST"
};
var OIDC_DEFAULT_SCOPES = [
  OPENID_SCOPE,
  PROFILE_SCOPE,
  OFFLINE_ACCESS_SCOPE
];
var OIDC_SCOPES = [...OIDC_DEFAULT_SCOPES, EMAIL_SCOPE];
var HeaderNames = {
  CONTENT_TYPE: "Content-Type",
  CONTENT_LENGTH: "Content-Length",
  RETRY_AFTER: "Retry-After",
  CCS_HEADER: "X-AnchorMailbox",
  WWWAuthenticate: "WWW-Authenticate",
  AuthenticationInfo: "Authentication-Info",
  X_MS_REQUEST_ID: "x-ms-request-id",
  X_MS_HTTP_VERSION: "x-ms-httpver"
};
var PersistentCacheKeys = {
  ACTIVE_ACCOUNT_FILTERS: "active-account-filters"
  // new cache entry for active_account for a more robust version for browser
};
var AADAuthority = {
  COMMON: "common",
  ORGANIZATIONS: "organizations",
  CONSUMERS: "consumers"
};
var ClaimsRequestKeys = {
  ACCESS_TOKEN: "access_token",
  XMS_CC: "xms_cc"
};
var PromptValue = {
  LOGIN: "login",
  SELECT_ACCOUNT: "select_account",
  CONSENT: "consent",
  NONE: "none",
  CREATE: "create",
  NO_SESSION: "no_session"
};
var CodeChallengeMethodValues = {
  PLAIN: "plain",
  S256: "S256"
};
var OAuthResponseType = {
  CODE: "code",
  IDTOKEN_TOKEN: "id_token token",
  IDTOKEN_TOKEN_REFRESHTOKEN: "id_token token refresh_token"
};
var ResponseMode = {
  QUERY: "query",
  FRAGMENT: "fragment",
  FORM_POST: "form_post"
};
var GrantType = {
  IMPLICIT_GRANT: "implicit",
  AUTHORIZATION_CODE_GRANT: "authorization_code",
  CLIENT_CREDENTIALS_GRANT: "client_credentials",
  RESOURCE_OWNER_PASSWORD_GRANT: "password",
  REFRESH_TOKEN_GRANT: "refresh_token",
  DEVICE_CODE_GRANT: "device_code",
  JWT_BEARER: "urn:ietf:params:oauth:grant-type:jwt-bearer"
};
var CACHE_ACCOUNT_TYPE_MSSTS = "MSSTS";
var CACHE_ACCOUNT_TYPE_ADFS = "ADFS";
var CACHE_ACCOUNT_TYPE_MSAV1 = "MSA";
var CACHE_ACCOUNT_TYPE_GENERIC = "Generic";
var CACHE_KEY_SEPARATOR = "-";
var CLIENT_INFO_SEPARATOR = ".";
var CredentialType = {
  ID_TOKEN: "IdToken",
  ACCESS_TOKEN: "AccessToken",
  ACCESS_TOKEN_WITH_AUTH_SCHEME: "AccessToken_With_AuthScheme",
  REFRESH_TOKEN: "RefreshToken"
};
var CacheType = {
  ADFS: 1001,
  MSA: 1002,
  MSSTS: 1003,
  GENERIC: 1004,
  ACCESS_TOKEN: 2001,
  REFRESH_TOKEN: 2002,
  ID_TOKEN: 2003,
  APP_METADATA: 3001,
  UNDEFINED: 9999
};
var APP_METADATA = "appmetadata";
var CLIENT_INFO = "client_info";
var THE_FAMILY_ID = "1";
var AUTHORITY_METADATA_CACHE_KEY = "authority-metadata";
var AUTHORITY_METADATA_REFRESH_TIME_SECONDS = 3600 * 24;
var AuthorityMetadataSource = {
  CONFIG: "config",
  CACHE: "cache",
  NETWORK: "network",
  HARDCODED_VALUES: "hardcoded_values"
};
var SERVER_TELEM_SCHEMA_VERSION = 5;
var SERVER_TELEM_MAX_CUR_HEADER_BYTES = 80;
var SERVER_TELEM_MAX_LAST_HEADER_BYTES = 330;
var SERVER_TELEM_MAX_CACHED_ERRORS = 50;
var SERVER_TELEM_CACHE_KEY = "server-telemetry";
var SERVER_TELEM_CATEGORY_SEPARATOR = "|";
var SERVER_TELEM_VALUE_SEPARATOR = ",";
var SERVER_TELEM_OVERFLOW_TRUE = "1";
var SERVER_TELEM_OVERFLOW_FALSE = "0";
var SERVER_TELEM_UNKNOWN_ERROR = "unknown_error";
var AuthenticationScheme = {
  BEARER: "Bearer",
  POP: "pop",
  SSH: "ssh-cert"
};
var DEFAULT_THROTTLE_TIME_SECONDS = 60;
var DEFAULT_MAX_THROTTLE_TIME_SECONDS = 3600;
var THROTTLING_PREFIX = "throttling";
var X_MS_LIB_CAPABILITY_VALUE = "retry-after, h429";
var INVALID_GRANT_ERROR = "invalid_grant";
var CLIENT_MISMATCH_ERROR = "client_mismatch";
var PasswordGrantConstants = {
  username: "username",
  password: "password"
};
var RegionDiscoverySources = {
  FAILED_AUTO_DETECTION: "1",
  INTERNAL_CACHE: "2",
  ENVIRONMENT_VARIABLE: "3",
  IMDS: "4"
};
var RegionDiscoveryOutcomes = {
  CONFIGURED_MATCHES_DETECTED: "1",
  CONFIGURED_NO_AUTO_DETECTION: "2",
  CONFIGURED_NOT_DETECTED: "3",
  AUTO_DETECTION_REQUESTED_SUCCESSFUL: "4",
  AUTO_DETECTION_REQUESTED_FAILED: "5"
};
var CacheOutcome = {
  // When a token is found in the cache or the cache is not supposed to be hit when making the request
  NOT_APPLICABLE: "0",
  // When the token request goes to the identity provider because force_refresh was set to true. Also occurs if claims were requested
  FORCE_REFRESH_OR_CLAIMS: "1",
  // When the token request goes to the identity provider because no cached access token exists
  NO_CACHED_ACCESS_TOKEN: "2",
  // When the token request goes to the identity provider because cached access token expired
  CACHED_ACCESS_TOKEN_EXPIRED: "3",
  // When the token request goes to the identity provider because refresh_in was used and the existing token needs to be refreshed
  PROACTIVELY_REFRESHED: "4"
};
var JsonWebTokenTypes = {
  Jwt: "JWT",
  Jwk: "JWK",
  Pop: "pop"
};
var ONE_DAY_IN_MS = 864e5;
var DEFAULT_TOKEN_RENEWAL_OFFSET_SEC = 300;
var EncodingTypes = {
  BASE64: "base64",
  HEX: "hex",
  UTF8: "utf-8"
};

// ../../node_modules/@azure/msal-common/dist-browser/error/AuthError.mjs
function getDefaultErrorMessage(code) {
  return `See https://aka.ms/msal.js.errors#${code} for details`;
}
var AuthError = class _AuthError extends Error {
  constructor(errorCode, errorMessage, suberror) {
    const message = errorMessage || (errorCode ? getDefaultErrorMessage(errorCode) : "");
    const errorString = message ? `${errorCode}: ${message}` : errorCode;
    super(errorString);
    Object.setPrototypeOf(this, _AuthError.prototype);
    this.errorCode = errorCode || "";
    this.errorMessage = message || "";
    this.subError = suberror || "";
    this.name = "AuthError";
  }
  setCorrelationId(correlationId) {
    this.correlationId = correlationId;
  }
};
function createAuthError(code, additionalMessage) {
  return new AuthError(code, additionalMessage || getDefaultErrorMessage(code));
}

// ../../node_modules/@azure/msal-common/dist-browser/error/ClientConfigurationError.mjs
var ClientConfigurationError = class _ClientConfigurationError extends AuthError {
  constructor(errorCode) {
    super(errorCode);
    this.name = "ClientConfigurationError";
    Object.setPrototypeOf(this, _ClientConfigurationError.prototype);
  }
};
function createClientConfigurationError(errorCode) {
  return new ClientConfigurationError(errorCode);
}

// ../../node_modules/@azure/msal-common/dist-browser/error/ClientAuthError.mjs
var ClientAuthError = class _ClientAuthError extends AuthError {
  constructor(errorCode, additionalMessage) {
    super(errorCode, additionalMessage);
    this.name = "ClientAuthError";
    Object.setPrototypeOf(this, _ClientAuthError.prototype);
  }
};
function createClientAuthError(errorCode, additionalMessage) {
  return new ClientAuthError(errorCode, additionalMessage);
}

// ../../node_modules/@azure/msal-common/dist-browser/error/ClientConfigurationErrorCodes.mjs
var ClientConfigurationErrorCodes_exports = {};
__export(ClientConfigurationErrorCodes_exports, {
  authorityMismatch: () => authorityMismatch,
  authorityUriInsecure: () => authorityUriInsecure,
  cannotAllowPlatformBroker: () => cannotAllowPlatformBroker,
  cannotSetOIDCOptions: () => cannotSetOIDCOptions,
  claimsRequestParsingError: () => claimsRequestParsingError,
  emptyInputScopesError: () => emptyInputScopesError,
  invalidAuthenticationHeader: () => invalidAuthenticationHeader,
  invalidAuthorityMetadata: () => invalidAuthorityMetadata,
  invalidClaims: () => invalidClaims,
  invalidCloudDiscoveryMetadata: () => invalidCloudDiscoveryMetadata,
  invalidCodeChallengeMethod: () => invalidCodeChallengeMethod,
  invalidPlatformBrokerConfiguration: () => invalidPlatformBrokerConfiguration,
  invalidRequestMethodForEAR: () => invalidRequestMethodForEAR,
  issuerValidationFailed: () => issuerValidationFailed,
  logoutRequestEmpty: () => logoutRequestEmpty,
  missingNonceAuthenticationHeader: () => missingNonceAuthenticationHeader,
  missingSshJwk: () => missingSshJwk,
  missingSshKid: () => missingSshKid,
  pkceParamsMissing: () => pkceParamsMissing,
  redirectUriEmpty: () => redirectUriEmpty,
  tokenRequestEmpty: () => tokenRequestEmpty,
  untrustedAuthority: () => untrustedAuthority,
  urlEmptyError: () => urlEmptyError,
  urlParseError: () => urlParseError
});
var redirectUriEmpty = "redirect_uri_empty";
var claimsRequestParsingError = "claims_request_parsing_error";
var authorityUriInsecure = "authority_uri_insecure";
var urlParseError = "url_parse_error";
var urlEmptyError = "empty_url_error";
var emptyInputScopesError = "empty_input_scopes_error";
var invalidClaims = "invalid_claims";
var tokenRequestEmpty = "token_request_empty";
var logoutRequestEmpty = "logout_request_empty";
var invalidCodeChallengeMethod = "invalid_code_challenge_method";
var pkceParamsMissing = "pkce_params_missing";
var invalidCloudDiscoveryMetadata = "invalid_cloud_discovery_metadata";
var invalidAuthorityMetadata = "invalid_authority_metadata";
var untrustedAuthority = "untrusted_authority";
var missingSshJwk = "missing_ssh_jwk";
var missingSshKid = "missing_ssh_kid";
var missingNonceAuthenticationHeader = "missing_nonce_authentication_header";
var invalidAuthenticationHeader = "invalid_authentication_header";
var cannotSetOIDCOptions = "cannot_set_OIDCOptions";
var cannotAllowPlatformBroker = "cannot_allow_platform_broker";
var authorityMismatch = "authority_mismatch";
var invalidRequestMethodForEAR = "invalid_request_method_for_EAR";
var invalidPlatformBrokerConfiguration = "invalid_platform_broker_configuration";
var issuerValidationFailed = "issuer_validation_failed";

// ../../node_modules/@azure/msal-common/dist-browser/error/ClientAuthErrorCodes.mjs
var ClientAuthErrorCodes_exports = {};
__export(ClientAuthErrorCodes_exports, {
  authTimeNotFound: () => authTimeNotFound,
  authorizationCodeMissingFromServerResponse: () => authorizationCodeMissingFromServerResponse,
  bindingKeyNotRemoved: () => bindingKeyNotRemoved,
  cannotAppendScopeSet: () => cannotAppendScopeSet,
  cannotRemoveEmptyScope: () => cannotRemoveEmptyScope,
  clientInfoDecodingError: () => clientInfoDecodingError,
  clientInfoEmptyError: () => clientInfoEmptyError,
  emptyInputScopeSet: () => emptyInputScopeSet,
  endSessionEndpointNotSupported: () => endSessionEndpointNotSupported,
  endpointResolutionError: () => endpointResolutionError,
  hashNotDeserialized: () => hashNotDeserialized,
  invalidCacheEnvironment: () => invalidCacheEnvironment,
  invalidCacheRecord: () => invalidCacheRecord,
  invalidState: () => invalidState,
  keyIdMissing: () => keyIdMissing,
  maxAgeTranspired: () => maxAgeTranspired,
  methodNotImplemented: () => methodNotImplemented,
  misplacedResourceParam: () => misplacedResourceParam,
  multipleMatchingAppMetadata: () => multipleMatchingAppMetadata,
  multipleMatchingTokens: () => multipleMatchingTokens,
  nestedAppAuthBridgeDisabled: () => nestedAppAuthBridgeDisabled,
  networkError: () => networkError,
  noAccountFound: () => noAccountFound,
  noAccountInSilentRequest: () => noAccountInSilentRequest,
  noCryptoObject: () => noCryptoObject,
  noNetworkConnectivity: () => noNetworkConnectivity,
  nonceMismatch: () => nonceMismatch,
  nullOrEmptyToken: () => nullOrEmptyToken,
  openIdConfigError: () => openIdConfigError,
  platformBrokerError: () => platformBrokerError,
  requestCannotBeMade: () => requestCannotBeMade,
  resourceParameterRequired: () => resourceParameterRequired,
  stateMismatch: () => stateMismatch,
  stateNotFound: () => stateNotFound,
  tokenClaimsCnfRequiredForSignedJwt: () => tokenClaimsCnfRequiredForSignedJwt,
  tokenParsingError: () => tokenParsingError,
  tokenRefreshRequired: () => tokenRefreshRequired,
  unexpectedCredentialType: () => unexpectedCredentialType,
  userCanceled: () => userCanceled
});
var clientInfoDecodingError = "client_info_decoding_error";
var clientInfoEmptyError = "client_info_empty_error";
var tokenParsingError = "token_parsing_error";
var nullOrEmptyToken = "null_or_empty_token";
var endpointResolutionError = "endpoints_resolution_error";
var networkError = "network_error";
var openIdConfigError = "openid_config_error";
var hashNotDeserialized = "hash_not_deserialized";
var invalidState = "invalid_state";
var stateMismatch = "state_mismatch";
var stateNotFound = "state_not_found";
var nonceMismatch = "nonce_mismatch";
var authTimeNotFound = "auth_time_not_found";
var maxAgeTranspired = "max_age_transpired";
var multipleMatchingTokens = "multiple_matching_tokens";
var multipleMatchingAppMetadata = "multiple_matching_appMetadata";
var requestCannotBeMade = "request_cannot_be_made";
var cannotRemoveEmptyScope = "cannot_remove_empty_scope";
var cannotAppendScopeSet = "cannot_append_scopeset";
var emptyInputScopeSet = "empty_input_scopeset";
var noAccountInSilentRequest = "no_account_in_silent_request";
var invalidCacheRecord = "invalid_cache_record";
var invalidCacheEnvironment = "invalid_cache_environment";
var noAccountFound = "no_account_found";
var noCryptoObject = "no_crypto_object";
var unexpectedCredentialType = "unexpected_credential_type";
var tokenRefreshRequired = "token_refresh_required";
var tokenClaimsCnfRequiredForSignedJwt = "token_claims_cnf_required_for_signedjwt";
var authorizationCodeMissingFromServerResponse = "authorization_code_missing_from_server_response";
var bindingKeyNotRemoved = "binding_key_not_removed";
var endSessionEndpointNotSupported = "end_session_endpoint_not_supported";
var keyIdMissing = "key_id_missing";
var noNetworkConnectivity = "no_network_connectivity";
var userCanceled = "user_canceled";
var methodNotImplemented = "method_not_implemented";
var nestedAppAuthBridgeDisabled = "nested_app_auth_bridge_disabled";
var platformBrokerError = "platform_broker_error";
var resourceParameterRequired = "resource_parameter_required";
var misplacedResourceParam = "misplaced_resource_parameter";

// ../../node_modules/@azure/msal-common/dist-browser/logger/Logger.mjs
var LogLevel;
(function(LogLevel2) {
  LogLevel2[LogLevel2["Error"] = 0] = "Error";
  LogLevel2[LogLevel2["Warning"] = 1] = "Warning";
  LogLevel2[LogLevel2["Info"] = 2] = "Info";
  LogLevel2[LogLevel2["Verbose"] = 3] = "Verbose";
  LogLevel2[LogLevel2["Trace"] = 4] = "Trace";
})(LogLevel || (LogLevel = {}));
var CACHE_CAPACITY = 50;
var MAX_LOGS_PER_CORRELATION = 500;
var correlationCache = /* @__PURE__ */ new Map();
function markAsRecentlyUsed(correlationId, data) {
  correlationCache.delete(correlationId);
  correlationCache.set(correlationId, data);
}
function addLogToCache(correlationId, loggedMessage) {
  const currentTime = Date.now();
  let data = correlationCache.get(correlationId);
  if (data) {
    markAsRecentlyUsed(correlationId, data);
  } else {
    data = { logs: [], firstEventTime: currentTime };
    correlationCache.set(correlationId, data);
    if (correlationCache.size > CACHE_CAPACITY) {
      const firstKey = correlationCache.keys().next().value;
      if (firstKey) {
        correlationCache.delete(firstKey);
      }
    }
  }
  data.logs.push(__spreadProps(__spreadValues({}, loggedMessage), {
    milliseconds: currentTime - data.firstEventTime
  }));
  if (data.logs.length > MAX_LOGS_PER_CORRELATION) {
    data.logs.shift();
  }
}
function getAndFlushLogsFromCache(correlationId) {
  const res = [];
  for (const id of ["", correlationId]) {
    const data = correlationCache.get(id);
    res.push(...data?.logs ?? []);
    correlationCache.delete(id);
  }
  return res;
}
function isHashedString(str) {
  if (str.length !== 6) {
    return false;
  }
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const isAlphaNumeric = char >= "a" && char <= "z" || char >= "A" && char <= "Z" || char >= "0" && char <= "9";
    if (!isAlphaNumeric) {
      return false;
    }
  }
  return true;
}
var Logger = class _Logger {
  constructor(loggerOptions, packageName, packageVersion) {
    this.level = LogLevel.Info;
    const defaultLoggerCallback = () => {
      return;
    };
    const setLoggerOptions = loggerOptions || _Logger.createDefaultLoggerOptions();
    this.localCallback = setLoggerOptions.loggerCallback || defaultLoggerCallback;
    this.piiLoggingEnabled = setLoggerOptions.piiLoggingEnabled || false;
    this.level = typeof setLoggerOptions.logLevel === "number" ? setLoggerOptions.logLevel : LogLevel.Info;
    this.packageName = packageName || "";
    this.packageVersion = packageVersion || "";
  }
  static createDefaultLoggerOptions() {
    return {
      loggerCallback: () => {
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Info
    };
  }
  /**
   * Create new Logger with existing configurations.
   */
  clone(packageName, packageVersion) {
    return new _Logger({
      loggerCallback: this.localCallback,
      piiLoggingEnabled: this.piiLoggingEnabled,
      logLevel: this.level
    }, packageName, packageVersion);
  }
  /**
   * Log message with required options.
   */
  logMessage(logMessage, options) {
    const correlationId = options.correlationId;
    const isHashedInput = isHashedString(logMessage);
    if (isHashedInput) {
      const loggedMessage = {
        hash: logMessage,
        level: options.logLevel,
        containsPii: options.containsPii || false,
        milliseconds: 0
        // Will be calculated in addLogToCache
      };
      addLogToCache(correlationId, loggedMessage);
    }
    if (options.logLevel > this.level || !this.piiLoggingEnabled && options.containsPii) {
      return;
    }
    const timestamp = (/* @__PURE__ */ new Date()).toUTCString();
    const logHeader = `[${timestamp}] : [${correlationId}]`;
    const log = `${logHeader} : ${this.packageName}@${this.packageVersion} : ${LogLevel[options.logLevel]} - ${logMessage}`;
    this.executeCallback(options.logLevel, log, options.containsPii || false);
  }
  /**
   * Execute callback with message.
   */
  executeCallback(level, message, containsPii) {
    if (this.localCallback) {
      this.localCallback(level, message, containsPii);
    }
  }
  /**
   * Logs error messages.
   */
  error(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Error,
      containsPii: false,
      correlationId
    });
  }
  /**
   * Logs error messages with PII.
   */
  errorPii(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Error,
      containsPii: true,
      correlationId
    });
  }
  /**
   * Logs warning messages.
   */
  warning(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Warning,
      containsPii: false,
      correlationId
    });
  }
  /**
   * Logs warning messages with PII.
   */
  warningPii(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Warning,
      containsPii: true,
      correlationId
    });
  }
  /**
   * Logs info messages.
   */
  info(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Info,
      containsPii: false,
      correlationId
    });
  }
  /**
   * Logs info messages with PII.
   */
  infoPii(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Info,
      containsPii: true,
      correlationId
    });
  }
  /**
   * Logs verbose messages.
   */
  verbose(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Verbose,
      containsPii: false,
      correlationId
    });
  }
  /**
   * Logs verbose messages with PII.
   */
  verbosePii(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Verbose,
      containsPii: true,
      correlationId
    });
  }
  /**
   * Logs trace messages.
   */
  trace(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Trace,
      containsPii: false,
      correlationId
    });
  }
  /**
   * Logs trace messages with PII.
   */
  tracePii(message, correlationId) {
    this.logMessage(message, {
      logLevel: LogLevel.Trace,
      containsPii: true,
      correlationId
    });
  }
  /**
   * Returns whether PII Logging is enabled or not.
   */
  isPiiLoggingEnabled() {
    return this.piiLoggingEnabled || false;
  }
};

// ../../node_modules/@azure/msal-common/dist-browser/authority/AuthorityOptions.mjs
var AzureCloudInstance = {
  // AzureCloudInstance is not specified.
  None: "none",
  // Microsoft Azure public cloud
  AzurePublic: "https://login.microsoftonline.com",
  // Microsoft PPE
  AzurePpe: "https://login.windows-ppe.net",
  // Microsoft Chinese national/regional cloud
  AzureChina: "https://login.chinacloudapi.cn",
  // Microsoft German national/regional cloud ("Black Forest")
  AzureGermany: "https://login.microsoftonline.de",
  // US Government cloud
  AzureUsGovernment: "https://login.microsoftonline.us"
};

// ../../node_modules/@azure/msal-common/dist-browser/authority/ProtocolMode.mjs
var ProtocolMode = {
  /**
   * Auth Code + PKCE with Entra ID (formerly AAD) specific optimizations and features
   */
  AAD: "AAD",
  /**
   * Auth Code + PKCE without Entra ID specific optimizations and features. For use only with non-Microsoft owned authorities.
   * Support is limited for this mode.
   */
  OIDC: "OIDC",
  /**
   * Encrypted Authorize Response (EAR) with Entra ID specific optimizations and features
   */
  EAR: "EAR"
};

// ../../node_modules/@azure/msal-common/dist-browser/telemetry/performance/PerformanceEvent.mjs
var PerformanceEventStatus = {
  NotStarted: 0,
  InProgress: 1,
  Completed: 2
};
var EXT_FIELD_PREFIX = "ext.";
var IntFields = /* @__PURE__ */ new Set([
  "accessTokenSize",
  "durationMs",
  "idTokenSize",
  "matsSilentStatus",
  "matsHttpStatus",
  "refreshTokenSize",
  "startTimeMs",
  "status",
  "multiMatchedAT",
  "multiMatchedID",
  "multiMatchedRT",
  "unencryptedCacheCount",
  "encryptedCacheExpiredCount",
  "oldAccountCount",
  "oldAccessCount",
  "oldIdCount",
  "oldRefreshCount",
  "currAccountCount",
  "currAccessCount",
  "currIdCount",
  "currRefreshCount",
  "expiredCacheRemovedCount",
  "upgradedCacheCount",
  "cacheMatchedAccounts",
  "networkRtt",
  "redirectBridgeTimeoutMs",
  "redirectBridgeMessageVersion"
]);

// ../../node_modules/@azure/msal-common/dist-browser/telemetry/performance/StubPerformanceClient.mjs
var StubPerformanceClient = class {
  generateId() {
    return "callback-id";
  }
  startMeasurement(measureName, correlationId) {
    return {
      end: () => null,
      discard: () => {
      },
      add: () => {
      },
      increment: () => {
      },
      event: {
        eventId: this.generateId(),
        status: PerformanceEventStatus.InProgress,
        authority: "",
        libraryName: "",
        libraryVersion: "",
        clientId: "",
        name: measureName,
        startTimeMs: Date.now(),
        correlationId: correlationId || ""
      }
    };
  }
  endMeasurement() {
    return null;
  }
  discardMeasurements() {
    return;
  }
  removePerformanceCallback() {
    return true;
  }
  addPerformanceCallback() {
    return "";
  }
  emitEvents() {
    return;
  }
  addFields() {
    return;
  }
  incrementFields() {
    return;
  }
  cacheEventByCorrelationId() {
    return;
  }
};

// ../../node_modules/@azure/msal-common/dist-browser/error/InteractionRequiredAuthErrorCodes.mjs
var InteractionRequiredAuthErrorCodes_exports = {};
__export(InteractionRequiredAuthErrorCodes_exports, {
  badToken: () => badToken,
  consentRequired: () => consentRequired,
  interactionRequired: () => interactionRequired,
  interruptedUser: () => interruptedUser,
  loginRequired: () => loginRequired,
  nativeAccountUnavailable: () => nativeAccountUnavailable,
  noTokensFound: () => noTokensFound,
  refreshTokenExpired: () => refreshTokenExpired,
  uxNotAllowed: () => uxNotAllowed
});
var noTokensFound = "no_tokens_found";
var nativeAccountUnavailable = "native_account_unavailable";
var refreshTokenExpired = "refresh_token_expired";
var uxNotAllowed = "ux_not_allowed";
var interactionRequired = "interaction_required";
var consentRequired = "consent_required";
var loginRequired = "login_required";
var badToken = "bad_token";
var interruptedUser = "interrupted_user";

// ../../node_modules/@azure/msal-common/dist-browser/error/InteractionRequiredAuthError.mjs
var InteractionRequiredServerErrorMessage = [
  interactionRequired,
  consentRequired,
  loginRequired,
  badToken,
  uxNotAllowed,
  interruptedUser
];
var InteractionRequiredAuthSubErrorMessage = [
  "message_only",
  "additional_action",
  "basic_action",
  "user_password_expired",
  "consent_required",
  "bad_token",
  "ux_not_allowed",
  "interrupted_user"
];
var InteractionRequiredAuthError = class _InteractionRequiredAuthError extends AuthError {
  constructor(errorCode, errorMessage, subError, timestamp, traceId, correlationId, claims, errorNo) {
    super(errorCode, errorMessage, subError);
    Object.setPrototypeOf(this, _InteractionRequiredAuthError.prototype);
    this.timestamp = timestamp || "";
    this.traceId = traceId || "";
    this.correlationId = correlationId || "";
    this.claims = claims || "";
    this.name = "InteractionRequiredAuthError";
    this.errorNo = errorNo;
  }
};
function isInteractionRequiredError(errorCode, errorString, subError) {
  const isInteractionRequiredErrorCode = !!errorCode && InteractionRequiredServerErrorMessage.indexOf(errorCode) > -1;
  const isInteractionRequiredSubError = !!subError && InteractionRequiredAuthSubErrorMessage.indexOf(subError) > -1;
  const isInteractionRequiredErrorDesc = !!errorString && InteractionRequiredServerErrorMessage.some((irErrorCode) => {
    return errorString.indexOf(irErrorCode) > -1;
  });
  return isInteractionRequiredErrorCode || isInteractionRequiredErrorDesc || isInteractionRequiredSubError;
}
function createInteractionRequiredAuthError(errorCode, errorMessage) {
  return new InteractionRequiredAuthError(errorCode, errorMessage);
}

// ../../node_modules/@azure/msal-common/dist-browser/error/ServerError.mjs
var ServerError = class _ServerError extends AuthError {
  constructor(errorCode, errorMessage, subError, errorNo, status) {
    super(errorCode, errorMessage, subError);
    this.name = "ServerError";
    this.errorNo = errorNo;
    this.status = status;
    Object.setPrototypeOf(this, _ServerError.prototype);
  }
};

// ../../node_modules/@azure/msal-common/dist-browser/request/BaseAuthRequest.mjs
function enforceResourceParameter(isMcp, request) {
  if (!isMcp) {
    return;
  }
  if (request.resource && (containsResourceParam(request.extraParameters) || containsResourceParam(request.extraQueryParameters))) {
    throw createClientAuthError(misplacedResourceParam);
  }
  if (!request.resource) {
    throw createClientAuthError(resourceParameterRequired);
  }
}
function containsResourceParam(params) {
  if (!params) {
    return false;
  }
  return Object.prototype.hasOwnProperty.call(params, "resource");
}

// ../../node_modules/@azure/msal-common/dist-browser/request/AuthenticationHeaderParser.mjs
var AuthenticationHeaderParser = class {
  constructor(headers) {
    this.headers = headers;
  }
  /**
   * This method parses the SHR nonce value out of either the Authentication-Info or WWW-Authenticate authentication headers.
   * @returns
   */
  getShrNonce() {
    const authenticationInfo = this.headers[HeaderNames.AuthenticationInfo];
    if (authenticationInfo) {
      const authenticationInfoChallenges = this.parseChallenges(authenticationInfo);
      if (authenticationInfoChallenges.nextnonce) {
        return authenticationInfoChallenges.nextnonce;
      }
      throw createClientConfigurationError(invalidAuthenticationHeader);
    }
    const wwwAuthenticate = this.headers[HeaderNames.WWWAuthenticate];
    if (wwwAuthenticate) {
      const wwwAuthenticateChallenges = this.parseChallenges(wwwAuthenticate);
      if (wwwAuthenticateChallenges.nonce) {
        return wwwAuthenticateChallenges.nonce;
      }
      throw createClientConfigurationError(invalidAuthenticationHeader);
    }
    throw createClientConfigurationError(missingNonceAuthenticationHeader);
  }
  /**
   * Parses an HTTP header's challenge set into a key/value map.
   * @param header
   * @returns
   */
  parseChallenges(header) {
    const schemeSeparator = header.indexOf(" ");
    const challenges = header.substr(schemeSeparator + 1).split(",");
    const challengeMap = {};
    challenges.forEach((challenge) => {
      const [key, value] = challenge.split("=");
      challengeMap[key] = unescape(value.replace(/['"]+/g, ""));
    });
    return challengeMap;
  }
};

// ../../node_modules/@azure/msal-common/dist-browser/error/AuthErrorCodes.mjs
var AuthErrorCodes_exports = {};
__export(AuthErrorCodes_exports, {
  postRequestFailed: () => postRequestFailed,
  unexpectedError: () => unexpectedError
});
var unexpectedError = "unexpected_error";
var postRequestFailed = "post_request_failed";

// ../../node_modules/@azure/msal-common/dist-browser/request/RequestParameterBuilder.mjs
var RequestParameterBuilder_exports = {};
__export(RequestParameterBuilder_exports, {
  addApplicationTelemetry: () => addApplicationTelemetry,
  addAuthorizationCode: () => addAuthorizationCode,
  addBrokerParameters: () => addBrokerParameters,
  addCcsOid: () => addCcsOid,
  addCcsUpn: () => addCcsUpn,
  addClaims: () => addClaims,
  addCliData: () => addCliData,
  addClientAssertion: () => addClientAssertion,
  addClientAssertionType: () => addClientAssertionType,
  addClientCapabilitiesToClaims: () => addClientCapabilitiesToClaims,
  addClientId: () => addClientId,
  addClientInfo: () => addClientInfo,
  addClientSecret: () => addClientSecret,
  addCodeChallengeParams: () => addCodeChallengeParams,
  addCodeVerifier: () => addCodeVerifier,
  addCorrelationId: () => addCorrelationId,
  addDeviceCode: () => addDeviceCode,
  addDomainHint: () => addDomainHint,
  addEARParameters: () => addEARParameters,
  addExtraParameters: () => addExtraParameters,
  addGrantType: () => addGrantType,
  addIdTokenHint: () => addIdTokenHint,
  addInstanceAware: () => addInstanceAware,
  addLibraryInfo: () => addLibraryInfo,
  addLoginHint: () => addLoginHint,
  addLogoutHint: () => addLogoutHint,
  addNativeBroker: () => addNativeBroker,
  addNonce: () => addNonce,
  addOboAssertion: () => addOboAssertion,
  addPassword: () => addPassword,
  addPopToken: () => addPopToken,
  addPostLogoutRedirectUri: () => addPostLogoutRedirectUri,
  addPrompt: () => addPrompt,
  addRedirectUri: () => addRedirectUri,
  addRefreshToken: () => addRefreshToken,
  addRequestTokenUse: () => addRequestTokenUse,
  addResource: () => addResource,
  addResponseMode: () => addResponseMode,
  addResponseType: () => addResponseType,
  addScopes: () => addScopes,
  addServerTelemetry: () => addServerTelemetry,
  addSid: () => addSid,
  addSshJwk: () => addSshJwk,
  addState: () => addState,
  addThrottling: () => addThrottling,
  addUsername: () => addUsername,
  instrumentBrokerParams: () => instrumentBrokerParams
});

// ../../node_modules/@azure/msal-common/dist-browser/constants/AADServerParamKeys.mjs
var AADServerParamKeys_exports = {};
__export(AADServerParamKeys_exports, {
  ACCESS_TOKEN: () => ACCESS_TOKEN,
  BROKER_CLIENT_ID: () => BROKER_CLIENT_ID,
  BROKER_REDIRECT_URI: () => BROKER_REDIRECT_URI,
  CCS_HEADER: () => CCS_HEADER,
  CLAIMS: () => CLAIMS,
  CLIENT_ASSERTION: () => CLIENT_ASSERTION,
  CLIENT_ASSERTION_TYPE: () => CLIENT_ASSERTION_TYPE,
  CLIENT_ID: () => CLIENT_ID,
  CLIENT_INFO: () => CLIENT_INFO2,
  CLIENT_REQUEST_ID: () => CLIENT_REQUEST_ID,
  CLIENT_SECRET: () => CLIENT_SECRET,
  CLI_DATA: () => CLI_DATA,
  CODE: () => CODE,
  CODE_CHALLENGE: () => CODE_CHALLENGE,
  CODE_CHALLENGE_METHOD: () => CODE_CHALLENGE_METHOD,
  CODE_VERIFIER: () => CODE_VERIFIER,
  DEVICE_CODE: () => DEVICE_CODE,
  DOMAIN_HINT: () => DOMAIN_HINT,
  EAR_JWE_CRYPTO: () => EAR_JWE_CRYPTO,
  EAR_JWK: () => EAR_JWK,
  ERROR: () => ERROR,
  ERROR_DESCRIPTION: () => ERROR_DESCRIPTION,
  EXPIRES_IN: () => EXPIRES_IN,
  FOCI: () => FOCI,
  GRANT_TYPE: () => GRANT_TYPE,
  ID_TOKEN: () => ID_TOKEN,
  ID_TOKEN_HINT: () => ID_TOKEN_HINT,
  INSTANCE_AWARE: () => INSTANCE_AWARE,
  LOGIN_HINT: () => LOGIN_HINT,
  LOGOUT_HINT: () => LOGOUT_HINT,
  NATIVE_BROKER: () => NATIVE_BROKER,
  NONCE: () => NONCE,
  OBO_ASSERTION: () => OBO_ASSERTION,
  ON_BEHALF_OF: () => ON_BEHALF_OF,
  POST_LOGOUT_URI: () => POST_LOGOUT_URI,
  PROMPT: () => PROMPT,
  REDIRECT_URI: () => REDIRECT_URI,
  REFRESH_TOKEN: () => REFRESH_TOKEN,
  REFRESH_TOKEN_EXPIRES_IN: () => REFRESH_TOKEN_EXPIRES_IN,
  REQUESTED_TOKEN_USE: () => REQUESTED_TOKEN_USE,
  REQ_CNF: () => REQ_CNF,
  RESOURCE: () => RESOURCE,
  RESPONSE_MODE: () => RESPONSE_MODE,
  RESPONSE_TYPE: () => RESPONSE_TYPE,
  RETURN_SPA_CODE: () => RETURN_SPA_CODE,
  SCOPE: () => SCOPE,
  SESSION_STATE: () => SESSION_STATE,
  SID: () => SID,
  STATE: () => STATE,
  TOKEN_TYPE: () => TOKEN_TYPE,
  X_APP_NAME: () => X_APP_NAME,
  X_APP_VER: () => X_APP_VER,
  X_CLIENT_CPU: () => X_CLIENT_CPU,
  X_CLIENT_CURR_TELEM: () => X_CLIENT_CURR_TELEM,
  X_CLIENT_EXTRA_SKU: () => X_CLIENT_EXTRA_SKU,
  X_CLIENT_LAST_TELEM: () => X_CLIENT_LAST_TELEM,
  X_CLIENT_OS: () => X_CLIENT_OS,
  X_CLIENT_SKU: () => X_CLIENT_SKU,
  X_CLIENT_VER: () => X_CLIENT_VER,
  X_MS_LIB_CAPABILITY: () => X_MS_LIB_CAPABILITY
});
var CLIENT_ID = "client_id";
var REDIRECT_URI = "redirect_uri";
var RESPONSE_TYPE = "response_type";
var RESPONSE_MODE = "response_mode";
var GRANT_TYPE = "grant_type";
var CLAIMS = "claims";
var SCOPE = "scope";
var ERROR = "error";
var ERROR_DESCRIPTION = "error_description";
var ACCESS_TOKEN = "access_token";
var ID_TOKEN = "id_token";
var REFRESH_TOKEN = "refresh_token";
var EXPIRES_IN = "expires_in";
var REFRESH_TOKEN_EXPIRES_IN = "refresh_token_expires_in";
var STATE = "state";
var NONCE = "nonce";
var PROMPT = "prompt";
var SESSION_STATE = "session_state";
var CLIENT_INFO2 = "client_info";
var CODE = "code";
var CODE_CHALLENGE = "code_challenge";
var CODE_CHALLENGE_METHOD = "code_challenge_method";
var CODE_VERIFIER = "code_verifier";
var CLIENT_REQUEST_ID = "client-request-id";
var X_CLIENT_SKU = "x-client-SKU";
var X_CLIENT_VER = "x-client-VER";
var X_CLIENT_OS = "x-client-OS";
var X_CLIENT_CPU = "x-client-CPU";
var X_CLIENT_CURR_TELEM = "x-client-current-telemetry";
var X_CLIENT_LAST_TELEM = "x-client-last-telemetry";
var X_MS_LIB_CAPABILITY = "x-ms-lib-capability";
var X_APP_NAME = "x-app-name";
var X_APP_VER = "x-app-ver";
var POST_LOGOUT_URI = "post_logout_redirect_uri";
var ID_TOKEN_HINT = "id_token_hint";
var DEVICE_CODE = "device_code";
var CLIENT_SECRET = "client_secret";
var CLIENT_ASSERTION = "client_assertion";
var CLIENT_ASSERTION_TYPE = "client_assertion_type";
var TOKEN_TYPE = "token_type";
var REQ_CNF = "req_cnf";
var OBO_ASSERTION = "assertion";
var REQUESTED_TOKEN_USE = "requested_token_use";
var ON_BEHALF_OF = "on_behalf_of";
var FOCI = "foci";
var CCS_HEADER = "X-AnchorMailbox";
var RETURN_SPA_CODE = "return_spa_code";
var NATIVE_BROKER = "nativebroker";
var LOGOUT_HINT = "logout_hint";
var SID = "sid";
var LOGIN_HINT = "login_hint";
var DOMAIN_HINT = "domain_hint";
var X_CLIENT_EXTRA_SKU = "x-client-xtra-sku";
var BROKER_CLIENT_ID = "brk_client_id";
var BROKER_REDIRECT_URI = "brk_redirect_uri";
var INSTANCE_AWARE = "instance_aware";
var EAR_JWK = "ear_jwk";
var EAR_JWE_CRYPTO = "ear_jwe_crypto";
var RESOURCE = "resource";
var CLI_DATA = "clidata";

// ../../node_modules/@azure/msal-common/dist-browser/utils/StringUtils.mjs
var StringUtils = class {
  /**
   * Check if stringified object is empty
   * @param strObj
   */
  static isEmptyObj(strObj) {
    if (strObj) {
      try {
        const obj = JSON.parse(strObj);
        return Object.keys(obj).length === 0;
      } catch (e) {
      }
    }
    return true;
  }
  static startsWith(str, search) {
    return str.indexOf(search) === 0;
  }
  static endsWith(str, search) {
    return str.length >= search.length && str.lastIndexOf(search) === str.length - search.length;
  }
  /**
   * Parses string into an object.
   *
   * @param query
   */
  static queryStringToObject(query) {
    const obj = {};
    const params = query.split("&");
    const decode = (s) => decodeURIComponent(s.replace(/\+/g, " "));
    params.forEach((pair) => {
      if (pair.trim()) {
        const [key, value] = pair.split(/=(.+)/g, 2);
        if (key && value) {
          obj[decode(key)] = decode(value);
        }
      }
    });
    return obj;
  }
  /**
   * Trims entries in an array.
   *
   * @param arr
   */
  static trimArrayEntries(arr) {
    return arr.map((entry) => entry.trim());
  }
  /**
   * Removes empty strings from array
   * @param arr
   */
  static removeEmptyStringsFromArray(arr) {
    return arr.filter((entry) => {
      return !!entry;
    });
  }
  /**
   * Attempts to parse a string into JSON
   * @param str
   */
  static jsonParseHelper(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return null;
    }
  }
};

// ../../node_modules/@azure/msal-common/dist-browser/request/ScopeSet.mjs
var ScopeSet = class _ScopeSet {
  constructor(inputScopes) {
    const scopeArr = inputScopes ? StringUtils.trimArrayEntries([...inputScopes]) : [];
    const filteredInput = scopeArr ? StringUtils.removeEmptyStringsFromArray(scopeArr) : [];
    if (!filteredInput || !filteredInput.length) {
      throw createClientConfigurationError(emptyInputScopesError);
    }
    this.scopes = /* @__PURE__ */ new Set();
    filteredInput.forEach((scope) => this.scopes.add(scope));
  }
  /**
   * Factory method to create ScopeSet from space-delimited string
   * @param inputScopeString
   * @param appClientId
   * @param scopesRequired
   */
  static fromString(inputScopeString) {
    const scopeString = inputScopeString || "";
    const inputScopes = scopeString.split(" ");
    return new _ScopeSet(inputScopes);
  }
  /**
   * Creates the set of scopes to search for in cache lookups
   * @param inputScopeString
   * @returns
   */
  static createSearchScopes(inputScopeString) {
    const scopesToUse = inputScopeString && inputScopeString.length > 0 ? inputScopeString : [...OIDC_DEFAULT_SCOPES];
    const scopeSet = new _ScopeSet(scopesToUse);
    if (!scopeSet.containsOnlyOIDCScopes()) {
      scopeSet.removeOIDCScopes();
    } else {
      scopeSet.removeScope(OFFLINE_ACCESS_SCOPE);
    }
    return scopeSet;
  }
  /**
   * Check if a given scope is present in this set of scopes.
   * @param scope
   */
  containsScope(scope) {
    const lowerCaseScopes = this.printScopesLowerCase().split(" ");
    const lowerCaseScopesSet = new _ScopeSet(lowerCaseScopes);
    return scope ? lowerCaseScopesSet.scopes.has(scope.toLowerCase()) : false;
  }
  /**
   * Check if a set of scopes is present in this set of scopes.
   * @param scopeSet
   */
  containsScopeSet(scopeSet) {
    if (!scopeSet || scopeSet.scopes.size <= 0) {
      return false;
    }
    return this.scopes.size >= scopeSet.scopes.size && scopeSet.asArray().every((scope) => this.containsScope(scope));
  }
  /**
   * Check if set of scopes contains only the defaults
   */
  containsOnlyOIDCScopes() {
    let defaultScopeCount = 0;
    OIDC_SCOPES.forEach((defaultScope) => {
      if (this.containsScope(defaultScope)) {
        defaultScopeCount += 1;
      }
    });
    return this.scopes.size === defaultScopeCount;
  }
  /**
   * Appends single scope if passed
   * @param newScope
   */
  appendScope(newScope) {
    if (newScope) {
      this.scopes.add(newScope.trim());
    }
  }
  /**
   * Appends multiple scopes if passed
   * @param newScopes
   */
  appendScopes(newScopes) {
    try {
      newScopes.forEach((newScope) => this.appendScope(newScope));
    } catch (e) {
      throw createClientAuthError(cannotAppendScopeSet);
    }
  }
  /**
   * Removes element from set of scopes.
   * @param scope
   */
  removeScope(scope) {
    if (!scope) {
      throw createClientAuthError(cannotRemoveEmptyScope);
    }
    this.scopes.delete(scope.trim());
  }
  /**
   * Removes default scopes from set of scopes
   * Primarily used to prevent cache misses if the default scopes are not returned from the server
   */
  removeOIDCScopes() {
    OIDC_SCOPES.forEach((defaultScope) => {
      this.scopes.delete(defaultScope);
    });
  }
  /**
   * Combines an array of scopes with the current set of scopes.
   * @param otherScopes
   */
  unionScopeSets(otherScopes) {
    if (!otherScopes) {
      throw createClientAuthError(emptyInputScopeSet);
    }
    const unionScopes = /* @__PURE__ */ new Set();
    otherScopes.scopes.forEach((scope) => unionScopes.add(scope.toLowerCase()));
    this.scopes.forEach((scope) => unionScopes.add(scope.toLowerCase()));
    return unionScopes;
  }
  /**
   * Check if scopes intersect between this set and another.
   * @param otherScopes
   */
  intersectingScopeSets(otherScopes) {
    if (!otherScopes) {
      throw createClientAuthError(emptyInputScopeSet);
    }
    if (!otherScopes.containsOnlyOIDCScopes()) {
      otherScopes.removeOIDCScopes();
    }
    const unionScopes = this.unionScopeSets(otherScopes);
    const sizeOtherScopes = otherScopes.getScopeCount();
    const sizeThisScopes = this.getScopeCount();
    const sizeUnionScopes = unionScopes.size;
    return sizeUnionScopes < sizeThisScopes + sizeOtherScopes;
  }
  /**
   * Returns size of set of scopes.
   */
  getScopeCount() {
    return this.scopes.size;
  }
  /**
   * Returns the scopes as an array of string values
   */
  asArray() {
    const array = [];
    this.scopes.forEach((val) => array.push(val));
    return array;
  }
  /**
   * Prints scopes into a space-delimited string
   */
  printScopes() {
    if (this.scopes) {
      const scopeArr = this.asArray();
      return scopeArr.join(" ");
    }
    return "";
  }
  /**
   * Prints scopes into a space-delimited lower-case string (used for caching)
   */
  printScopesLowerCase() {
    return this.printScopes().toLowerCase();
  }
};

// ../../node_modules/@azure/msal-common/dist-browser/request/RequestParameterBuilder.mjs
function instrumentBrokerParams(parameters, correlationId, performanceClient) {
  if (!correlationId) {
    return;
  }
  const clientId = parameters.get(CLIENT_ID);
  if (clientId && parameters.has(BROKER_CLIENT_ID)) {
    performanceClient?.addFields({
      embeddedClientId: clientId,
      embeddedRedirectUri: parameters.get(REDIRECT_URI)
    }, correlationId);
  }
}
function addResponseType(parameters, responseType) {
  parameters.set(RESPONSE_TYPE, responseType);
}
function addResponseMode(parameters, responseMode) {
  parameters.set(RESPONSE_MODE, responseMode ? responseMode : ResponseMode.QUERY);
}
function addNativeBroker(parameters) {
  parameters.set(NATIVE_BROKER, "1");
}
function addScopes(parameters, scopes, addOidcScopes = true, defaultScopes = OIDC_DEFAULT_SCOPES) {
  if (addOidcScopes && !defaultScopes.includes("openid") && !scopes.includes("openid")) {
    defaultScopes.push("openid");
  }
  const requestScopes = addOidcScopes ? [...scopes || [], ...defaultScopes] : scopes || [];
  const scopeSet = new ScopeSet(requestScopes);
  parameters.set(SCOPE, scopeSet.printScopes());
}
function addClientId(parameters, clientId) {
  parameters.set(CLIENT_ID, clientId);
}
function addRedirectUri(parameters, redirectUri) {
  parameters.set(REDIRECT_URI, redirectUri);
}
function addPostLogoutRedirectUri(parameters, redirectUri) {
  parameters.set(POST_LOGOUT_URI, redirectUri);
}
function addIdTokenHint(parameters, idTokenHint) {
  parameters.set(ID_TOKEN_HINT, idTokenHint);
}
function addDomainHint(parameters, domainHint) {
  parameters.set(DOMAIN_HINT, domainHint);
}
function addLoginHint(parameters, loginHint) {
  parameters.set(LOGIN_HINT, loginHint);
}
function addCcsUpn(parameters, loginHint) {
  parameters.set(HeaderNames.CCS_HEADER, `UPN:${loginHint}`);
}
function addCcsOid(parameters, clientInfo) {
  parameters.set(HeaderNames.CCS_HEADER, `Oid:${clientInfo.uid}@${clientInfo.utid}`);
}
function addSid(parameters, sid) {
  parameters.set(SID, sid);
}
function addClaims(parameters, claims, clientCapabilities, skipBrokerClaims) {
  const configClaims = skipBrokerClaims && parameters.has(BROKER_CLIENT_ID) ? void 0 : clientCapabilities;
  if (!StringUtils.isEmptyObj(claims) || configClaims && configClaims.length > 0) {
    const mergedClaims = addClientCapabilitiesToClaims(claims, configClaims);
    try {
      JSON.parse(mergedClaims);
    } catch (e) {
      throw createClientConfigurationError(invalidClaims);
    }
    parameters.set(CLAIMS, mergedClaims);
  }
}
function addCorrelationId(parameters, correlationId) {
  parameters.set(CLIENT_REQUEST_ID, correlationId);
}
function addLibraryInfo(parameters, libraryInfo) {
  parameters.set(X_CLIENT_SKU, libraryInfo.sku);
  parameters.set(X_CLIENT_VER, libraryInfo.version);
  if (libraryInfo.os) {
    parameters.set(X_CLIENT_OS, libraryInfo.os);
  }
  if (libraryInfo.cpu) {
    parameters.set(X_CLIENT_CPU, libraryInfo.cpu);
  }
}
function addApplicationTelemetry(parameters, appTelemetry) {
  if (appTelemetry?.appName) {
    parameters.set(X_APP_NAME, appTelemetry.appName);
  }
  if (appTelemetry?.appVersion) {
    parameters.set(X_APP_VER, appTelemetry.appVersion);
  }
}
function addPrompt(parameters, prompt) {
  parameters.set(PROMPT, prompt);
}
function addState(parameters, state) {
  if (state) {
    parameters.set(STATE, state);
  }
}
function addNonce(parameters, nonce) {
  parameters.set(NONCE, nonce);
}
function addCodeChallengeParams(parameters, codeChallenge, codeChallengeMethod) {
  if (codeChallenge && codeChallengeMethod) {
    parameters.set(CODE_CHALLENGE, codeChallenge);
    parameters.set(CODE_CHALLENGE_METHOD, codeChallengeMethod);
  } else {
    throw createClientConfigurationError(pkceParamsMissing);
  }
}
function addAuthorizationCode(parameters, code) {
  parameters.set(CODE, code);
}
function addDeviceCode(parameters, code) {
  parameters.set(DEVICE_CODE, code);
}
function addRefreshToken(parameters, refreshToken) {
  parameters.set(REFRESH_TOKEN, refreshToken);
}
function addCodeVerifier(parameters, codeVerifier) {
  parameters.set(CODE_VERIFIER, codeVerifier);
}
function addClientSecret(parameters, clientSecret) {
  parameters.set(CLIENT_SECRET, clientSecret);
}
function addClientAssertion(parameters, clientAssertion) {
  if (clientAssertion) {
    parameters.set(CLIENT_ASSERTION, clientAssertion);
  }
}
function addClientAssertionType(parameters, clientAssertionType) {
  if (clientAssertionType) {
    parameters.set(CLIENT_ASSERTION_TYPE, clientAssertionType);
  }
}
function addOboAssertion(parameters, oboAssertion) {
  parameters.set(OBO_ASSERTION, oboAssertion);
}
function addRequestTokenUse(parameters, tokenUse) {
  parameters.set(REQUESTED_TOKEN_USE, tokenUse);
}
function addGrantType(parameters, grantType) {
  parameters.set(GRANT_TYPE, grantType);
}
function addClientInfo(parameters) {
  parameters.set(CLIENT_INFO, "1");
}
function addCliData(parameters) {
  parameters.set(CLI_DATA, "1");
}
function addInstanceAware(parameters) {
  if (!parameters.has(INSTANCE_AWARE)) {
    parameters.set(INSTANCE_AWARE, "true");
  }
}
function addExtraParameters(parameters, extraParams) {
  Object.entries(extraParams).forEach(([key, value]) => {
    if (!parameters.has(key) && value) {
      parameters.set(key, value);
    }
  });
}
function addClientCapabilitiesToClaims(claims, clientCapabilities) {
  let mergedClaims;
  if (!claims) {
    mergedClaims = {};
  } else {
    try {
      mergedClaims = JSON.parse(claims);
    } catch (e) {
      throw createClientConfigurationError(invalidClaims);
    }
  }
  if (clientCapabilities && clientCapabilities.length > 0) {
    if (!mergedClaims.hasOwnProperty(ClaimsRequestKeys.ACCESS_TOKEN)) {
      mergedClaims[ClaimsRequestKeys.ACCESS_TOKEN] = {};
    }
    mergedClaims[ClaimsRequestKeys.ACCESS_TOKEN][ClaimsRequestKeys.XMS_CC] = {
      values: clientCapabilities
    };
  }
  return JSON.stringify(mergedClaims);
}
function addUsername(parameters, username) {
  parameters.set(PasswordGrantConstants.username, username);
}
function addPassword(parameters, password) {
  parameters.set(PasswordGrantConstants.password, password);
}
function addPopToken(parameters, cnfString) {
  if (cnfString) {
    parameters.set(TOKEN_TYPE, AuthenticationScheme.POP);
    parameters.set(REQ_CNF, cnfString);
  }
}
function addSshJwk(parameters, sshJwkString) {
  if (sshJwkString) {
    parameters.set(TOKEN_TYPE, AuthenticationScheme.SSH);
    parameters.set(REQ_CNF, sshJwkString);
  }
}
function addServerTelemetry(parameters, serverTelemetryManager) {
  parameters.set(X_CLIENT_CURR_TELEM, serverTelemetryManager.generateCurrentRequestHeaderValue());
  parameters.set(X_CLIENT_LAST_TELEM, serverTelemetryManager.generateLastRequestHeaderValue());
}
function addThrottling(parameters) {
  parameters.set(X_MS_LIB_CAPABILITY, X_MS_LIB_CAPABILITY_VALUE);
}
function addLogoutHint(parameters, logoutHint) {
  parameters.set(LOGOUT_HINT, logoutHint);
}
function addBrokerParameters(parameters, brokerClientId, brokerRedirectUri) {
  if (!parameters.has(BROKER_CLIENT_ID)) {
    parameters.set(BROKER_CLIENT_ID, brokerClientId);
  }
  if (!parameters.has(BROKER_REDIRECT_URI)) {
    parameters.set(BROKER_REDIRECT_URI, brokerRedirectUri);
  }
}
function addEARParameters(parameters, jwk) {
  parameters.set(EAR_JWK, encodeURIComponent(jwk));
  const jweCryptoB64Encoded = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0";
  parameters.set(EAR_JWE_CRYPTO, jweCryptoB64Encoded);
}
function addResource(parameters, resource) {
  if (resource) {
    parameters.set(RESOURCE, resource);
  }
}

// ../../node_modules/@azure/msal-common/dist-browser/utils/UrlUtils.mjs
var UrlUtils_exports = {};
__export(UrlUtils_exports, {
  getDeserializedResponse: () => getDeserializedResponse,
  mapToQueryString: () => mapToQueryString,
  normalizeUrlForComparison: () => normalizeUrlForComparison,
  stripLeadingHashOrQuery: () => stripLeadingHashOrQuery
});
function canonicalizeUrl(url) {
  if (!url) {
    return url;
  }
  let lowerCaseUrl = url.toLowerCase();
  if (StringUtils.endsWith(lowerCaseUrl, "?")) {
    lowerCaseUrl = lowerCaseUrl.slice(0, -1);
  } else if (StringUtils.endsWith(lowerCaseUrl, "?/")) {
    lowerCaseUrl = lowerCaseUrl.slice(0, -2);
  }
  if (!StringUtils.endsWith(lowerCaseUrl, "/")) {
    lowerCaseUrl += "/";
  }
  return lowerCaseUrl;
}
function stripLeadingHashOrQuery(responseString) {
  if (responseString.startsWith("#/")) {
    return responseString.substring(2);
  } else if (responseString.startsWith("#") || responseString.startsWith("?")) {
    return responseString.substring(1);
  }
  return responseString;
}
function getDeserializedResponse(responseString) {
  if (!responseString || responseString.indexOf("=") < 0) {
    return null;
  }
  try {
    const normalizedResponse = stripLeadingHashOrQuery(responseString);
    const deserializedHash = Object.fromEntries(new URLSearchParams(normalizedResponse));
    if (deserializedHash.code || deserializedHash.ear_jwe || deserializedHash.error || deserializedHash.error_description || deserializedHash.state) {
      return deserializedHash;
    }
  } catch (e) {
    throw createClientAuthError(hashNotDeserialized);
  }
  return null;
}
function mapToQueryString(parameters) {
  const queryParameterArray = new Array();
  parameters.forEach((value, key) => {
    queryParameterArray.push(`${key}=${encodeURIComponent(value)}`);
  });
  return queryParameterArray.join("&");
}
function normalizeUrlForComparison(url) {
  if (!url) {
    return url;
  }
  const urlWithoutHash = url.split("#")[0];
  try {
    const urlObj = new URL(urlWithoutHash);
    const normalizedUrl = urlObj.origin + urlObj.pathname + urlObj.search;
    return canonicalizeUrl(normalizedUrl);
  } catch (e) {
    return canonicalizeUrl(urlWithoutHash);
  }
}

// ../../node_modules/@azure/msal-common/dist-browser/crypto/ICrypto.mjs
var DEFAULT_CRYPTO_IMPLEMENTATION = {
  createNewGuid: () => {
    throw createClientAuthError(methodNotImplemented);
  },
  base64Decode: () => {
    throw createClientAuthError(methodNotImplemented);
  },
  base64Encode: () => {
    throw createClientAuthError(methodNotImplemented);
  },
  base64UrlEncode: () => {
    throw createClientAuthError(methodNotImplemented);
  },
  encodeKid: () => {
    throw createClientAuthError(methodNotImplemented);
  },
  async getPublicKeyThumbprint() {
    throw createClientAuthError(methodNotImplemented);
  },
  async removeTokenBindingKey() {
    throw createClientAuthError(methodNotImplemented);
  },
  async clearKeystore() {
    throw createClientAuthError(methodNotImplemented);
  },
  async signJwt() {
    throw createClientAuthError(methodNotImplemented);
  },
  async hashString() {
    throw createClientAuthError(methodNotImplemented);
  }
};

// ../../node_modules/@azure/msal-common/dist-browser/packageMetadata.mjs
var name = "@azure/msal-common";
var version = "16.6.2";

// ../../node_modules/@azure/msal-common/dist-browser/account/AccountInfo.mjs
function tenantIdMatchesHomeTenant(tenantId, homeAccountId) {
  return !!tenantId && !!homeAccountId && tenantId === homeAccountId.split(".")[1];
}
function buildTenantProfile(homeAccountId, localAccountId, tenantId, idTokenClaims) {
  if (idTokenClaims) {
    const { oid, sub, tid, name: name2, tfp, acr, preferred_username, upn, login_hint } = idTokenClaims;
    const tenantId2 = tid || tfp || acr || "";
    return {
      tenantId: tenantId2,
      localAccountId: oid || sub || "",
      name: name2,
      username: preferred_username || upn || "",
      loginHint: login_hint,
      isHomeTenant: tenantIdMatchesHomeTenant(tenantId2, homeAccountId),
      upn
    };
  } else {
    return {
      tenantId,
      localAccountId,
      username: "",
      isHomeTenant: tenantIdMatchesHomeTenant(tenantId, homeAccountId)
    };
  }
}
function updateAccountTenantProfileData(baseAccountInfo, tenantProfile, idTokenClaims, idTokenSecret) {
  let updatedAccountInfo = baseAccountInfo;
  if (tenantProfile) {
    const _a = tenantProfile, { isHomeTenant } = _a, tenantProfileOverride = __objRest(_a, ["isHomeTenant"]);
    updatedAccountInfo = __spreadValues(__spreadValues({}, baseAccountInfo), tenantProfileOverride);
  }
  if (idTokenClaims) {
    const _b = buildTenantProfile(baseAccountInfo.homeAccountId, baseAccountInfo.localAccountId, baseAccountInfo.tenantId, idTokenClaims), { isHomeTenant } = _b, claimsSourcedTenantProfile = __objRest(_b, ["isHomeTenant"]);
    updatedAccountInfo = __spreadProps(__spreadValues(__spreadValues({}, updatedAccountInfo), claimsSourcedTenantProfile), {
      idTokenClaims,
      idToken: idTokenSecret
    });
    return updatedAccountInfo;
  }
  return updatedAccountInfo;
}

// ../../node_modules/@azure/msal-common/dist-browser/account/AuthToken.mjs
var AuthToken_exports = {};
__export(AuthToken_exports, {
  checkMaxAge: () => checkMaxAge,
  extractTokenClaims: () => extractTokenClaims,
  getJWSPayload: () => getJWSPayload,
  isKmsi: () => isKmsi
});
function extractTokenClaims(encodedToken, base64Decode2) {
  const jswPayload = getJWSPayload(encodedToken);
  try {
    const base64Decoded = base64Decode2(jswPayload);
    return JSON.parse(base64Decoded);
  } catch (err) {
    throw createClientAuthError(tokenParsingError);
  }
}
function isKmsi(idTokenClaims) {
  if (!idTokenClaims.signin_state) {
    return false;
  }
  const kmsiClaims = ["kmsi", "dvc_dmjd"];
  return idTokenClaims.signin_state.some((value) => kmsiClaims.includes(value.trim().toLowerCase()));
}
function getJWSPayload(authToken) {
  if (!authToken) {
    throw createClientAuthError(nullOrEmptyToken);
  }
  const tokenPartsRegex = /^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/;
  const matches = tokenPartsRegex.exec(authToken);
  if (!matches || matches.length < 4) {
    throw createClientAuthError(tokenParsingError);
  }
  return matches[2];
}
function checkMaxAge(authTime, maxAge) {
  const fiveMinuteSkew = 3e5;
  if (maxAge === 0 || Date.now() - fiveMinuteSkew > authTime + maxAge) {
    throw createClientAuthError(maxAgeTranspired);
  }
}

// ../../node_modules/@azure/msal-common/dist-browser/url/UrlString.mjs
var UrlString = class _UrlString {
  get urlString() {
    return this._urlString;
  }
  constructor(url) {
    this._urlString = url;
    if (!this._urlString) {
      throw createClientConfigurationError(urlEmptyError);
    }
    if (!url.includes("#")) {
      this._urlString = _UrlString.canonicalizeUri(url);
    }
  }
  /**
   * Ensure urls are lower case and end with a / character.
   * @param url
   */
  static canonicalizeUri(url) {
    if (url) {
      let lowerCaseUrl = url.toLowerCase();
      if (StringUtils.endsWith(lowerCaseUrl, "?")) {
        lowerCaseUrl = lowerCaseUrl.slice(0, -1);
      } else if (StringUtils.endsWith(lowerCaseUrl, "?/")) {
        lowerCaseUrl = lowerCaseUrl.slice(0, -2);
      }
      if (!StringUtils.endsWith(lowerCaseUrl, "/")) {
        lowerCaseUrl += "/";
      }
      return lowerCaseUrl;
    }
    return url;
  }
  /**
   * Throws if urlString passed is not a valid authority URI string.
   */
  validateAsUri() {
    let components;
    try {
      components = this.getUrlComponents();
    } catch (e) {
      throw createClientConfigurationError(urlParseError);
    }
    if (!components.HostNameAndPort || !components.PathSegments) {
      throw createClientConfigurationError(urlParseError);
    }
    if (!components.Protocol || components.Protocol.toLowerCase() !== "https:") {
      throw createClientConfigurationError(authorityUriInsecure);
    }
  }
  /**
   * Given a url and a query string return the url with provided query string appended
   * @param url
   * @param queryString
   */
  static appendQueryString(url, queryString) {
    if (!queryString) {
      return url;
    }
    return url.indexOf("?") < 0 ? `${url}?${queryString}` : `${url}&${queryString}`;
  }
  /**
   * Returns a url with the hash removed
   * @param url
   */
  static removeHashFromUrl(url) {
    return _UrlString.canonicalizeUri(url.split("#")[0]);
  }
  /**
   * Given a url like https://a:b/common/d?e=f#g, and a tenantId, returns https://a:b/tenantId/d
   * @param href The url
   * @param tenantId The tenant id to replace
   */
  replaceTenantPath(tenantId) {
    const urlObject = this.getUrlComponents();
    const pathArray = urlObject.PathSegments;
    if (tenantId && pathArray.length !== 0 && (pathArray[0] === AADAuthority.COMMON || pathArray[0] === AADAuthority.ORGANIZATIONS)) {
      pathArray[0] = tenantId;
    }
    return _UrlString.constructAuthorityUriFromObject(urlObject);
  }
  /**
   * Parses out the components from a url string.
   * @returns An object with the various components. Please cache this value insted of calling this multiple times on the same url.
   */
  getUrlComponents() {
    const regEx = RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");
    const match = this.urlString.match(regEx);
    if (!match) {
      throw createClientConfigurationError(urlParseError);
    }
    const urlComponents = {
      Protocol: match[1],
      HostNameAndPort: match[4],
      AbsolutePath: match[5],
      QueryString: match[7]
    };
    let pathSegments = urlComponents.AbsolutePath.split("/");
    pathSegments = pathSegments.filter((val) => val && val.length > 0);
    urlComponents.PathSegments = pathSegments;
    if (urlComponents.QueryString && urlComponents.QueryString.endsWith("/")) {
      urlComponents.QueryString = urlComponents.QueryString.substring(0, urlComponents.QueryString.length - 1);
    }
    return urlComponents;
  }
  static getDomainFromUrl(url) {
    const regEx = RegExp("^([^:/?#]+://)?([^/?#]*)");
    const match = url.match(regEx);
    if (!match) {
      throw createClientConfigurationError(urlParseError);
    }
    return match[2];
  }
  static getAbsoluteUrl(relativeUrl, baseUrl) {
    if (relativeUrl[0] === FORWARD_SLASH) {
      const url = new _UrlString(baseUrl);
      const baseComponents = url.getUrlComponents();
      return baseComponents.Protocol + "//" + baseComponents.HostNameAndPort + relativeUrl;
    }
    return relativeUrl;
  }
  static constructAuthorityUriFromObject(urlObject) {
    return new _UrlString(urlObject.Protocol + "//" + urlObject.HostNameAndPort + "/" + urlObject.PathSegments.join("/"));
  }
};

// ../../node_modules/@azure/msal-common/dist-browser/authority/AuthorityMetadata.mjs
var endpointHosts = [
  { host: "login.microsoftonline.com" },
  {
    host: "login.chinacloudapi.cn",
    issuerHost: "login.partner.microsoftonline.cn"
    // Issuer differs
  },
  { host: "login.microsoftonline.us" },
  { host: "login.sovcloud-identity.fr" },
  { host: "login.sovcloud-identity.de" },
  { host: "login.sovcloud-identity.sg" }
];
function buildOpenIdConfig(host, issuerHost) {
  return {
    token_endpoint: `https://${host}/{tenantid}/oauth2/v2.0/token`,
    jwks_uri: `https://${host}/{tenantid}/discovery/v2.0/keys`,
    issuer: `https://${issuerHost}/{tenantid}/v2.0`,
    authorization_endpoint: `https://${host}/{tenantid}/oauth2/v2.0/authorize`,
    end_session_endpoint: `https://${host}/{tenantid}/oauth2/v2.0/logout`
  };
}
var dynamicEndpointMetadata = endpointHosts.reduce((acc, { host, issuerHost }) => {
  acc[host] = buildOpenIdConfig(host, issuerHost || host);
  return acc;
}, {});
var rawMetdataJSON = {
  endpointMetadata: dynamicEndpointMetadata,
  instanceDiscoveryMetadata: {
    metadata: [
      {
        preferred_network: "login.microsoftonline.com",
        preferred_cache: "login.windows.net",
        aliases: [
          "login.microsoftonline.com",
          "login.windows.net",
          "login.microsoft.com",
          "sts.windows.net"
        ]
      },
      {
        preferred_network: "login.partner.microsoftonline.cn",
        preferred_cache: "login.partner.microsoftonline.cn",
        aliases: [
          "login.partner.microsoftonline.cn",
          "login.chinacloudapi.cn"
        ]
      },
      {
        preferred_network: "login.microsoftonline.de",
        preferred_cache: "login.microsoftonline.de",
        aliases: ["login.microsoftonline.de"]
      },
      {
        preferred_network: "login.microsoftonline.us",
        preferred_cache: "login.microsoftonline.us",
        aliases: [
          "login.microsoftonline.us",
          "login.usgovcloudapi.net"
        ]
      },
      {
        preferred_network: "login-us.microsoftonline.com",
        preferred_cache: "login-us.microsoftonline.com",
        aliases: ["login-us.microsoftonline.com"]
      },
      {
        preferred_network: "login.sovcloud-identity.fr",
        preferred_cache: "login.sovcloud-identity.fr",
        aliases: ["login.sovcloud-identity.fr"]
      },
      {
        preferred_network: "login.sovcloud-identity.de",
        preferred_cache: "login.sovcloud-identity.de",
        aliases: ["login.sovcloud-identity.de"]
      },
      {
        preferred_network: "login.sovcloud-identity.sg",
        preferred_cache: "login.sovcloud-identity.sg",
        aliases: ["login.sovcloud-identity.sg"]
      },
      {
        preferred_network: "login.windows-ppe.net",
        preferred_cache: "login.windows-ppe.net",
        aliases: [
          "login.windows-ppe.net",
          "sts.windows-ppe.net",
          "login.microsoft-ppe.com"
        ]
      }
    ]
  }
};
var EndpointMetadata = rawMetdataJSON.endpointMetadata;
var InstanceDiscoveryMetadata = rawMetdataJSON.instanceDiscoveryMetadata;
var InstanceDiscoveryMetadataAliases = /* @__PURE__ */ new Set();
InstanceDiscoveryMetadata.metadata.forEach((metadataEntry) => {
  metadataEntry.aliases.forEach((alias) => {
    InstanceDiscoveryMetadataAliases.add(alias);
  });
});
function getAliasesFromStaticSources(staticAuthorityOptions, logger, correlationId) {
  let staticAliases;
  const canonicalAuthority = staticAuthorityOptions.canonicalAuthority;
  if (canonicalAuthority) {
    const authorityHost = new UrlString(canonicalAuthority).getUrlComponents().HostNameAndPort;
    staticAliases = getAliasesFromMetadata(logger, correlationId, authorityHost, staticAuthorityOptions.cloudDiscoveryMetadata?.metadata) || getAliasesFromMetadata(logger, correlationId, authorityHost, InstanceDiscoveryMetadata.metadata) || staticAuthorityOptions.knownAuthorities;
  }
  return staticAliases || [];
}
function getAliasesFromMetadata(logger, correlationId, authorityHost, cloudDiscoveryMetadata, source) {
  logger.trace("1bmquz", correlationId);
  if (authorityHost && cloudDiscoveryMetadata) {
    const metadata = getCloudDiscoveryMetadataFromNetworkResponse(cloudDiscoveryMetadata, authorityHost);
    if (metadata) {
      logger.trace("1fotbt", correlationId);
      return metadata.aliases;
    } else {
      logger.trace("14avvj", correlationId);
    }
  }
  return null;
}
function getCloudDiscoveryMetadataFromHardcodedValues(authorityHost) {
  const metadata = getCloudDiscoveryMetadataFromNetworkResponse(InstanceDiscoveryMetadata.metadata, authorityHost);
  return metadata;
}
function getCloudDiscoveryMetadataFromNetworkResponse(response, authorityHost) {
  for (let i = 0; i < response.length; i++) {
    const metadata = response[i];
    if (metadata.aliases.includes(authorityHost)) {
      return metadata;
    }
  }
  return null;
}

// ../../node_modules/@azure/msal-common/dist-browser/error/CacheErrorCodes.mjs
var CacheErrorCodes_exports = {};
__export(CacheErrorCodes_exports, {
  cacheErrorUnknown: () => cacheErrorUnknown,
  cacheQuotaExceeded: () => cacheQuotaExceeded
});
var cacheQuotaExceeded = "cache_quota_exceeded";
var cacheErrorUnknown = "cache_error_unknown";

// ../../node_modules/@azure/msal-common/dist-browser/error/CacheError.mjs
var CacheError = class _CacheError extends Error {
  constructor(errorCode, errorMessage) {
    const message = errorMessage || getDefaultErrorMessage(errorCode);
    super(message);
    Object.setPrototypeOf(this, _CacheError.prototype);
    this.name = "CacheError";
    this.errorCode = errorCode;
    this.errorMessage = message;
  }
};
function createCacheError(e) {
  if (!(e instanceof Error)) {
    return new CacheError(cacheErrorUnknown);
  }
  if (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED" || e.message.includes("exceeded the quota")) {
    return new CacheError(cacheQuotaExceeded);
  } else {
    return new CacheError(e.name, e.message);
  }
}

// ../../node_modules/@azure/msal-common/dist-browser/cache/utils/AccountEntityUtils.mjs
var AccountEntityUtils_exports = {};
__export(AccountEntityUtils_exports, {
  createAccountEntity: () => createAccountEntity,
  createAccountEntityFromAccountInfo: () => createAccountEntityFromAccountInfo,
  generateAccountId: () => generateAccountId,
  generateHomeAccountId: () => generateHomeAccountId,
  getAccountInfo: () => getAccountInfo,
  isAccountEntity: () => isAccountEntity,
  isSingleTenant: () => isSingleTenant
});

// ../../node_modules/@azure/msal-common/dist-browser/account/ClientInfo.mjs
function buildClientInfo(rawClientInfo, base64Decode2) {
  if (!rawClientInfo) {
    throw createClientAuthError(clientInfoEmptyError);
  }
  try {
    const decodedClientInfo = base64Decode2(rawClientInfo);
    return JSON.parse(decodedClientInfo);
  } catch (e) {
    throw createClientAuthError(clientInfoDecodingError);
  }
}
function buildClientInfoFromHomeAccountId(homeAccountId) {
  if (!homeAccountId) {
    throw createClientAuthError(clientInfoDecodingError);
  }
  const clientInfoParts = homeAccountId.split(CLIENT_INFO_SEPARATOR, 2);
  return {
    uid: clientInfoParts[0],
    utid: clientInfoParts.length < 2 ? "" : clientInfoParts[1]
  };
}

// ../../node_modules/@azure/msal-common/dist-browser/authority/AuthorityType.mjs
var AuthorityType = {
  Default: 0,
  Adfs: 1,
  Dsts: 2,
  Ciam: 3
};

// ../../node_modules/@azure/msal-common/dist-browser/account/TokenClaims.mjs
function getTenantIdFromIdTokenClaims(idTokenClaims) {
  if (idTokenClaims) {
    const tenantId = idTokenClaims.tid || idTokenClaims.tfp || idTokenClaims.acr;
    return tenantId || null;
  }
  return null;
}

// ../../node_modules/@azure/msal-common/dist-browser/cache/utils/AccountEntityUtils.mjs
function generateAccountId(accountEntity) {
  const accountId = [
    accountEntity.homeAccountId,
    accountEntity.environment
  ];
  return accountId.join(CACHE_KEY_SEPARATOR).toLowerCase();
}
function getAccountInfo(accountEntity) {
  const tenantProfiles = accountEntity.tenantProfiles || [];
  if (tenantProfiles.length === 0 && accountEntity.realm && accountEntity.localAccountId) {
    tenantProfiles.push(buildTenantProfile(accountEntity.homeAccountId, accountEntity.localAccountId, accountEntity.realm));
  }
  return {
    homeAccountId: accountEntity.homeAccountId,
    environment: accountEntity.environment,
    tenantId: accountEntity.realm,
    username: accountEntity.username,
    localAccountId: accountEntity.localAccountId,
    loginHint: accountEntity.loginHint,
    name: accountEntity.name,
    nativeAccountId: accountEntity.nativeAccountId,
    authorityType: accountEntity.authorityType,
    // Deserialize tenant profiles array into a Map
    tenantProfiles: new Map(tenantProfiles.map((tenantProfile) => {
      return [tenantProfile.tenantId, tenantProfile];
    })),
    dataBoundary: accountEntity.dataBoundary
  };
}
function isSingleTenant(accountEntity) {
  return !accountEntity.tenantProfiles;
}
function createAccountEntity(accountDetails, authority, base64Decode2) {
  let authorityType;
  if (authority.authorityType === AuthorityType.Adfs) {
    authorityType = CACHE_ACCOUNT_TYPE_ADFS;
  } else if (authority.protocolMode === ProtocolMode.OIDC) {
    authorityType = CACHE_ACCOUNT_TYPE_GENERIC;
  } else {
    authorityType = CACHE_ACCOUNT_TYPE_MSSTS;
  }
  let clientInfo;
  let dataBoundary;
  if (accountDetails.clientInfo && base64Decode2) {
    clientInfo = buildClientInfo(accountDetails.clientInfo, base64Decode2);
    if (clientInfo.xms_tdbr) {
      dataBoundary = clientInfo.xms_tdbr === "EU" ? "EU" : "None";
    }
  }
  const env = accountDetails.environment || authority && authority.getPreferredCache();
  if (!env) {
    throw createClientAuthError(invalidCacheEnvironment);
  }
  const preferredUsername = accountDetails.idTokenClaims?.preferred_username || accountDetails.idTokenClaims?.upn;
  const email = accountDetails.idTokenClaims?.emails ? accountDetails.idTokenClaims.emails[0] : null;
  const username = preferredUsername || email || "";
  const loginHint = accountDetails.idTokenClaims?.login_hint;
  const realm = clientInfo?.utid || getTenantIdFromIdTokenClaims(accountDetails.idTokenClaims) || "";
  const localAccountId = clientInfo?.uid || accountDetails.idTokenClaims?.oid || accountDetails.idTokenClaims?.sub || "";
  let tenantProfiles;
  if (accountDetails.tenantProfiles) {
    tenantProfiles = accountDetails.tenantProfiles;
  } else {
    const tenantProfile = buildTenantProfile(accountDetails.homeAccountId, localAccountId, realm, accountDetails.idTokenClaims);
    tenantProfiles = [tenantProfile];
  }
  return {
    homeAccountId: accountDetails.homeAccountId,
    environment: env,
    realm,
    localAccountId,
    username,
    authorityType,
    loginHint,
    clientInfo: accountDetails.clientInfo,
    name: accountDetails.idTokenClaims?.name || "",
    lastModificationTime: void 0,
    lastModificationApp: void 0,
    cloudGraphHostName: accountDetails.cloudGraphHostName,
    msGraphHost: accountDetails.msGraphHost,
    nativeAccountId: accountDetails.nativeAccountId,
    tenantProfiles,
    dataBoundary
  };
}
function createAccountEntityFromAccountInfo(accountInfo, cloudGraphHostName, msGraphHost) {
  const tenantProfiles = Array.from(accountInfo.tenantProfiles?.values() || []);
  if (tenantProfiles.length === 0 && accountInfo.tenantId && accountInfo.localAccountId) {
    tenantProfiles.push(buildTenantProfile(accountInfo.homeAccountId, accountInfo.localAccountId, accountInfo.tenantId, accountInfo.idTokenClaims));
  }
  return {
    authorityType: accountInfo.authorityType || CACHE_ACCOUNT_TYPE_GENERIC,
    homeAccountId: accountInfo.homeAccountId,
    localAccountId: accountInfo.localAccountId,
    nativeAccountId: accountInfo.nativeAccountId,
    realm: accountInfo.tenantId,
    environment: accountInfo.environment,
    username: accountInfo.username,
    loginHint: accountInfo.loginHint,
    name: accountInfo.name,
    cloudGraphHostName,
    msGraphHost,
    tenantProfiles,
    dataBoundary: accountInfo.dataBoundary
  };
}
function generateHomeAccountId(serverClientInfo, authType, logger, cryptoObj, correlationId, idTokenClaims) {
  if (!(authType === AuthorityType.Adfs || authType === AuthorityType.Dsts)) {
    if (serverClientInfo) {
      try {
        const clientInfo = buildClientInfo(serverClientInfo, cryptoObj.base64Decode);
        if (clientInfo.uid && clientInfo.utid) {
          return `${clientInfo.uid}.${clientInfo.utid}`;
        }
      } catch (e) {
      }
    }
    logger.warning("1ub6wv", correlationId);
  }
  return idTokenClaims?.sub || "";
}
function isAccountEntity(entity) {
  if (!entity) {
    return false;
  }
  return entity.hasOwnProperty("homeAccountId") && entity.hasOwnProperty("environment") && entity.hasOwnProperty("realm") && entity.hasOwnProperty("localAccountId") && entity.hasOwnProperty("username") && entity.hasOwnProperty("authorityType");
}

// ../../node_modules/@azure/msal-common/dist-browser/cache/CacheManager.mjs
var CacheManager = class {
  constructor(clientId, cryptoImpl, logger, performanceClient, staticAuthorityOptions) {
    this.clientId = clientId;
    this.cryptoImpl = cryptoImpl;
    this.commonLogger = logger.clone(name, version);
    this.staticAuthorityOptions = staticAuthorityOptions;
    this.performanceClient = performanceClient;
  }
  /**
   * Returns all the accounts in the cache that match the optional filter. If no filter is provided, all accounts are returned.
   * @param accountFilter - (Optional) filter to narrow down the accounts returned
   * @returns Array of AccountInfo objects in cache
   */
  getAllAccounts(accountFilter = {}, correlationId) {
    return this.buildTenantProfiles(this.getAccountsFilteredBy(accountFilter, correlationId), correlationId, accountFilter);
  }
  /**
   * Gets first tenanted AccountInfo object found based on provided filters
   */
  getAccountInfoFilteredBy(accountFilter, correlationId) {
    if (Object.keys(accountFilter).length === 0 || Object.values(accountFilter).every((value) => value === null || value === void 0 || value === "")) {
      this.commonLogger.warning("1skb02", correlationId);
      return null;
    }
    const allAccounts = this.getAllAccounts(accountFilter, correlationId);
    if (allAccounts.length > 1) {
      const sortedAccounts = allAccounts.sort((a, b) => {
        const aHasClaims = a.idTokenClaims ? 1 : 0;
        const bHasClaims = b.idTokenClaims ? 1 : 0;
        return bHasClaims - aHasClaims;
      });
      return sortedAccounts[0];
    } else if (allAccounts.length === 1) {
      return allAccounts[0];
    } else {
      return null;
    }
  }
  /**
   * Returns a single matching
   * @param accountFilter
   * @returns
   */
  getBaseAccountInfo(accountFilter, correlationId) {
    const accountEntities = this.getAccountsFilteredBy(accountFilter, correlationId);
    if (accountEntities.length > 0) {
      return getAccountInfo(accountEntities[0]);
    } else {
      return null;
    }
  }
  /**
   * Matches filtered account entities with cached ID tokens that match the tenant profile-specific account filters
   * and builds the account info objects from the matching ID token's claims
   * @param cachedAccounts
   * @param accountFilter
   * @returns Array of AccountInfo objects that match account and tenant profile filters
   */
  buildTenantProfiles(cachedAccounts, correlationId, accountFilter) {
    return cachedAccounts.flatMap((accountEntity) => {
      return this.getTenantProfilesFromAccountEntity(accountEntity, correlationId, accountFilter?.tenantId, accountFilter);
    });
  }
  getTenantedAccountInfoByFilter(accountInfo, tokenKeys, tenantProfile, correlationId, tenantProfileFilter) {
    let tenantedAccountInfo = null;
    let idTokenClaims;
    if (tenantProfileFilter) {
      if (!this.tenantProfileMatchesFilter(tenantProfile, tenantProfileFilter)) {
        return null;
      }
    }
    const idToken = this.getIdToken(accountInfo, correlationId, tokenKeys, tenantProfile.tenantId);
    if (idToken) {
      idTokenClaims = extractTokenClaims(idToken.secret, this.cryptoImpl.base64Decode);
      if (!this.idTokenClaimsMatchTenantProfileFilter(idTokenClaims, tenantProfileFilter)) {
        return null;
      }
    }
    tenantedAccountInfo = updateAccountTenantProfileData(accountInfo, tenantProfile, idTokenClaims, idToken?.secret);
    return tenantedAccountInfo;
  }
  getTenantProfilesFromAccountEntity(accountEntity, correlationId, targetTenantId, tenantProfileFilter) {
    const accountInfo = getAccountInfo(accountEntity);
    let searchTenantProfiles = accountInfo.tenantProfiles || /* @__PURE__ */ new Map();
    const tokenKeys = this.getTokenKeys();
    if (targetTenantId) {
      const tenantProfile = searchTenantProfiles.get(targetTenantId);
      if (tenantProfile) {
        searchTenantProfiles = /* @__PURE__ */ new Map([
          [targetTenantId, tenantProfile]
        ]);
      } else {
        return [];
      }
    }
    const matchingTenantProfiles = [];
    searchTenantProfiles.forEach((tenantProfile) => {
      const tenantedAccountInfo = this.getTenantedAccountInfoByFilter(accountInfo, tokenKeys, tenantProfile, correlationId, tenantProfileFilter);
      if (tenantedAccountInfo) {
        matchingTenantProfiles.push(tenantedAccountInfo);
      }
    });
    return matchingTenantProfiles;
  }
  tenantProfileMatchesFilter(tenantProfile, tenantProfileFilter) {
    if (!!tenantProfileFilter.localAccountId && !this.matchLocalAccountIdFromTenantProfile(tenantProfile, tenantProfileFilter.localAccountId)) {
      return false;
    }
    if (!!tenantProfileFilter.name && !(tenantProfile.name === tenantProfileFilter.name)) {
      return false;
    }
    if (tenantProfileFilter.isHomeTenant !== void 0 && !(tenantProfile.isHomeTenant === tenantProfileFilter.isHomeTenant)) {
      return false;
    }
    if (!!tenantProfileFilter.username && !(this.matchUsername(tenantProfile.username, tenantProfileFilter.username) || !this.matchUsername(tenantProfile.upn, tenantProfileFilter.username))) {
      return false;
    }
    if (!!tenantProfileFilter.loginHint && !this.matchLoginHintWithTenantProfile(tenantProfile, tenantProfileFilter.loginHint)) {
      return false;
    }
    if (!!tenantProfileFilter.upn && !(tenantProfile.upn === tenantProfileFilter.upn)) {
      return false;
    }
    return true;
  }
  idTokenClaimsMatchTenantProfileFilter(idTokenClaims, tenantProfileFilter) {
    if (tenantProfileFilter) {
      if (!!tenantProfileFilter.localAccountId && !this.matchLocalAccountIdFromTokenClaims(idTokenClaims, tenantProfileFilter.localAccountId)) {
        return false;
      }
      if (!!tenantProfileFilter.loginHint && !this.matchLoginHintFromTokenClaims(idTokenClaims, tenantProfileFilter.loginHint)) {
        return false;
      }
      if (!!tenantProfileFilter.username && !this.matchUsername(idTokenClaims.preferred_username, tenantProfileFilter.username) && !this.matchUsername(idTokenClaims.upn, tenantProfileFilter.username)) {
        return false;
      }
      if (!!tenantProfileFilter.name && !this.matchName(idTokenClaims, tenantProfileFilter.name)) {
        return false;
      }
      if (!!tenantProfileFilter.sid && !this.matchSid(idTokenClaims, tenantProfileFilter.sid)) {
        return false;
      }
    }
    return true;
  }
  /**
   * saves a cache record
   * @param cacheRecord {CacheRecord}
   * @param storeInCache {?StoreInCache}
   * @param correlationId {?string} correlation id
   */
  async saveCacheRecord(cacheRecord, correlationId, kmsi, apiId, storeInCache) {
    if (!cacheRecord) {
      throw createClientAuthError(invalidCacheRecord);
    }
    try {
      if (!!cacheRecord.account) {
        await this.setAccount(cacheRecord.account, correlationId, kmsi, apiId);
      }
      if (!!cacheRecord.idToken && storeInCache?.idToken !== false) {
        await this.setIdTokenCredential(cacheRecord.idToken, correlationId, kmsi);
      }
      if (!!cacheRecord.accessToken && storeInCache?.accessToken !== false) {
        await this.saveAccessToken(cacheRecord.accessToken, correlationId, kmsi);
      }
      if (!!cacheRecord.refreshToken && storeInCache?.refreshToken !== false) {
        await this.setRefreshTokenCredential(cacheRecord.refreshToken, correlationId, kmsi);
      }
      if (!!cacheRecord.appMetadata) {
        this.setAppMetadata(cacheRecord.appMetadata, correlationId);
      }
    } catch (e) {
      this.commonLogger?.error("0j476p", correlationId);
      if (e instanceof AuthError) {
        throw e;
      } else {
        throw createCacheError(e);
      }
    }
  }
  /**
   * saves access token credential
   * @param credential
   */
  async saveAccessToken(credential, correlationId, kmsi) {
    const accessTokenFilter = {
      clientId: credential.clientId,
      credentialType: credential.credentialType,
      environment: credential.environment,
      homeAccountId: credential.homeAccountId,
      realm: credential.realm,
      tokenType: credential.tokenType
    };
    const tokenKeys = this.getTokenKeys();
    const currentScopes = ScopeSet.fromString(credential.target);
    tokenKeys.accessToken.forEach((key) => {
      if (!this.accessTokenKeyMatchesFilter(key, accessTokenFilter, false)) {
        return;
      }
      const tokenEntity = this.getAccessTokenCredential(key, correlationId);
      if (tokenEntity && this.credentialMatchesFilter(tokenEntity, accessTokenFilter, correlationId)) {
        const tokenScopeSet = ScopeSet.fromString(tokenEntity.target);
        if (tokenScopeSet.intersectingScopeSets(currentScopes)) {
          this.removeAccessToken(key, correlationId);
        }
      }
    });
    await this.setAccessTokenCredential(credential, correlationId, kmsi);
  }
  /**
   * Retrieve account entities matching all provided tenant-agnostic filters; if no filter is set, get all account entities in the cache
   * Not checking for casing as keys are all generated in lower case, remember to convert to lower case if object properties are compared
   * @param accountFilter - An object containing Account properties to filter by
   */
  getAccountsFilteredBy(accountFilter, correlationId) {
    const allAccountKeys = this.getAccountKeys();
    const matchingAccounts = [];
    allAccountKeys.forEach((cacheKey) => {
      const entity = this.getAccount(cacheKey, correlationId);
      if (!entity) {
        return;
      }
      if (!!accountFilter.homeAccountId && !this.matchHomeAccountId(entity, accountFilter.homeAccountId)) {
        return;
      }
      if (!!accountFilter.environment && !this.matchEnvironment(entity, accountFilter.environment, correlationId)) {
        return;
      }
      if (!!accountFilter.realm && !this.matchRealm(entity, accountFilter.realm)) {
        return;
      }
      if (!!accountFilter.nativeAccountId && !this.matchNativeAccountId(entity, accountFilter.nativeAccountId)) {
        return;
      }
      if (!!accountFilter.authorityType && !this.matchAuthorityType(entity, accountFilter.authorityType)) {
        return;
      }
      const tenantProfileFilter = {
        localAccountId: accountFilter?.localAccountId,
        name: accountFilter?.name,
        username: accountFilter?.username,
        loginHint: accountFilter?.loginHint,
        upn: accountFilter?.upn
      };
      const matchingTenantProfiles = entity.tenantProfiles?.filter((tenantProfile) => {
        return this.tenantProfileMatchesFilter(tenantProfile, tenantProfileFilter);
      });
      if (matchingTenantProfiles && matchingTenantProfiles.length === 0) {
        return;
      }
      matchingAccounts.push(entity);
    });
    return matchingAccounts;
  }
  /**
   * Returns whether or not the given credential entity matches the filter
   * @param entity
   * @param filter
   * @param correlationId
   * @returns
   */
  credentialMatchesFilter(entity, filter, correlationId) {
    if (!!filter.clientId && !this.matchClientId(entity, filter.clientId)) {
      return false;
    }
    if (!!filter.userAssertionHash && !this.matchUserAssertionHash(entity, filter.userAssertionHash)) {
      return false;
    }
    if (typeof filter.homeAccountId === "string" && !this.matchHomeAccountId(entity, filter.homeAccountId)) {
      return false;
    }
    if (!!filter.environment && !this.matchEnvironment(entity, filter.environment, correlationId)) {
      return false;
    }
    if (!!filter.realm && !this.matchRealm(entity, filter.realm)) {
      return false;
    }
    if (!!filter.credentialType && !this.matchCredentialType(entity, filter.credentialType)) {
      return false;
    }
    if (!!filter.familyId && !this.matchFamilyId(entity, filter.familyId)) {
      return false;
    }
    if (!!filter.target && !this.matchTarget(entity, filter.target)) {
      return false;
    }
    if (entity.credentialType === CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME) {
      if (!!filter.tokenType && !this.matchTokenType(entity, filter.tokenType)) {
        return false;
      }
      if (filter.tokenType === AuthenticationScheme.SSH) {
        if (filter.keyId && !this.matchKeyId(entity, filter.keyId)) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * retrieve appMetadata matching all provided filters; if no filter is set, get all appMetadata
   * @param filter
   * @param correlationId
   */
  getAppMetadataFilteredBy(filter, correlationId) {
    const allCacheKeys = this.getKeys();
    const matchingAppMetadata = {};
    allCacheKeys.forEach((cacheKey) => {
      if (!this.isAppMetadata(cacheKey)) {
        return;
      }
      const entity = this.getAppMetadata(cacheKey, correlationId);
      if (!entity) {
        return;
      }
      if (!!filter.environment && !this.matchEnvironment(entity, filter.environment, correlationId)) {
        return;
      }
      if (!!filter.clientId && !this.matchClientId(entity, filter.clientId)) {
        return;
      }
      matchingAppMetadata[cacheKey] = entity;
    });
    return matchingAppMetadata;
  }
  /**
   * retrieve authorityMetadata that contains a matching alias
   * @param host
   * @param correlationId
   */
  getAuthorityMetadataByAlias(host, correlationId) {
    const allCacheKeys = this.getAuthorityMetadataKeys();
    let matchedEntity = null;
    allCacheKeys.forEach((cacheKey) => {
      if (!this.isAuthorityMetadata(cacheKey) || cacheKey.indexOf(this.clientId) === -1) {
        return;
      }
      const entity = this.getAuthorityMetadata(cacheKey, correlationId);
      if (!entity) {
        return;
      }
      if (entity.aliases.indexOf(host) === -1) {
        return;
      }
      matchedEntity = entity;
    });
    return matchedEntity;
  }
  /**
   * Removes all accounts and related tokens from cache.
   */
  removeAllAccounts(correlationId) {
    const accounts = this.getAllAccounts({}, correlationId);
    accounts.forEach((account) => {
      this.removeAccount(account, correlationId);
    });
  }
  /**
   * Removes the account and related tokens for a given account key
   * @param account
   */
  removeAccount(account, correlationId) {
    this.removeAccountContext(account, correlationId);
    const accountKeys = this.getAccountKeys();
    const keyFilter = (key) => {
      return key.includes(account.homeAccountId) && key.includes(account.environment);
    };
    accountKeys.filter(keyFilter).forEach((key) => {
      this.removeItem(key, correlationId);
      this.performanceClient.incrementFields({ accountsRemoved: 1 }, correlationId);
    });
  }
  /**
   * Removes credentials associated with the provided account
   * @param account
   */
  removeAccountContext(account, correlationId) {
    const allTokenKeys = this.getTokenKeys();
    const keyFilter = (key) => {
      return key.includes(account.homeAccountId) && key.includes(account.environment);
    };
    allTokenKeys.idToken.filter(keyFilter).forEach((key) => {
      this.removeIdToken(key, correlationId);
    });
    allTokenKeys.accessToken.filter(keyFilter).forEach((key) => {
      this.removeAccessToken(key, correlationId);
    });
    allTokenKeys.refreshToken.filter(keyFilter).forEach((key) => {
      this.removeRefreshToken(key, correlationId);
    });
  }
  /**
   * returns a boolean if the given credential is removed
   * @param key
   * @param correlationId
   */
  removeAccessToken(key, correlationId) {
    const credential = this.getAccessTokenCredential(key, correlationId);
    if (!credential) {
      return;
    }
    this.removeItem(key, correlationId);
    this.performanceClient.incrementFields({ accessTokensRemoved: 1 }, correlationId);
    if (credential.credentialType.toLowerCase() === CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME.toLowerCase()) {
      if (credential.tokenType === AuthenticationScheme.POP) {
        const accessTokenWithAuthSchemeEntity = credential;
        const kid = accessTokenWithAuthSchemeEntity.keyId;
        if (kid) {
          void this.cryptoImpl.removeTokenBindingKey(kid, correlationId).catch(() => {
            this.commonLogger.error("0cx291", correlationId);
            this.performanceClient?.incrementFields({ removeTokenBindingKeyFailure: 1 }, correlationId);
          });
        }
      }
    }
  }
  /**
   * Removes all app metadata objects from cache.
   */
  removeAppMetadata(correlationId) {
    const allCacheKeys = this.getKeys();
    allCacheKeys.forEach((cacheKey) => {
      if (this.isAppMetadata(cacheKey)) {
        this.removeItem(cacheKey, correlationId);
      }
    });
    return true;
  }
  /**
   * Retrieve IdTokenEntity from cache
   * @param account {AccountInfo}
   * @param tokenKeys {?TokenKeys}
   * @param targetRealm {?string}
   * @param performanceClient {?IPerformanceClient}
   * @param correlationId {?string}
   */
  getIdToken(account, correlationId, tokenKeys, targetRealm) {
    this.commonLogger.trace("1drz22", correlationId);
    const idTokenFilter = {
      homeAccountId: account.homeAccountId,
      environment: account.environment,
      credentialType: CredentialType.ID_TOKEN,
      clientId: this.clientId,
      realm: targetRealm
    };
    const idTokenMap = this.getIdTokensByFilter(idTokenFilter, correlationId, tokenKeys);
    const numIdTokens = idTokenMap.size;
    if (numIdTokens < 1) {
      this.commonLogger.info("1atvtd", correlationId);
      return null;
    } else if (numIdTokens > 1) {
      let tokensToBeRemoved = idTokenMap;
      if (!targetRealm) {
        const homeIdTokenMap = /* @__PURE__ */ new Map();
        idTokenMap.forEach((idToken, key) => {
          if (idToken.realm === account.tenantId) {
            homeIdTokenMap.set(key, idToken);
          }
        });
        const numHomeIdTokens = homeIdTokenMap.size;
        if (numHomeIdTokens < 1) {
          this.commonLogger.info("0ooalx", correlationId);
          return idTokenMap.values().next().value ?? null;
        } else if (numHomeIdTokens === 1) {
          this.commonLogger.info("1eq2vc", correlationId);
          return homeIdTokenMap.values().next().value ?? null;
        } else {
          tokensToBeRemoved = homeIdTokenMap;
        }
      }
      this.commonLogger.info("1ws328", correlationId);
      tokensToBeRemoved.forEach((idToken, key) => {
        this.removeIdToken(key, correlationId);
      });
      this.performanceClient.addFields({ multiMatchedID: idTokenMap.size }, correlationId);
      return null;
    }
    this.commonLogger.info("1sm769", correlationId);
    return idTokenMap.values().next().value ?? null;
  }
  /**
   * Gets all idTokens matching the given filter
   * @param filter
   * @returns
   */
  getIdTokensByFilter(filter, correlationId, tokenKeys) {
    const idTokenKeys = tokenKeys && tokenKeys.idToken || this.getTokenKeys().idToken;
    const idTokens = /* @__PURE__ */ new Map();
    idTokenKeys.forEach((key) => {
      if (!this.idTokenKeyMatchesFilter(key, __spreadValues({
        clientId: this.clientId
      }, filter))) {
        return;
      }
      const idToken = this.getIdTokenCredential(key, correlationId);
      if (idToken && this.credentialMatchesFilter(idToken, filter, correlationId)) {
        idTokens.set(key, idToken);
      }
    });
    return idTokens;
  }
  /**
   * Validate the cache key against filter before retrieving and parsing cache value
   * @param key
   * @param filter
   * @returns
   */
  idTokenKeyMatchesFilter(inputKey, filter) {
    const key = inputKey.toLowerCase();
    if (filter.clientId && key.indexOf(filter.clientId.toLowerCase()) === -1) {
      return false;
    }
    if (filter.homeAccountId && key.indexOf(filter.homeAccountId.toLowerCase()) === -1) {
      return false;
    }
    return true;
  }
  /**
   * Removes idToken from the cache
   * @param key
   */
  removeIdToken(key, correlationId) {
    this.removeItem(key, correlationId);
  }
  /**
   * Removes refresh token from the cache
   * @param key
   */
  removeRefreshToken(key, correlationId) {
    this.removeItem(key, correlationId);
  }
  /**
   * Retrieve AccessTokenEntity from cache
   * @param account {AccountInfo}
   * @param request {BaseAuthRequest}
   * @param tokenKeys {?TokenKeys}
   * @param performanceClient {?IPerformanceClient}
   */
  getAccessToken(account, request, tokenKeys, targetRealm) {
    const correlationId = request.correlationId;
    this.commonLogger.trace("1t7hz1", correlationId);
    const scopes = ScopeSet.createSearchScopes(request.scopes);
    const authScheme = request.authenticationScheme || AuthenticationScheme.BEARER;
    const credentialType = authScheme && authScheme.toLowerCase() !== AuthenticationScheme.BEARER.toLowerCase() ? CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME : CredentialType.ACCESS_TOKEN;
    const accessTokenFilter = {
      homeAccountId: account.homeAccountId,
      environment: account.environment,
      credentialType,
      clientId: this.clientId,
      realm: targetRealm || account.tenantId,
      target: scopes,
      tokenType: authScheme,
      keyId: request.sshKid
    };
    const accessTokenKeys = tokenKeys && tokenKeys.accessToken || this.getTokenKeys().accessToken;
    const accessTokens = [];
    accessTokenKeys.forEach((key) => {
      if (this.accessTokenKeyMatchesFilter(key, accessTokenFilter, true)) {
        const accessToken = this.getAccessTokenCredential(key, correlationId);
        if (accessToken && this.credentialMatchesFilter(accessToken, accessTokenFilter, correlationId)) {
          accessTokens.push(accessToken);
        }
      }
    });
    const numAccessTokens = accessTokens.length;
    if (numAccessTokens < 1) {
      this.commonLogger.info("1nckna", correlationId);
      return null;
    } else if (numAccessTokens > 1) {
      this.commonLogger.info("1wkfwp", correlationId);
      accessTokens.forEach((accessToken) => {
        this.removeAccessToken(this.generateCredentialKey(accessToken), correlationId);
      });
      this.performanceClient.addFields({ multiMatchedAT: accessTokens.length }, correlationId);
      return null;
    }
    this.commonLogger.info("06yt98", correlationId);
    return accessTokens[0];
  }
  /**
   * Validate the cache key against filter before retrieving and parsing cache value
   * @param key
   * @param filter
   * @param keyMustContainAllScopes
   * @returns
   */
  accessTokenKeyMatchesFilter(inputKey, filter, keyMustContainAllScopes) {
    const key = inputKey.toLowerCase();
    if (filter.clientId && key.indexOf(filter.clientId.toLowerCase()) === -1) {
      return false;
    }
    if (filter.homeAccountId && key.indexOf(filter.homeAccountId.toLowerCase()) === -1) {
      return false;
    }
    if (filter.realm && key.indexOf(filter.realm.toLowerCase()) === -1) {
      return false;
    }
    if (filter.target) {
      const scopes = filter.target.asArray();
      for (let i = 0; i < scopes.length; i++) {
        if (keyMustContainAllScopes && !key.includes(scopes[i].toLowerCase())) {
          return false;
        } else if (!keyMustContainAllScopes && key.includes(scopes[i].toLowerCase())) {
          return true;
        }
      }
    }
    return true;
  }
  /**
   * Gets all access tokens matching the filter
   * @param filter
   * @returns
   */
  getAccessTokensByFilter(filter, correlationId) {
    const tokenKeys = this.getTokenKeys();
    const accessTokens = [];
    tokenKeys.accessToken.forEach((key) => {
      if (!this.accessTokenKeyMatchesFilter(key, filter, true)) {
        return;
      }
      const accessToken = this.getAccessTokenCredential(key, correlationId);
      if (accessToken && this.credentialMatchesFilter(accessToken, filter, correlationId)) {
        accessTokens.push(accessToken);
      }
    });
    return accessTokens;
  }
  /**
   * Helper to retrieve the appropriate refresh token from cache
   * @param account {AccountInfo}
   * @param familyRT {boolean}
   * @param tokenKeys {?TokenKeys}
   * @param performanceClient {?IPerformanceClient}
   * @param correlationId {?string}
   */
  getRefreshToken(account, familyRT, correlationId, tokenKeys) {
    this.commonLogger.trace("0x53vi", correlationId);
    const id = familyRT ? THE_FAMILY_ID : void 0;
    const refreshTokenFilter = {
      homeAccountId: account.homeAccountId,
      environment: account.environment,
      credentialType: CredentialType.REFRESH_TOKEN,
      clientId: this.clientId,
      familyId: id
    };
    const refreshTokenKeys = tokenKeys && tokenKeys.refreshToken || this.getTokenKeys().refreshToken;
    const refreshTokens = [];
    refreshTokenKeys.forEach((key) => {
      if (this.refreshTokenKeyMatchesFilter(key, refreshTokenFilter)) {
        const refreshToken = this.getRefreshTokenCredential(key, correlationId);
        if (refreshToken && this.credentialMatchesFilter(refreshToken, refreshTokenFilter, correlationId)) {
          refreshTokens.push(refreshToken);
        }
      }
    });
    const numRefreshTokens = refreshTokens.length;
    if (numRefreshTokens < 1) {
      this.commonLogger.info("0dlw11", correlationId);
      return null;
    }
    if (numRefreshTokens > 1) {
      this.performanceClient.addFields({ multiMatchedRT: numRefreshTokens }, correlationId);
    }
    this.commonLogger.info("0wcnep", correlationId);
    return refreshTokens[0];
  }
  /**
   * Validate the cache key against filter before retrieving and parsing cache value
   * @param key
   * @param filter
   */
  refreshTokenKeyMatchesFilter(inputKey, filter) {
    const key = inputKey.toLowerCase();
    if (filter.familyId && key.indexOf(filter.familyId.toLowerCase()) === -1) {
      return false;
    }
    if (!filter.familyId && filter.clientId && key.indexOf(filter.clientId.toLowerCase()) === -1) {
      return false;
    }
    if (filter.homeAccountId && key.indexOf(filter.homeAccountId.toLowerCase()) === -1) {
      return false;
    }
    return true;
  }
  /**
   * Retrieve AppMetadataEntity from cache
   */
  readAppMetadataFromCache(environment, correlationId) {
    const appMetadataFilter = {
      environment,
      clientId: this.clientId
    };
    const appMetadata = this.getAppMetadataFilteredBy(appMetadataFilter, correlationId);
    const appMetadataEntries = Object.keys(appMetadata).map((key) => appMetadata[key]);
    const numAppMetadata = appMetadataEntries.length;
    if (numAppMetadata < 1) {
      return null;
    } else if (numAppMetadata > 1) {
      throw createClientAuthError(multipleMatchingAppMetadata);
    }
    return appMetadataEntries[0];
  }
  /**
   * Return the family_id value associated  with FOCI
   * @param environment
   * @param clientId
   */
  isAppMetadataFOCI(environment, correlationId) {
    const appMetadata = this.readAppMetadataFromCache(environment, correlationId);
    return !!(appMetadata && appMetadata.familyId === THE_FAMILY_ID);
  }
  /**
   * helper to match account ids
   * @param value
   * @param homeAccountId
   */
  matchHomeAccountId(entity, homeAccountId) {
    return !!(typeof entity.homeAccountId === "string" && homeAccountId === entity.homeAccountId);
  }
  /**
   * helper to match account ids
   * @param entity
   * @param localAccountId
   * @returns
   */
  matchLocalAccountIdFromTokenClaims(tokenClaims, localAccountId) {
    const idTokenLocalAccountId = tokenClaims.oid || tokenClaims.sub;
    return localAccountId === idTokenLocalAccountId;
  }
  matchLocalAccountIdFromTenantProfile(tenantProfile, localAccountId) {
    return tenantProfile.localAccountId === localAccountId;
  }
  /**
   * helper to match names
   * @param entity
   * @param name
   * @returns true if the downcased name properties are present and match in the filter and the entity
   */
  matchName(claims, name2) {
    return !!(name2.toLowerCase() === claims.name?.toLowerCase());
  }
  /**
   * helper to match usernames
   * @param entity
   * @param username
   * @returns
   */
  matchUsername(cachedUsername, filterUsername) {
    return !!(cachedUsername && typeof cachedUsername === "string" && filterUsername?.toLowerCase() === cachedUsername.toLowerCase());
  }
  /**
   * helper to match loginhints
   * @param entity
   * @param loginHint
   * @returns
   */
  matchLoginHintWithTenantProfile(tenantProfile, loginHintFilter) {
    return tenantProfile.loginHint === loginHintFilter || tenantProfile.username === loginHintFilter || tenantProfile.upn === loginHintFilter;
  }
  /**
   * helper to match assertion
   * @param value
   * @param oboAssertion
   */
  matchUserAssertionHash(entity, userAssertionHash) {
    return !!(entity.userAssertionHash && userAssertionHash === entity.userAssertionHash);
  }
  /**
   * helper to match environment
   * @param value
   * @param environment
   */
  matchEnvironment(entity, environment, correlationId) {
    if (this.staticAuthorityOptions) {
      const staticAliases = getAliasesFromStaticSources(this.staticAuthorityOptions, this.commonLogger, correlationId);
      if (staticAliases.includes(environment) && staticAliases.includes(entity.environment)) {
        return true;
      }
    }
    const cloudMetadata = this.getAuthorityMetadataByAlias(environment, correlationId);
    if (cloudMetadata && cloudMetadata.aliases.indexOf(entity.environment) > -1) {
      return true;
    }
    return false;
  }
  /**
   * helper to match credential type
   * @param entity
   * @param credentialType
   */
  matchCredentialType(entity, credentialType) {
    return entity.credentialType && credentialType.toLowerCase() === entity.credentialType.toLowerCase();
  }
  /**
   * helper to match client ids
   * @param entity
   * @param clientId
   */
  matchClientId(entity, clientId) {
    return !!(entity.clientId && clientId === entity.clientId);
  }
  /**
   * helper to match family ids
   * @param entity
   * @param familyId
   */
  matchFamilyId(entity, familyId) {
    return !!(entity.familyId && familyId === entity.familyId);
  }
  /**
   * helper to match realm
   * @param entity
   * @param realm
   */
  matchRealm(entity, realm) {
    return !!(entity.realm?.toLowerCase() === realm.toLowerCase());
  }
  /**
   * helper to match nativeAccountId
   * @param entity
   * @param nativeAccountId
   * @returns boolean indicating the match result
   */
  matchNativeAccountId(entity, nativeAccountId) {
    return !!(entity.nativeAccountId && nativeAccountId === entity.nativeAccountId);
  }
  /**
   * helper to match loginHint which can be either:
   * 1. login_hint ID token claim
   * 2. username in cached account object
   * 3. upn in ID token claims
   * @param entity
   * @param loginHint
   * @returns
   */
  matchLoginHintFromTokenClaims(tokenClaims, loginHint) {
    if (tokenClaims.login_hint === loginHint) {
      return true;
    }
    if (tokenClaims.preferred_username === loginHint) {
      return true;
    }
    if (tokenClaims.upn === loginHint) {
      return true;
    }
    if (tokenClaims.emails && tokenClaims.emails.includes(loginHint)) {
      return true;
    }
    return false;
  }
  /**
   * Helper to match sid
   * @param entity
   * @param sid
   * @returns true if the sid claim is present and matches the filter
   */
  matchSid(idTokenClaims, sid) {
    return idTokenClaims.sid === sid;
  }
  matchAuthorityType(entity, authorityType) {
    return !!(entity.authorityType && authorityType.toLowerCase() === entity.authorityType.toLowerCase());
  }
  /**
   * Returns true if the target scopes are a subset of the current entity's scopes, false otherwise.
   * @param entity
   * @param target
   */
  matchTarget(entity, target) {
    const isNotAccessTokenCredential = entity.credentialType !== CredentialType.ACCESS_TOKEN && entity.credentialType !== CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME;
    if (isNotAccessTokenCredential || !entity.target) {
      return false;
    }
    const entityScopeSet = ScopeSet.fromString(entity.target);
    return entityScopeSet.containsScopeSet(target);
  }
  /**
   * Returns true if the credential's tokenType or Authentication Scheme matches the one in the request, false otherwise
   * @param entity
   * @param tokenType
   */
  matchTokenType(entity, tokenType) {
    return !!(entity.tokenType && entity.tokenType === tokenType);
  }
  /**
   * Returns true if the credential's keyId matches the one in the request, false otherwise
   * @param entity
   * @param keyId
   */
  matchKeyId(entity, keyId) {
    return !!(entity.keyId && entity.keyId === keyId);
  }
  /**
   * returns if a given cache entity is of the type appmetadata
   * @param key
   */
  isAppMetadata(key) {
    return key.indexOf(APP_METADATA) !== -1;
  }
  /**
   * returns if a given cache entity is of the type authoritymetadata
   * @param key
   */
  isAuthorityMetadata(key) {
    return key.indexOf(AUTHORITY_METADATA_CACHE_KEY) !== -1;
  }
  /**
   * returns cache key used for cloud instance metadata
   */
  generateAuthorityMetadataCacheKey(authority) {
    return `${AUTHORITY_METADATA_CACHE_KEY}-${this.clientId}-${authority}`;
  }
  /**
   * Helper to convert serialized data to object
   * @param obj
   * @param json
   */
  static toObject(obj, json) {
    for (const propertyName in json) {
      obj[propertyName] = json[propertyName];
    }
    return obj;
  }
};
var DefaultStorageClass = class extends CacheManager {
  async setAccount() {
    throw createClientAuthError(methodNotImplemented);
  }
  getAccount() {
    throw createClientAuthError(methodNotImplemented);
  }
  async setIdTokenCredential() {
    throw createClientAuthError(methodNotImplemented);
  }
  getIdTokenCredential() {
    throw createClientAuthError(methodNotImplemented);
  }
  async setAccessTokenCredential() {
    throw createClientAuthError(methodNotImplemented);
  }
  getAccessTokenCredential() {
    throw createClientAuthError(methodNotImplemented);
  }
  async setRefreshTokenCredential() {
    throw createClientAuthError(methodNotImplemented);
  }
  getRefreshTokenCredential() {
    throw createClientAuthError(methodNotImplemented);
  }
  setAppMetadata() {
    throw createClientAuthError(methodNotImplemented);
  }
  getAppMetadata() {
    throw createClientAuthError(methodNotImplemented);
  }
  setServerTelemetry() {
    throw createClientAuthError(methodNotImplemented);
  }
  getServerTelemetry() {
    throw createClientAuthError(methodNotImplemented);
  }
  setAuthorityMetadata() {
    throw createClientAuthError(methodNotImplemented);
  }
  getAuthorityMetadata() {
    throw createClientAuthError(methodNotImplemented);
  }
  getAuthorityMetadataKeys() {
    throw createClientAuthError(methodNotImplemented);
  }
  setThrottlingCache() {
    throw createClientAuthError(methodNotImplemented);
  }
  getThrottlingCache() {
    throw createClientAuthError(methodNotImplemented);
  }
  removeItem() {
    throw createClientAuthError(methodNotImplemented);
  }
  getKeys() {
    throw createClientAuthError(methodNotImplemented);
  }
  getAccountKeys() {
    throw createClientAuthError(methodNotImplemented);
  }
  getTokenKeys() {
    throw createClientAuthError(methodNotImplemented);
  }
  generateCredentialKey() {
    throw createClientAuthError(methodNotImplemented);
  }
  generateAccountKey() {
    throw createClientAuthError(methodNotImplemented);
  }
};

// ../../node_modules/@azure/msal-common/dist-browser/config/ClientConfiguration.mjs
var DEFAULT_SYSTEM_OPTIONS = {
  tokenRenewalOffsetSeconds: DEFAULT_TOKEN_RENEWAL_OFFSET_SEC,
  preventCorsPreflight: false
};
var DEFAULT_LOGGER_IMPLEMENTATION = {
  loggerCallback: () => {
  },
  piiLoggingEnabled: false,
  logLevel: LogLevel.Info,
  correlationId: ""
};
var DEFAULT_NETWORK_IMPLEMENTATION = {
  async sendGetRequestAsync() {
    throw createClientAuthError(methodNotImplemented);
  },
  async sendPostRequestAsync() {
    throw createClientAuthError(methodNotImplemented);
  }
};
var DEFAULT_LIBRARY_INFO = {
  sku: SKU,
  version,
  cpu: "",
  os: ""
};
var DEFAULT_CLIENT_CREDENTIALS = {
  clientSecret: "",
  clientAssertion: void 0
};
var DEFAULT_AZURE_CLOUD_OPTIONS = {
  azureCloudInstance: AzureCloudInstance.None,
  tenant: `${DEFAULT_COMMON_TENANT}`
};
var DEFAULT_TELEMETRY_OPTIONS = {
  application: {
    appName: "",
    appVersion: ""
  }
};
function buildClientConfiguration({ authOptions: userAuthOptions, systemOptions: userSystemOptions, loggerOptions: userLoggerOption, storageInterface: storageImplementation, networkInterface: networkImplementation, cryptoInterface: cryptoImplementation, clientCredentials, libraryInfo, telemetry, serverTelemetryManager, persistencePlugin, serializableCache }) {
  const loggerOptions = __spreadValues(__spreadValues({}, DEFAULT_LOGGER_IMPLEMENTATION), userLoggerOption);
  return {
    authOptions: buildAuthOptions(userAuthOptions),
    systemOptions: __spreadValues(__spreadValues({}, DEFAULT_SYSTEM_OPTIONS), userSystemOptions),
    loggerOptions,
    storageInterface: storageImplementation || new DefaultStorageClass(userAuthOptions.clientId, DEFAULT_CRYPTO_IMPLEMENTATION, new Logger(loggerOptions), new StubPerformanceClient()),
    networkInterface: networkImplementation || DEFAULT_NETWORK_IMPLEMENTATION,
    cryptoInterface: cryptoImplementation || DEFAULT_CRYPTO_IMPLEMENTATION,
    clientCredentials: clientCredentials || DEFAULT_CLIENT_CREDENTIALS,
    libraryInfo: __spreadValues(__spreadValues({}, DEFAULT_LIBRARY_INFO), libraryInfo),
    telemetry: __spreadValues(__spreadValues({}, DEFAULT_TELEMETRY_OPTIONS), telemetry),
    serverTelemetryManager: serverTelemetryManager || null,
    persistencePlugin: persistencePlugin || null,
    serializableCache: serializableCache || null
  };
}
function buildAuthOptions(authOptions) {
  return __spreadValues({
    clientCapabilities: [],
    azureCloudOptions: DEFAULT_AZURE_CLOUD_OPTIONS,
    instanceAware: false,
    isMcp: false
  }, authOptions);
}
function isOidcProtocolMode(config) {
  return config.authOptions.authority.options.protocolMode === ProtocolMode.OIDC;
}

// ../../node_modules/@azure/msal-common/dist-browser/cache/persistence/TokenCacheContext.mjs
var TokenCacheContext = class {
  constructor(tokenCache, hasChanged) {
    this.cache = tokenCache;
    this.hasChanged = hasChanged;
  }
  /**
   * boolean which indicates the changes in cache
   */
  get cacheHasChanged() {
    return this.hasChanged;
  }
  /**
   * function to retrieve the token cache
   */
  get tokenCache() {
    return this.cache;
  }
};

// ../../node_modules/@azure/msal-common/dist-browser/cache/utils/CacheHelpers.mjs
var CacheHelpers_exports = {};
__export(CacheHelpers_exports, {
  createAccessTokenEntity: () => createAccessTokenEntity,
  createIdTokenEntity: () => createIdTokenEntity,
  createRefreshTokenEntity: () => createRefreshTokenEntity,
  generateAppMetadataKey: () => generateAppMetadataKey,
  generateAuthorityMetadataExpiresAt: () => generateAuthorityMetadataExpiresAt,
  isAccessTokenEntity: () => isAccessTokenEntity,
  isAppMetadataEntity: () => isAppMetadataEntity,
  isAuthorityMetadataEntity: () => isAuthorityMetadataEntity,
  isAuthorityMetadataExpired: () => isAuthorityMetadataExpired,
  isCredentialEntity: () => isCredentialEntity,
  isIdTokenEntity: () => isIdTokenEntity,
  isRefreshTokenEntity: () => isRefreshTokenEntity,
  isServerTelemetryEntity: () => isServerTelemetryEntity,
  isThrottlingEntity: () => isThrottlingEntity,
  updateAuthorityEndpointMetadata: () => updateAuthorityEndpointMetadata,
  updateCloudDiscoveryMetadata: () => updateCloudDiscoveryMetadata
});

// ../../node_modules/@azure/msal-common/dist-browser/utils/TimeUtils.mjs
var TimeUtils_exports = {};
__export(TimeUtils_exports, {
  delay: () => delay,
  isCacheExpired: () => isCacheExpired,
  isTokenExpired: () => isTokenExpired,
  nowSeconds: () => nowSeconds,
  toDateFromSeconds: () => toDateFromSeconds,
  toSecondsFromDate: () => toSecondsFromDate,
  wasClockTurnedBack: () => wasClockTurnedBack
});
function nowSeconds() {
  return Math.round((/* @__PURE__ */ new Date()).getTime() / 1e3);
}
function toSecondsFromDate(date) {
  return date.getTime() / 1e3;
}
function toDateFromSeconds(seconds) {
  if (seconds) {
    return new Date(Number(seconds) * 1e3);
  }
  return /* @__PURE__ */ new Date();
}
function isTokenExpired(expiresOn, offset) {
  const expirationSec = Number(expiresOn) || 0;
  const offsetCurrentTimeSec = nowSeconds() + offset;
  return offsetCurrentTimeSec > expirationSec;
}
function isCacheExpired(lastUpdatedAt, cacheRetentionDays) {
  const cacheExpirationTimestamp = Number(lastUpdatedAt) + cacheRetentionDays * 24 * 60 * 60 * 1e3;
  return Date.now() > cacheExpirationTimestamp;
}
function wasClockTurnedBack(cachedAt) {
  const cachedAtSec = Number(cachedAt);
  return cachedAtSec > nowSeconds();
}
function delay(t, value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), t));
}

// ../../node_modules/@azure/msal-common/dist-browser/cache/utils/CacheHelpers.mjs
function createIdTokenEntity(homeAccountId, environment, idToken, clientId, tenantId) {
  const idTokenEntity = {
    credentialType: CredentialType.ID_TOKEN,
    homeAccountId,
    environment,
    clientId,
    secret: idToken,
    realm: tenantId,
    lastUpdatedAt: Date.now().toString()
    // Set the last updated time to now
  };
  return idTokenEntity;
}
function createAccessTokenEntity(homeAccountId, environment, accessToken, clientId, tenantId, scopes, expiresOn, extExpiresOn, base64Decode2, refreshOn, tokenType, userAssertionHash, keyId) {
  const atEntity = {
    homeAccountId,
    credentialType: CredentialType.ACCESS_TOKEN,
    secret: accessToken,
    cachedAt: nowSeconds().toString(),
    expiresOn: expiresOn.toString(),
    extendedExpiresOn: extExpiresOn.toString(),
    environment,
    clientId,
    realm: tenantId,
    target: scopes,
    tokenType: tokenType || AuthenticationScheme.BEARER,
    lastUpdatedAt: Date.now().toString()
    // Set the last updated time to now
  };
  if (userAssertionHash) {
    atEntity.userAssertionHash = userAssertionHash;
  }
  if (refreshOn) {
    atEntity.refreshOn = refreshOn.toString();
  }
  if (atEntity.tokenType?.toLowerCase() !== AuthenticationScheme.BEARER.toLowerCase()) {
    atEntity.credentialType = CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME;
    switch (atEntity.tokenType) {
      case AuthenticationScheme.POP:
        const tokenClaims = extractTokenClaims(accessToken, base64Decode2);
        if (!tokenClaims?.cnf?.kid) {
          throw createClientAuthError(tokenClaimsCnfRequiredForSignedJwt);
        }
        atEntity.keyId = tokenClaims.cnf.kid;
        break;
      case AuthenticationScheme.SSH:
        atEntity.keyId = keyId;
    }
  }
  return atEntity;
}
function createRefreshTokenEntity(homeAccountId, environment, refreshToken, clientId, familyId, userAssertionHash, expiresOn) {
  const rtEntity = {
    credentialType: CredentialType.REFRESH_TOKEN,
    homeAccountId,
    environment,
    clientId,
    secret: refreshToken,
    lastUpdatedAt: Date.now().toString()
  };
  if (userAssertionHash) {
    rtEntity.userAssertionHash = userAssertionHash;
  }
  if (familyId) {
    rtEntity.familyId = familyId;
  }
  if (expiresOn) {
    rtEntity.expiresOn = expiresOn.toString();
  }
  return rtEntity;
}
function isCredentialEntity(entity) {
  return entity.hasOwnProperty("homeAccountId") && entity.hasOwnProperty("environment") && entity.hasOwnProperty("credentialType") && entity.hasOwnProperty("clientId") && entity.hasOwnProperty("secret");
}
function isAccessTokenEntity(entity) {
  if (!entity) {
    return false;
  }
  return isCredentialEntity(entity) && entity.hasOwnProperty("realm") && entity.hasOwnProperty("target") && (entity["credentialType"] === CredentialType.ACCESS_TOKEN || entity["credentialType"] === CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME);
}
function isIdTokenEntity(entity) {
  if (!entity) {
    return false;
  }
  return isCredentialEntity(entity) && entity.hasOwnProperty("realm") && entity["credentialType"] === CredentialType.ID_TOKEN;
}
function isRefreshTokenEntity(entity) {
  if (!entity) {
    return false;
  }
  return isCredentialEntity(entity) && entity["credentialType"] === CredentialType.REFRESH_TOKEN;
}
function isServerTelemetryEntity(key, entity) {
  const validateKey = key.indexOf(SERVER_TELEM_CACHE_KEY) === 0;
  let validateEntity = true;
  if (entity) {
    validateEntity = entity.hasOwnProperty("failedRequests") && entity.hasOwnProperty("errors") && entity.hasOwnProperty("cacheHits");
  }
  return validateKey && validateEntity;
}
function isThrottlingEntity(key, entity) {
  let validateKey = false;
  if (key) {
    validateKey = key.indexOf(THROTTLING_PREFIX) === 0;
  }
  let validateEntity = true;
  if (entity) {
    validateEntity = entity.hasOwnProperty("throttleTime");
  }
  return validateKey && validateEntity;
}
function generateAppMetadataKey({ environment, clientId }) {
  const appMetaDataKeyArray = [
    APP_METADATA,
    environment,
    clientId
  ];
  return appMetaDataKeyArray.join(CACHE_KEY_SEPARATOR).toLowerCase();
}
function isAppMetadataEntity(key, entity) {
  if (!entity) {
    return false;
  }
  return key.indexOf(APP_METADATA) === 0 && entity.hasOwnProperty("clientId") && entity.hasOwnProperty("environment");
}
function isAuthorityMetadataEntity(key, entity) {
  if (!entity) {
    return false;
  }
  return key.indexOf(AUTHORITY_METADATA_CACHE_KEY) === 0 && entity.hasOwnProperty("aliases") && entity.hasOwnProperty("preferred_cache") && entity.hasOwnProperty("preferred_network") && entity.hasOwnProperty("canonical_authority") && entity.hasOwnProperty("authorization_endpoint") && entity.hasOwnProperty("token_endpoint") && entity.hasOwnProperty("issuer") && entity.hasOwnProperty("aliasesFromNetwork") && entity.hasOwnProperty("endpointsFromNetwork") && entity.hasOwnProperty("expiresAt") && entity.hasOwnProperty("jwks_uri");
}
function generateAuthorityMetadataExpiresAt() {
  return nowSeconds() + AUTHORITY_METADATA_REFRESH_TIME_SECONDS;
}
function updateAuthorityEndpointMetadata(authorityMetadata, updatedValues, fromNetwork) {
  authorityMetadata.authorization_endpoint = updatedValues.authorization_endpoint;
  authorityMetadata.token_endpoint = updatedValues.token_endpoint;
  authorityMetadata.end_session_endpoint = updatedValues.end_session_endpoint;
  authorityMetadata.issuer = updatedValues.issuer;
  authorityMetadata.endpointsFromNetwork = fromNetwork;
  authorityMetadata.jwks_uri = updatedValues.jwks_uri;
}
function updateCloudDiscoveryMetadata(authorityMetadata, updatedValues, fromNetwork) {
  authorityMetadata.aliases = updatedValues.aliases;
  authorityMetadata.preferred_cache = updatedValues.preferred_cache;
  authorityMetadata.preferred_network = updatedValues.preferred_network;
  authorityMetadata.aliasesFromNetwork = fromNetwork;
}
function isAuthorityMetadataExpired(metadata) {
  return metadata.expiresAt <= nowSeconds();
}

// ../../node_modules/@azure/msal-common/dist-browser/telemetry/performance/PerformanceEvents.mjs
var PerformanceEvents_exports = {};
__export(PerformanceEvents_exports, {
  AuthClientCreateTokenRequestBody: () => AuthClientCreateTokenRequestBody,
  AuthClientExecuteTokenRequest: () => AuthClientExecuteTokenRequest,
  AuthorityGetCloudDiscoveryMetadataFromNetwork: () => AuthorityGetCloudDiscoveryMetadataFromNetwork,
  AuthorityGetEndpointMetadataFromNetwork: () => AuthorityGetEndpointMetadataFromNetwork,
  AuthorityResolveEndpointsAsync: () => AuthorityResolveEndpointsAsync,
  AuthorityUpdateCloudDiscoveryMetadata: () => AuthorityUpdateCloudDiscoveryMetadata,
  AuthorityUpdateEndpointMetadata: () => AuthorityUpdateEndpointMetadata,
  AuthorityUpdateMetadataWithRegionalInformation: () => AuthorityUpdateMetadataWithRegionalInformation,
  AuthorizationCodeClientExecutePostToTokenEndpoint: () => AuthorizationCodeClientExecutePostToTokenEndpoint,
  CacheManagerGetRefreshToken: () => CacheManagerGetRefreshToken,
  GetAuthCodeUrl: () => GetAuthCodeUrl,
  HandleCodeResponseFromServer: () => HandleCodeResponseFromServer,
  HandleServerTokenResponse: () => HandleServerTokenResponse,
  NetworkClientSendPostRequestAsync: () => NetworkClientSendPostRequestAsync,
  PopTokenGenerateCnf: () => PopTokenGenerateCnf,
  RefreshTokenClientAcquireToken: () => RefreshTokenClientAcquireToken,
  RefreshTokenClientAcquireTokenWithCachedRefreshToken: () => RefreshTokenClientAcquireTokenWithCachedRefreshToken,
  RefreshTokenClientCreateTokenRequestBody: () => RefreshTokenClientCreateTokenRequestBody,
  RefreshTokenClientExecutePostToTokenEndpoint: () => RefreshTokenClientExecutePostToTokenEndpoint,
  RefreshTokenClientExecuteTokenRequest: () => RefreshTokenClientExecuteTokenRequest,
  RegionDiscoveryDetectRegion: () => RegionDiscoveryDetectRegion,
  RegionDiscoveryGetCurrentVersion: () => RegionDiscoveryGetCurrentVersion,
  RegionDiscoveryGetRegionFromIMDS: () => RegionDiscoveryGetRegionFromIMDS,
  SetUserData: () => SetUserData,
  SilentFlowClientGenerateResultFromCacheRecord: () => SilentFlowClientGenerateResultFromCacheRecord,
  UpdateTokenEndpointAuthority: () => UpdateTokenEndpointAuthority
});
var NetworkClientSendPostRequestAsync = "networkClientSendPostRequestAsync";
var RefreshTokenClientExecutePostToTokenEndpoint = "refreshTokenClientExecutePostToTokenEndpoint";
var AuthorizationCodeClientExecutePostToTokenEndpoint = "authorizationCodeClientExecutePostToTokenEndpoint";
var RefreshTokenClientExecuteTokenRequest = "refreshTokenClientExecuteTokenRequest";
var RefreshTokenClientAcquireToken = "refreshTokenClientAcquireToken";
var RefreshTokenClientAcquireTokenWithCachedRefreshToken = "refreshTokenClientAcquireTokenWithCachedRefreshToken";
var RefreshTokenClientCreateTokenRequestBody = "refreshTokenClientCreateTokenRequestBody";
var SilentFlowClientGenerateResultFromCacheRecord = "silentFlowClientGenerateResultFromCacheRecord";
var GetAuthCodeUrl = "getAuthCodeUrl";
var HandleCodeResponseFromServer = "handleCodeResponseFromServer";
var AuthClientExecuteTokenRequest = "authClientExecuteTokenRequest";
var AuthClientCreateTokenRequestBody = "authClientCreateTokenRequestBody";
var UpdateTokenEndpointAuthority = "updateTokenEndpointAuthority";
var PopTokenGenerateCnf = "popTokenGenerateCnf";
var HandleServerTokenResponse = "handleServerTokenResponse";
var AuthorityResolveEndpointsAsync = "authorityResolveEndpointsAsync";
var AuthorityGetCloudDiscoveryMetadataFromNetwork = "authorityGetCloudDiscoveryMetadataFromNetwork";
var AuthorityUpdateCloudDiscoveryMetadata = "authorityUpdateCloudDiscoveryMetadata";
var AuthorityGetEndpointMetadataFromNetwork = "authorityGetEndpointMetadataFromNetwork";
var AuthorityUpdateEndpointMetadata = "authorityUpdateEndpointMetadata";
var AuthorityUpdateMetadataWithRegionalInformation = "authorityUpdateMetadataWithRegionalInformation";
var RegionDiscoveryDetectRegion = "regionDiscoveryDetectRegion";
var RegionDiscoveryGetRegionFromIMDS = "regionDiscoveryGetRegionFromIMDS";
var RegionDiscoveryGetCurrentVersion = "regionDiscoveryGetCurrentVersion";
var CacheManagerGetRefreshToken = "cacheManagerGetRefreshToken";
var SetUserData = "setUserData";

// ../../node_modules/@azure/msal-common/dist-browser/utils/FunctionWrappers.mjs
var invoke = (callback, eventName, logger, telemetryClient, correlationId) => {
  return (...args) => {
    logger.trace("1plfzx", correlationId);
    const inProgressEvent = telemetryClient.startMeasurement(eventName, correlationId);
    if (correlationId) {
      telemetryClient.incrementFields({ [`ext.${eventName}CallCount`]: 1 }, correlationId);
    }
    try {
      const result = callback(...args);
      inProgressEvent.end({
        success: true
      });
      logger.trace("1g8n6a", correlationId);
      return result;
    } catch (e) {
      logger.trace("0cfd8i", correlationId);
      try {
        logger.trace(JSON.stringify(e), correlationId);
      } catch (e2) {
        logger.trace("00dty7", correlationId);
      }
      inProgressEvent.end({
        success: false
      }, e);
      throw e;
    }
  };
};
var invokeAsync = (callback, eventName, logger, telemetryClient, correlationId) => {
  return (...args) => {
    logger.trace("1plfzx", correlationId);
    const inProgressEvent = telemetryClient.startMeasurement(eventName, correlationId);
    if (correlationId) {
      telemetryClient.incrementFields({ [`ext.${eventName}CallCount`]: 1 }, correlationId);
    }
    return callback(...args).then((response) => {
      logger.trace("1g8n6a", correlationId);
      inProgressEvent.end({
        success: true
      });
      return response;
    }).catch((e) => {
      logger.trace("0cfd8i", correlationId);
      try {
        logger.trace(JSON.stringify(e), correlationId);
      } catch (e2) {
        logger.trace("00dty7", correlationId);
      }
      inProgressEvent.end({
        success: false
      }, e);
      throw e;
    });
  };
};

// ../../node_modules/@azure/msal-common/dist-browser/crypto/PopTokenGenerator.mjs
var KeyLocation = {
  SW: "sw"
};
var PopTokenGenerator = class {
  constructor(cryptoUtils, performanceClient) {
    this.cryptoUtils = cryptoUtils;
    this.performanceClient = performanceClient;
  }
  /**
   * Generates the req_cnf validated at the RP in the POP protocol for SHR parameters
   * and returns an object containing the keyid, the full req_cnf string and the req_cnf string hash
   * @param request
   * @returns
   */
  async generateCnf(request, logger) {
    const reqCnf = await invokeAsync(this.generateKid.bind(this), PopTokenGenerateCnf, logger, this.performanceClient, request.correlationId)(request);
    const reqCnfString = this.cryptoUtils.base64UrlEncode(JSON.stringify(reqCnf));
    return {
      kid: reqCnf.kid,
      reqCnfString
    };
  }
  /**
   * Generates key_id for a SHR token request
   * @param request
   * @returns
   */
  async generateKid(request) {
    const kidThumbprint = await this.cryptoUtils.getPublicKeyThumbprint(request);
    return {
      kid: kidThumbprint,
      xms_ksl: KeyLocation.SW
    };
  }
  /**
   * Signs the POP access_token with the local generated key-pair
   * @param accessToken
   * @param request
   * @returns
   */
  async signPopToken(accessToken, keyId, request) {
    return this.signPayload(accessToken, keyId, request);
  }
  /**
   * Utility function to generate the signed JWT for an access_token
   * @param payload
   * @param kid
   * @param request
   * @param claims
   * @returns
   */
  async signPayload(payload, keyId, request, claims) {
    const { resourceRequestMethod, resourceRequestUri, shrClaims, shrNonce, shrOptions } = request;
    const resourceUrlString = resourceRequestUri ? new UrlString(resourceRequestUri) : void 0;
    const resourceUrlComponents = resourceUrlString?.getUrlComponents();
    return this.cryptoUtils.signJwt(__spreadValues({
      at: payload,
      ts: nowSeconds(),
      m: resourceRequestMethod?.toUpperCase(),
      u: resourceUrlComponents?.HostNameAndPort,
      nonce: shrNonce || this.cryptoUtils.createNewGuid(),
      p: resourceUrlComponents?.AbsolutePath,
      q: resourceUrlComponents?.QueryString ? [[], resourceUrlComponents.QueryString] : void 0,
      client_claims: shrClaims || void 0
    }, claims), keyId, shrOptions, request.correlationId);
  }
};

// ../../node_modules/@azure/msal-common/dist-browser/utils/ProtocolUtils.mjs
var ProtocolUtils_exports = {};
__export(ProtocolUtils_exports, {
  generateLibraryState: () => generateLibraryState,
  parseRequestState: () => parseRequestState,
  setRequestState: () => setRequestState
});
function setRequestState(cryptoObj, userState, meta) {
  const libraryState = generateLibraryState(cryptoObj, meta);
  return userState ? `${libraryState}${RESOURCE_DELIM}${userState}` : libraryState;
}
function generateLibraryState(cryptoObj, meta) {
  if (!cryptoObj) {
    throw createClientAuthError(noCryptoObject);
  }
  const stateObj = {
    id: cryptoObj.createNewGuid()
  };
  if (meta) {
    stateObj.meta = meta;
  }
  const stateString = JSON.stringify(stateObj);
  return cryptoObj.base64Encode(stateString);
}
function parseRequestState(base64Decode2, state) {
  if (!base64Decode2) {
    throw createClientAuthError(noCryptoObject);
  }
  if (!state) {
    throw createClientAuthError(invalidState);
  }
  try {
    const splitState = state.split(RESOURCE_DELIM);
    const libraryState = splitState[0];
    const userState = splitState.length > 1 ? splitState.slice(1).join(RESOURCE_DELIM) : "";
    const libraryStateString = base64Decode2(libraryState);
    const libraryStateObj = JSON.parse(libraryStateString);
    return {
      userRequestState: userState || "",
      libraryState: libraryStateObj
    };
  } catch (e) {
    throw createClientAuthError(invalidState);
  }
}

// ../../node_modules/@azure/msal-common/dist-browser/response/ResponseHandler.mjs
var ResponseHandler = class _ResponseHandler {
  constructor(clientId, cacheStorage, cryptoObj, logger, performanceClient, serializableCache, persistencePlugin) {
    this.clientId = clientId;
    this.cacheStorage = cacheStorage;
    this.cryptoObj = cryptoObj;
    this.logger = logger;
    this.performanceClient = performanceClient;
    this.serializableCache = serializableCache;
    this.persistencePlugin = persistencePlugin;
  }
  /**
   * Function which validates server authorization token response.
   * @param serverResponse
   * @param correlationId
   * @param refreshAccessToken
   */
  validateTokenResponse(serverResponse, correlationId, refreshAccessToken) {
    if (serverResponse.error || serverResponse.error_description || serverResponse.suberror) {
      const errString = `Error(s): ${serverResponse.error_codes || NOT_AVAILABLE} - Timestamp: ${serverResponse.timestamp || NOT_AVAILABLE} - Description: ${serverResponse.error_description || NOT_AVAILABLE} - Correlation ID: ${serverResponse.correlation_id || NOT_AVAILABLE} - Trace ID: ${serverResponse.trace_id || NOT_AVAILABLE}`;
      const serverErrorNo = serverResponse.error_codes?.length ? serverResponse.error_codes[0] : void 0;
      const serverError = new ServerError(serverResponse.error, errString, serverResponse.suberror, serverErrorNo, serverResponse.status);
      if (refreshAccessToken && serverResponse.status && serverResponse.status >= HTTP_SERVER_ERROR_RANGE_START && serverResponse.status <= HTTP_SERVER_ERROR_RANGE_END) {
        this.logger.warning("16ks7j", correlationId);
        return;
      } else if (refreshAccessToken && serverResponse.status && serverResponse.status >= HTTP_CLIENT_ERROR_RANGE_START && serverResponse.status <= HTTP_CLIENT_ERROR_RANGE_END) {
        this.logger.warning("0g61x3", correlationId);
        return;
      }
      if (isInteractionRequiredError(serverResponse.error, serverResponse.error_description, serverResponse.suberror)) {
        throw new InteractionRequiredAuthError(serverResponse.error, serverResponse.error_description, serverResponse.suberror, serverResponse.timestamp || "", serverResponse.trace_id || "", serverResponse.correlation_id || "", serverResponse.claims || "", serverErrorNo);
      }
      throw serverError;
    }
  }
  /**
   * Returns a constructed token response based on given string. Also manages the cache updates and cleanups.
   * @param serverTokenResponse
   * @param authority
   */
  async handleServerTokenResponse(serverTokenResponse, authority, reqTimestamp, request, apiId, authCodePayload, userAssertionHash, handlingRefreshTokenResponse, forceCacheRefreshTokenResponse, serverRequestId) {
    let idTokenClaims;
    if (serverTokenResponse.id_token) {
      idTokenClaims = extractTokenClaims(serverTokenResponse.id_token || "", this.cryptoObj.base64Decode);
      if (authCodePayload && authCodePayload.nonce) {
        if (idTokenClaims.nonce !== authCodePayload.nonce) {
          throw createClientAuthError(nonceMismatch);
        }
      }
      if (request.maxAge || request.maxAge === 0) {
        const authTime = idTokenClaims.auth_time;
        if (!authTime) {
          throw createClientAuthError(authTimeNotFound);
        }
        checkMaxAge(authTime, request.maxAge);
      }
    }
    this.homeAccountIdentifier = generateHomeAccountId(serverTokenResponse.client_info || "", authority.authorityType, this.logger, this.cryptoObj, request.correlationId, idTokenClaims);
    let requestStateObj;
    if (!!authCodePayload && !!authCodePayload.state) {
      requestStateObj = parseRequestState(this.cryptoObj.base64Decode, authCodePayload.state);
    }
    serverTokenResponse.key_id = serverTokenResponse.key_id || request.sshKid || void 0;
    const cacheRecord = this.generateCacheRecord(serverTokenResponse, authority, reqTimestamp, request, idTokenClaims, userAssertionHash, authCodePayload);
    let cacheContext;
    try {
      if (this.persistencePlugin && this.serializableCache) {
        this.logger.verbose("0jbz5k", request.correlationId);
        cacheContext = new TokenCacheContext(this.serializableCache, true);
        await this.persistencePlugin.beforeCacheAccess(cacheContext);
      }
      if (handlingRefreshTokenResponse && !forceCacheRefreshTokenResponse && cacheRecord.account) {
        const cachedAccounts = this.cacheStorage.getAllAccounts({
          homeAccountId: cacheRecord.account.homeAccountId,
          environment: cacheRecord.account.environment
        }, request.correlationId);
        if (cachedAccounts.length < 1) {
          this.logger.warning("1gmt66", request.correlationId);
          this.performanceClient?.addFields({
            acntLoggedOut: true
          }, request.correlationId);
          return await _ResponseHandler.generateAuthenticationResult(this.cryptoObj, authority, cacheRecord, false, request, this.performanceClient, idTokenClaims, requestStateObj, void 0, serverRequestId);
        }
      }
      await this.cacheStorage.saveCacheRecord(cacheRecord, request.correlationId, isKmsi(idTokenClaims || {}), apiId, request.storeInCache);
    } finally {
      if (this.persistencePlugin && this.serializableCache && cacheContext) {
        this.logger.verbose("1bh17u", request.correlationId);
        await this.persistencePlugin.afterCacheAccess(cacheContext);
      }
    }
    return _ResponseHandler.generateAuthenticationResult(this.cryptoObj, authority, cacheRecord, false, request, this.performanceClient, idTokenClaims, requestStateObj, serverTokenResponse, serverRequestId);
  }
  /**
   * Generates CacheRecord
   * @param serverTokenResponse
   * @param idTokenObj
   * @param authority
   */
  generateCacheRecord(serverTokenResponse, authority, reqTimestamp, request, idTokenClaims, userAssertionHash, authCodePayload) {
    const env = authority.getPreferredCache();
    if (!env) {
      throw createClientAuthError(invalidCacheEnvironment);
    }
    const claimsTenantId = getTenantIdFromIdTokenClaims(idTokenClaims);
    let cachedIdToken;
    let cachedAccount;
    if (serverTokenResponse.id_token && !!idTokenClaims) {
      cachedIdToken = createIdTokenEntity(this.homeAccountIdentifier, env, serverTokenResponse.id_token, this.clientId, claimsTenantId || "");
      cachedAccount = buildAccountToCache(
        this.cacheStorage,
        authority,
        this.homeAccountIdentifier,
        this.cryptoObj.base64Decode,
        request.correlationId,
        idTokenClaims,
        serverTokenResponse.client_info,
        env,
        claimsTenantId,
        authCodePayload,
        void 0,
        // nativeAccountId
        this.logger,
        this.performanceClient
      );
    }
    let cachedAccessToken = null;
    if (serverTokenResponse.access_token) {
      const responseScopes = serverTokenResponse.scope ? ScopeSet.fromString(serverTokenResponse.scope) : new ScopeSet(request.scopes || []);
      const expiresIn = (typeof serverTokenResponse.expires_in === "string" ? parseInt(serverTokenResponse.expires_in, 10) : serverTokenResponse.expires_in) || 0;
      const extExpiresIn = (typeof serverTokenResponse.ext_expires_in === "string" ? parseInt(serverTokenResponse.ext_expires_in, 10) : serverTokenResponse.ext_expires_in) || 0;
      const refreshIn = (typeof serverTokenResponse.refresh_in === "string" ? parseInt(serverTokenResponse.refresh_in, 10) : serverTokenResponse.refresh_in) || void 0;
      const tokenExpirationSeconds = reqTimestamp + expiresIn;
      const extendedTokenExpirationSeconds = tokenExpirationSeconds + extExpiresIn;
      const refreshOnSeconds = refreshIn && refreshIn > 0 ? reqTimestamp + refreshIn : void 0;
      cachedAccessToken = createAccessTokenEntity(this.homeAccountIdentifier, env, serverTokenResponse.access_token, this.clientId, claimsTenantId || authority.tenant || "", responseScopes.printScopes(), tokenExpirationSeconds, extendedTokenExpirationSeconds, this.cryptoObj.base64Decode, refreshOnSeconds, serverTokenResponse.token_type, userAssertionHash, serverTokenResponse.key_id);
      const resource = request.resource || null;
      if (resource) {
        cachedAccessToken.resource = resource;
      }
    }
    let cachedRefreshToken = null;
    if (serverTokenResponse.refresh_token) {
      let rtExpiresOn;
      if (serverTokenResponse.refresh_token_expires_in) {
        const rtExpiresIn = typeof serverTokenResponse.refresh_token_expires_in === "string" ? parseInt(serverTokenResponse.refresh_token_expires_in, 10) : serverTokenResponse.refresh_token_expires_in;
        rtExpiresOn = reqTimestamp + rtExpiresIn;
        this.performanceClient?.addFields({ ntwkRtExpiresOnSeconds: rtExpiresOn }, request.correlationId);
      }
      cachedRefreshToken = createRefreshTokenEntity(this.homeAccountIdentifier, env, serverTokenResponse.refresh_token, this.clientId, serverTokenResponse.foci, userAssertionHash, rtExpiresOn);
    }
    let cachedAppMetadata = null;
    if (serverTokenResponse.foci) {
      cachedAppMetadata = {
        clientId: this.clientId,
        environment: env,
        familyId: serverTokenResponse.foci
      };
    }
    return {
      account: cachedAccount,
      idToken: cachedIdToken,
      accessToken: cachedAccessToken,
      refreshToken: cachedRefreshToken,
      appMetadata: cachedAppMetadata
    };
  }
  /**
   * Creates an @AuthenticationResult from @CacheRecord , @IdToken , and a boolean that states whether or not the result is from cache.
   *
   * Optionally takes a state string that is set as-is in the response.
   *
   * @param cacheRecord
   * @param idTokenObj
   * @param fromTokenCache
   * @param stateString
   */
  static async generateAuthenticationResult(cryptoObj, authority, cacheRecord, fromTokenCache, request, performanceClient, idTokenClaims, requestState, serverTokenResponse, requestId) {
    let accessToken = "";
    let responseScopes = [];
    let expiresOn = null;
    let extExpiresOn;
    let refreshOn;
    let familyId = "";
    if (cacheRecord.accessToken) {
      if (cacheRecord.accessToken.tokenType === AuthenticationScheme.POP && !request.popKid) {
        const popTokenGenerator = new PopTokenGenerator(cryptoObj, performanceClient);
        const { secret, keyId } = cacheRecord.accessToken;
        if (!keyId) {
          throw createClientAuthError(keyIdMissing);
        }
        accessToken = await popTokenGenerator.signPopToken(secret, keyId, request);
      } else {
        accessToken = cacheRecord.accessToken.secret;
      }
      responseScopes = ScopeSet.fromString(cacheRecord.accessToken.target).asArray();
      expiresOn = toDateFromSeconds(cacheRecord.accessToken.expiresOn);
      extExpiresOn = toDateFromSeconds(cacheRecord.accessToken.extendedExpiresOn);
      if (cacheRecord.accessToken.refreshOn) {
        refreshOn = toDateFromSeconds(cacheRecord.accessToken.refreshOn);
      }
    }
    if (cacheRecord.appMetadata) {
      familyId = cacheRecord.appMetadata.familyId === THE_FAMILY_ID ? THE_FAMILY_ID : "";
    }
    const uid = idTokenClaims?.oid || idTokenClaims?.sub || "";
    const tid = idTokenClaims?.tid || "";
    if (serverTokenResponse?.spa_accountid && !!cacheRecord.account) {
      cacheRecord.account.nativeAccountId = serverTokenResponse?.spa_accountid;
    }
    const accountInfo = cacheRecord.account ? updateAccountTenantProfileData(
      getAccountInfo(cacheRecord.account),
      void 0,
      // tenantProfile optional
      idTokenClaims,
      cacheRecord.idToken?.secret
    ) : null;
    return {
      authority: authority.canonicalAuthority,
      uniqueId: uid,
      tenantId: tid,
      scopes: responseScopes,
      account: accountInfo,
      idToken: cacheRecord?.idToken?.secret || "",
      idTokenClaims: idTokenClaims || {},
      accessToken,
      fromCache: fromTokenCache,
      expiresOn,
      extExpiresOn,
      refreshOn,
      correlationId: request.correlationId,
      requestId: requestId || "",
      familyId,
      tokenType: cacheRecord.accessToken?.tokenType || "",
      state: requestState ? requestState.userRequestState : "",
      cloudGraphHostName: cacheRecord.account?.cloudGraphHostName || "",
      msGraphHost: cacheRecord.account?.msGraphHost || "",
      code: serverTokenResponse?.spa_code,
      fromPlatformBroker: false
    };
  }
};
function buildAccountToCache(cacheStorage, authority, homeAccountId, base64Decode2, correlationId, idTokenClaims, clientInfo, environment, claimsTenantId, authCodePayload, nativeAccountId, logger, performanceClient) {
  logger?.verbose("09jz0t", correlationId);
  const accountEnvironment = environment || authority.getPreferredCache();
  const matchedAccounts = cacheStorage.getAccountsFilteredBy({ homeAccountId, environment: accountEnvironment }, correlationId);
  performanceClient?.addFields({ cacheMatchedAccounts: matchedAccounts.length }, correlationId);
  if (matchedAccounts.length > 1) {
    logger?.warning("0x7ad1", correlationId);
  }
  const cachedAccount = matchedAccounts.length === 1 ? matchedAccounts[0] : null;
  const baseAccount = cachedAccount || createAccountEntity({
    homeAccountId,
    idTokenClaims,
    clientInfo,
    environment,
    cloudGraphHostName: authCodePayload?.cloud_graph_host_name,
    msGraphHost: authCodePayload?.msgraph_host,
    nativeAccountId
  }, authority, base64Decode2);
  const tenantProfiles = baseAccount.tenantProfiles || [];
  const tenantId = claimsTenantId || baseAccount.realm;
  if (tenantId && !tenantProfiles.find((tenantProfile) => {
    return tenantProfile.tenantId === tenantId;
  })) {
    const newTenantProfile = buildTenantProfile(homeAccountId, baseAccount.localAccountId, tenantId, idTokenClaims);
    tenantProfiles.push(newTenantProfile);
  }
  baseAccount.tenantProfiles = tenantProfiles;
  return baseAccount;
}

// ../../node_modules/@azure/msal-common/dist-browser/account/CcsCredential.mjs
var CcsCredentialType = {
  HOME_ACCOUNT_ID: "home_account_id",
  UPN: "UPN"
};

// ../../node_modules/@azure/msal-common/dist-browser/utils/ClientAssertionUtils.mjs
async function getClientAssertion(clientAssertion, clientId, tokenEndpoint) {
  if (typeof clientAssertion === "string") {
    return clientAssertion;
  } else {
    const config = {
      clientId,
      tokenEndpoint
    };
    return clientAssertion(config);
  }
}

// ../../node_modules/@azure/msal-common/dist-browser/network/RequestThumbprint.mjs
function getRequestThumbprint(clientId, request, homeAccountId) {
  return {
    clientId,
    authority: request.authority,
    scopes: request.scopes,
    homeAccountIdentifier: homeAccountId,
    claims: request.claims,
    authenticationScheme: request.authenticationScheme,
    resourceRequestMethod: request.resourceRequestMethod,
    resourceRequestUri: request.resourceRequestUri,
    shrClaims: request.shrClaims,
    sshKid: request.sshKid,
    embeddedClientId: request.embeddedClientId || request.extraParameters?.clientId
  };
}

// ../../node_modules/@azure/msal-common/dist-browser/network/ThrottlingUtils.mjs
var ThrottlingUtils = class _ThrottlingUtils {
  /**
   * Prepares a RequestThumbprint to be stored as a key.
   * @param thumbprint
   */
  static generateThrottlingStorageKey(thumbprint) {
    return `${THROTTLING_PREFIX}.${JSON.stringify(thumbprint)}`;
  }
  /**
   * Performs necessary throttling checks before a network request.
   * @param cacheManager
   * @param thumbprint
   */
  static preProcess(cacheManager, thumbprint, correlationId) {
    const key = _ThrottlingUtils.generateThrottlingStorageKey(thumbprint);
    const value = cacheManager.getThrottlingCache(key, correlationId);
    if (value) {
      if (value.throttleTime < Date.now()) {
        cacheManager.removeItem(key, correlationId);
        return;
      }
      throw new ServerError(value.errorCodes?.join(" ") || "", value.errorMessage, value.subError);
    }
  }
  /**
   * Performs necessary throttling checks after a network request.
   * @param cacheManager
   * @param thumbprint
   * @param response
   */
  static postProcess(cacheManager, thumbprint, response, correlationId) {
    if (_ThrottlingUtils.checkResponseStatus(response) || _ThrottlingUtils.checkResponseForRetryAfter(response)) {
      const thumbprintValue = {
        throttleTime: _ThrottlingUtils.calculateThrottleTime(parseInt(response.headers[HeaderNames.RETRY_AFTER])),
        error: response.body.error,
        errorCodes: response.body.error_codes,
        errorMessage: response.body.error_description,
        subError: response.body.suberror
      };
      cacheManager.setThrottlingCache(_ThrottlingUtils.generateThrottlingStorageKey(thumbprint), thumbprintValue, correlationId);
    }
  }
  /**
   * Checks a NetworkResponse object's status codes against 429 or 5xx
   * @param response
   */
  static checkResponseStatus(response) {
    return response.status === 429 || response.status >= 500 && response.status < 600;
  }
  /**
   * Checks a NetworkResponse object's RetryAfter header
   * @param response
   */
  static checkResponseForRetryAfter(response) {
    if (response.headers) {
      return response.headers.hasOwnProperty(HeaderNames.RETRY_AFTER) && (response.status < 200 || response.status >= 300);
    }
    return false;
  }
  /**
   * Calculates the Unix-time value for a throttle to expire given throttleTime in seconds.
   * @param throttleTime
   */
  static calculateThrottleTime(throttleTime) {
    const time = throttleTime <= 0 ? 0 : throttleTime;
    const currentSeconds = Date.now() / 1e3;
    return Math.floor(Math.min(currentSeconds + (time || DEFAULT_THROTTLE_TIME_SECONDS), currentSeconds + DEFAULT_MAX_THROTTLE_TIME_SECONDS) * 1e3);
  }
  static removeThrottle(cacheManager, clientId, request, homeAccountIdentifier) {
    const thumbprint = getRequestThumbprint(clientId, request, homeAccountIdentifier);
    const key = this.generateThrottlingStorageKey(thumbprint);
    cacheManager.removeItem(key, request.correlationId);
  }
};

// ../../node_modules/@azure/msal-common/dist-browser/error/NetworkError.mjs
var NetworkError = class _NetworkError extends AuthError {
  constructor(error, httpStatus, responseHeaders) {
    super(error.errorCode, error.errorMessage, error.subError);
    Object.setPrototypeOf(this, _NetworkError.prototype);
    this.name = "NetworkError";
    this.error = error;
    this.httpStatus = httpStatus;
    this.responseHeaders = responseHeaders;
  }
};
function createNetworkError(error, httpStatus, responseHeaders, additionalError) {
  error.errorMessage = `${error.errorMessage}, additionalErrorInfo: error.name:${additionalError?.name}, error.message:${additionalError?.message}`;
  return new NetworkError(error, httpStatus, responseHeaders);
}

// ../../node_modules/@azure/msal-common/dist-browser/protocol/Token.mjs
function createTokenRequestHeaders(logger, preventCorsPreflight, ccsCred) {
  const headers = {};
  headers[HeaderNames.CONTENT_TYPE] = URL_FORM_CONTENT_TYPE;
  if (!preventCorsPreflight && ccsCred) {
    switch (ccsCred.type) {
      case CcsCredentialType.HOME_ACCOUNT_ID:
        try {
          const clientInfo = buildClientInfoFromHomeAccountId(ccsCred.credential);
          headers[HeaderNames.CCS_HEADER] = `Oid:${clientInfo.uid}@${clientInfo.utid}`;
        } catch (e) {
          logger.verbose("1qhtee", "");
        }
        break;
      case CcsCredentialType.UPN:
        headers[HeaderNames.CCS_HEADER] = `UPN: ${ccsCred.credential}`;
        break;
    }
  }
  return headers;
}
function createTokenQueryParameters(request, clientId, redirectUri, performanceClient) {
  const parameters = /* @__PURE__ */ new Map();
  if (request.embeddedClientId) {
    addBrokerParameters(parameters, clientId, redirectUri);
  }
  if (request.extraQueryParameters) {
    addExtraParameters(parameters, request.extraQueryParameters);
  }
  addCorrelationId(parameters, request.correlationId);
  instrumentBrokerParams(parameters, request.correlationId, performanceClient);
  return mapToQueryString(parameters);
}
async function executePostToTokenEndpoint(tokenEndpoint, queryString, headers, thumbprint, correlationId, cacheManager, networkClient, logger, performanceClient, serverTelemetryManager) {
  const response = await sendPostRequest(thumbprint, tokenEndpoint, { body: queryString, headers }, correlationId, cacheManager, networkClient, logger, performanceClient);
  if (serverTelemetryManager && response.status < 500 && response.status !== 429) {
    serverTelemetryManager.clearTelemetryCache();
  }
  return response;
}
async function sendPostRequest(thumbprint, tokenEndpoint, options, correlationId, cacheManager, networkClient, logger, performanceClient) {
  ThrottlingUtils.preProcess(cacheManager, thumbprint, correlationId);
  let response;
  try {
    response = await invokeAsync(networkClient.sendPostRequestAsync.bind(networkClient), NetworkClientSendPostRequestAsync, logger, performanceClient, correlationId)(tokenEndpoint, options);
    const responseHeaders = response.headers || {};
    performanceClient?.addFields({
      refreshTokenSize: response.body.refresh_token?.length || 0,
      httpVerToken: responseHeaders[HeaderNames.X_MS_HTTP_VERSION] || "",
      requestId: responseHeaders[HeaderNames.X_MS_REQUEST_ID] || ""
    }, correlationId);
  } catch (e) {
    if (e instanceof NetworkError) {
      const responseHeaders = e.responseHeaders;
      if (responseHeaders) {
        performanceClient?.addFields({
          httpVerToken: responseHeaders[HeaderNames.X_MS_HTTP_VERSION] || "",
          requestId: responseHeaders[HeaderNames.X_MS_REQUEST_ID] || "",
          contentTypeHeader: responseHeaders[HeaderNames.CONTENT_TYPE] || void 0,
          contentLengthHeader: responseHeaders[HeaderNames.CONTENT_LENGTH] || void 0,
          httpStatus: e.httpStatus
        }, correlationId);
      }
      throw e.error;
    }
    if (e instanceof AuthError) {
      throw e;
    } else {
      throw createClientAuthError(networkError);
    }
  }
  ThrottlingUtils.postProcess(cacheManager, thumbprint, response, correlationId);
  return response;
}

// ../../node_modules/@azure/msal-common/dist-browser/authority/AuthorityFactory.mjs
var AuthorityFactory_exports = {};
__export(AuthorityFactory_exports, {
  createDiscoveredInstance: () => createDiscoveredInstance
});

// ../../node_modules/@azure/msal-common/dist-browser/authority/OpenIdConfigResponse.mjs
function isOpenIdConfigResponse(response) {
  return response.hasOwnProperty("authorization_endpoint") && response.hasOwnProperty("token_endpoint") && response.hasOwnProperty("issuer") && response.hasOwnProperty("jwks_uri");
}

// ../../node_modules/@azure/msal-common/dist-browser/authority/CloudInstanceDiscoveryResponse.mjs
function isCloudInstanceDiscoveryResponse(response) {
  return response.hasOwnProperty("tenant_discovery_endpoint") && response.hasOwnProperty("metadata");
}

// ../../node_modules/@azure/msal-common/dist-browser/authority/CloudInstanceDiscoveryErrorResponse.mjs
function isCloudInstanceDiscoveryErrorResponse(response) {
  return response.hasOwnProperty("error") && response.hasOwnProperty("error_description");
}

// ../../node_modules/@azure/msal-common/dist-browser/authority/RegionDiscovery.mjs
var RegionDiscovery = class _RegionDiscovery {
  constructor(networkInterface, logger, performanceClient, correlationId) {
    this.networkInterface = networkInterface;
    this.logger = logger;
    this.performanceClient = performanceClient;
    this.correlationId = correlationId;
  }
  /**
   * Detect the region from the application's environment.
   *
   * @returns Promise<string | null>
   */
  async detectRegion(environmentRegion, regionDiscoveryMetadata) {
    let autodetectedRegionName = environmentRegion;
    if (!autodetectedRegionName) {
      const options = _RegionDiscovery.IMDS_OPTIONS;
      try {
        const localIMDSVersionResponse = await invokeAsync(this.getRegionFromIMDS.bind(this), RegionDiscoveryGetRegionFromIMDS, this.logger, this.performanceClient, this.correlationId)(IMDS_VERSION, options);
        if (localIMDSVersionResponse.status === HTTP_SUCCESS) {
          autodetectedRegionName = localIMDSVersionResponse.body;
          regionDiscoveryMetadata.region_source = RegionDiscoverySources.IMDS;
        }
        if (localIMDSVersionResponse.status === HTTP_BAD_REQUEST) {
          const currentIMDSVersion = await invokeAsync(this.getCurrentVersion.bind(this), RegionDiscoveryGetCurrentVersion, this.logger, this.performanceClient, this.correlationId)(options);
          if (!currentIMDSVersion) {
            regionDiscoveryMetadata.region_source = RegionDiscoverySources.FAILED_AUTO_DETECTION;
            return null;
          }
          const currentIMDSVersionResponse = await invokeAsync(this.getRegionFromIMDS.bind(this), RegionDiscoveryGetRegionFromIMDS, this.logger, this.performanceClient, this.correlationId)(currentIMDSVersion, options);
          if (currentIMDSVersionResponse.status === HTTP_SUCCESS) {
            autodetectedRegionName = currentIMDSVersionResponse.body;
            regionDiscoveryMetadata.region_source = RegionDiscoverySources.IMDS;
          }
        }
      } catch (e) {
        regionDiscoveryMetadata.region_source = RegionDiscoverySources.FAILED_AUTO_DETECTION;
        return null;
      }
    } else {
      regionDiscoveryMetadata.region_source = RegionDiscoverySources.ENVIRONMENT_VARIABLE;
    }
    if (!autodetectedRegionName) {
      regionDiscoveryMetadata.region_source = RegionDiscoverySources.FAILED_AUTO_DETECTION;
    }
    return autodetectedRegionName || null;
  }
  /**
   * Make the call to the IMDS endpoint
   *
   * @param imdsEndpointUrl
   * @returns Promise<NetworkResponse<string>>
   */
  async getRegionFromIMDS(version2, options) {
    return this.networkInterface.sendGetRequestAsync(`${IMDS_ENDPOINT}?api-version=${version2}&format=text`, options, IMDS_TIMEOUT);
  }
  /**
   * Get the most recent version of the IMDS endpoint available
   *
   * @returns Promise<string | null>
   */
  async getCurrentVersion(options) {
    try {
      const response = await this.networkInterface.sendGetRequestAsync(`${IMDS_ENDPOINT}?format=json`, options);
      if (response.status === HTTP_BAD_REQUEST && response.body && response.body["newest-versions"] && response.body["newest-versions"].length > 0) {
        return response.body["newest-versions"][0];
      }
      return null;
    } catch (e) {
      return null;
    }
  }
};
RegionDiscovery.IMDS_OPTIONS = {
  headers: {
    Metadata: "true"
  }
};

// ../../node_modules/@azure/msal-common/dist-browser/authority/Authority.mjs
var Authority = class _Authority {
  constructor(authority, networkInterface, cacheManager, authorityOptions, logger, correlationId, performanceClient, managedIdentity) {
    this.canonicalAuthority = authority;
    this._canonicalAuthority.validateAsUri();
    this.networkInterface = networkInterface;
    this.cacheManager = cacheManager;
    this.authorityOptions = authorityOptions;
    this.regionDiscoveryMetadata = {
      region_used: void 0,
      region_source: void 0,
      region_outcome: void 0
    };
    this.logger = logger;
    this.performanceClient = performanceClient;
    this.correlationId = correlationId;
    this.managedIdentity = managedIdentity || false;
    this.regionDiscovery = new RegionDiscovery(networkInterface, this.logger, this.performanceClient, this.correlationId);
  }
  /**
   * Get {@link AuthorityType}
   * @param authorityUri {@link IUri}
   * @private
   */
  getAuthorityType(authorityUri) {
    if (authorityUri.HostNameAndPort.endsWith(CIAM_AUTH_URL)) {
      return AuthorityType.Ciam;
    }
    const pathSegments = authorityUri.PathSegments;
    if (pathSegments.length) {
      switch (pathSegments[0].toLowerCase()) {
        case ADFS:
          return AuthorityType.Adfs;
        case DSTS:
          return AuthorityType.Dsts;
      }
    }
    return AuthorityType.Default;
  }
  // See above for AuthorityType
  get authorityType() {
    return this.getAuthorityType(this.canonicalAuthorityUrlComponents);
  }
  /**
   * ProtocolMode enum representing the way endpoints are constructed.
   */
  get protocolMode() {
    return this.authorityOptions.protocolMode;
  }
  /**
   * Returns authorityOptions which can be used to reinstantiate a new authority instance
   */
  get options() {
    return this.authorityOptions;
  }
  /**
   * A URL that is the authority set by the developer
   */
  get canonicalAuthority() {
    return this._canonicalAuthority.urlString;
  }
  /**
   * Sets canonical authority.
   */
  set canonicalAuthority(url) {
    this._canonicalAuthority = new UrlString(url);
    this._canonicalAuthority.validateAsUri();
    this._canonicalAuthorityUrlComponents = null;
  }
  /**
   * Get authority components.
   */
  get canonicalAuthorityUrlComponents() {
    if (!this._canonicalAuthorityUrlComponents) {
      this._canonicalAuthorityUrlComponents = this._canonicalAuthority.getUrlComponents();
    }
    return this._canonicalAuthorityUrlComponents;
  }
  /**
   * Get hostname and port i.e. login.microsoftonline.com
   */
  get hostnameAndPort() {
    return this.canonicalAuthorityUrlComponents.HostNameAndPort.toLowerCase();
  }
  /**
   * Get tenant for authority.
   */
  get tenant() {
    return this.canonicalAuthorityUrlComponents.PathSegments[0];
  }
  /**
   * OAuth /authorize endpoint for requests
   */
  get authorizationEndpoint() {
    if (this.discoveryComplete()) {
      return this.replacePath(this.metadata.authorization_endpoint);
    } else {
      throw createClientAuthError(endpointResolutionError);
    }
  }
  /**
   * OAuth /token endpoint for requests
   */
  get tokenEndpoint() {
    if (this.discoveryComplete()) {
      return this.replacePath(this.metadata.token_endpoint);
    } else {
      throw createClientAuthError(endpointResolutionError);
    }
  }
  get deviceCodeEndpoint() {
    if (this.discoveryComplete()) {
      return this.replacePath(this.metadata.token_endpoint.replace("/token", "/devicecode"));
    } else {
      throw createClientAuthError(endpointResolutionError);
    }
  }
  /**
   * OAuth logout endpoint for requests
   */
  get endSessionEndpoint() {
    if (this.discoveryComplete()) {
      if (!this.metadata.end_session_endpoint) {
        throw createClientAuthError(endSessionEndpointNotSupported);
      }
      return this.replacePath(this.metadata.end_session_endpoint);
    } else {
      throw createClientAuthError(endpointResolutionError);
    }
  }
  /**
   * OAuth issuer for requests
   */
  get selfSignedJwtAudience() {
    if (this.discoveryComplete()) {
      return this.replacePath(this.metadata.issuer);
    } else {
      throw createClientAuthError(endpointResolutionError);
    }
  }
  /**
   * Jwks_uri for token signing keys
   */
  get jwksUri() {
    if (this.discoveryComplete()) {
      return this.replacePath(this.metadata.jwks_uri);
    } else {
      throw createClientAuthError(endpointResolutionError);
    }
  }
  /**
   * Returns a flag indicating that tenant name can be replaced in authority {@link IUri}
   * @param authorityUri {@link IUri}
   * @private
   */
  canReplaceTenant(authorityUri) {
    return authorityUri.PathSegments.length === 1 && !_Authority.reservedTenantDomains.has(authorityUri.PathSegments[0]) && this.getAuthorityType(authorityUri) === AuthorityType.Default && this.protocolMode !== ProtocolMode.OIDC;
  }
  /**
   * Replaces tenant in url path with current tenant. Defaults to common.
   * @param urlString
   */
  replaceTenant(urlString) {
    return urlString.replace(/{tenant}|{tenantid}/g, this.tenant);
  }
  /**
   * Replaces path such as tenant or policy with the current tenant or policy.
   * @param urlString
   */
  replacePath(urlString) {
    let endpoint = urlString;
    const cachedAuthorityUrl = new UrlString(this.metadata.canonical_authority);
    const cachedAuthorityUrlComponents = cachedAuthorityUrl.getUrlComponents();
    const cachedAuthorityParts = cachedAuthorityUrlComponents.PathSegments;
    const currentAuthorityParts = this.canonicalAuthorityUrlComponents.PathSegments;
    currentAuthorityParts.forEach((currentPart, index) => {
      let cachedPart = cachedAuthorityParts[index];
      if (index === 0 && this.canReplaceTenant(cachedAuthorityUrlComponents)) {
        const tenantId = new UrlString(this.metadata.authorization_endpoint).getUrlComponents().PathSegments[0];
        if (cachedPart !== tenantId) {
          this.logger.verbose("1q3g2x", this.correlationId);
          cachedPart = tenantId;
        }
      }
      if (currentPart !== cachedPart) {
        endpoint = endpoint.replace(`/${cachedPart}/`, `/${currentPart}/`);
      }
    });
    return this.replaceTenant(endpoint);
  }
  /**
   * The default open id configuration endpoint for any canonical authority.
   */
  get defaultOpenIdConfigurationEndpoint() {
    const canonicalAuthorityHost = this.hostnameAndPort;
    if (this.canonicalAuthority.endsWith("v2.0/") || this.authorityType === AuthorityType.Adfs || this.protocolMode === ProtocolMode.OIDC && !this.isAliasOfKnownMicrosoftAuthority(canonicalAuthorityHost)) {
      return `${this.canonicalAuthority}.well-known/openid-configuration`;
    }
    return `${this.canonicalAuthority}v2.0/.well-known/openid-configuration`;
  }
  /**
   * Boolean that returns whether or not tenant discovery has been completed.
   */
  discoveryComplete() {
    return !!this.metadata;
  }
  /**
   * Perform endpoint discovery to discover aliases, preferred_cache, preferred_network
   * and the /authorize, /token and logout endpoints.
   */
  async resolveEndpointsAsync() {
    const metadataEntity = this.getCurrentMetadataEntity();
    const cloudDiscoverySource = await invokeAsync(this.updateCloudDiscoveryMetadata.bind(this), AuthorityUpdateCloudDiscoveryMetadata, this.logger, this.performanceClient, this.correlationId)(metadataEntity);
    this.canonicalAuthority = this.canonicalAuthority.replace(this.hostnameAndPort, metadataEntity.preferred_network);
    const endpointSource = await invokeAsync(this.updateEndpointMetadata.bind(this), AuthorityUpdateEndpointMetadata, this.logger, this.performanceClient, this.correlationId)(metadataEntity);
    this.updateCachedMetadata(metadataEntity, cloudDiscoverySource, {
      source: endpointSource
    });
    this.performanceClient?.addFields({
      cloudDiscoverySource,
      authorityEndpointSource: endpointSource
    }, this.correlationId);
  }
  /**
   * Returns metadata entity from cache if it exists, otherwise returns a new metadata entity built
   * from the configured canonical authority
   * @returns
   */
  getCurrentMetadataEntity() {
    let metadataEntity = this.cacheManager.getAuthorityMetadataByAlias(this.hostnameAndPort, this.correlationId);
    if (!metadataEntity) {
      metadataEntity = {
        aliases: [],
        preferred_cache: this.hostnameAndPort,
        preferred_network: this.hostnameAndPort,
        canonical_authority: this.canonicalAuthority,
        authorization_endpoint: "",
        token_endpoint: "",
        end_session_endpoint: "",
        issuer: "",
        aliasesFromNetwork: false,
        endpointsFromNetwork: false,
        expiresAt: generateAuthorityMetadataExpiresAt(),
        jwks_uri: ""
      };
    }
    return metadataEntity;
  }
  /**
   * Updates cached metadata based on metadata source and sets the instance's metadata
   * property to the same value
   * @param metadataEntity
   * @param cloudDiscoverySource
   * @param endpointMetadataResult
   */
  updateCachedMetadata(metadataEntity, cloudDiscoverySource, endpointMetadataResult) {
    if (cloudDiscoverySource !== AuthorityMetadataSource.CACHE && endpointMetadataResult?.source !== AuthorityMetadataSource.CACHE) {
      metadataEntity.expiresAt = generateAuthorityMetadataExpiresAt();
      metadataEntity.canonical_authority = this.canonicalAuthority;
    }
    const cacheKey = this.cacheManager.generateAuthorityMetadataCacheKey(metadataEntity.preferred_cache, this.correlationId);
    this.cacheManager.setAuthorityMetadata(cacheKey, metadataEntity, this.correlationId);
    this.metadata = metadataEntity;
  }
  /**
   * Update AuthorityMetadataEntity with new endpoints and return where the information came from
   * @param metadataEntity
   */
  async updateEndpointMetadata(metadataEntity) {
    const localMetadata = this.updateEndpointMetadataFromLocalSources(metadataEntity);
    if (localMetadata) {
      if (localMetadata.source === AuthorityMetadataSource.HARDCODED_VALUES) {
        if (this.authorityOptions.azureRegionConfiguration?.azureRegion) {
          if (localMetadata.metadata) {
            const hardcodedMetadata = await invokeAsync(this.updateMetadataWithRegionalInformation.bind(this), AuthorityUpdateMetadataWithRegionalInformation, this.logger, this.performanceClient, this.correlationId)(localMetadata.metadata);
            updateAuthorityEndpointMetadata(metadataEntity, hardcodedMetadata, false);
            metadataEntity.canonical_authority = this.canonicalAuthority;
          }
        }
      }
      return localMetadata.source;
    }
    let metadata = await invokeAsync(this.getEndpointMetadataFromNetwork.bind(this), AuthorityGetEndpointMetadataFromNetwork, this.logger, this.performanceClient, this.correlationId)();
    if (metadata) {
      this.validateIssuer(metadata.issuer);
      if (this.authorityOptions.azureRegionConfiguration?.azureRegion) {
        metadata = await invokeAsync(this.updateMetadataWithRegionalInformation.bind(this), AuthorityUpdateMetadataWithRegionalInformation, this.logger, this.performanceClient, this.correlationId)(metadata);
      }
      updateAuthorityEndpointMetadata(metadataEntity, metadata, true);
      return AuthorityMetadataSource.NETWORK;
    } else {
      throw createClientAuthError(openIdConfigError, this.defaultOpenIdConfigurationEndpoint);
    }
  }
  /**
   * Updates endpoint metadata from local sources and returns where the information was retrieved from and the metadata config
   * response if the source is hardcoded metadata
   * @param metadataEntity
   * @returns
   */
  updateEndpointMetadataFromLocalSources(metadataEntity) {
    this.logger.verbose("1fi0kc", this.correlationId);
    const configMetadata = this.getEndpointMetadataFromConfig();
    if (configMetadata) {
      this.logger.verbose("06t0uj", this.correlationId);
      updateAuthorityEndpointMetadata(metadataEntity, configMetadata, false);
      return {
        source: AuthorityMetadataSource.CONFIG
      };
    }
    this.logger.verbose("151k0p", this.correlationId);
    const hardcodedMetadata = this.getEndpointMetadataFromHardcodedValues();
    if (hardcodedMetadata) {
      updateAuthorityEndpointMetadata(metadataEntity, hardcodedMetadata, false);
      return {
        source: AuthorityMetadataSource.HARDCODED_VALUES,
        metadata: hardcodedMetadata
      };
    } else {
      this.logger.verbose("1imop5", this.correlationId);
    }
    const metadataEntityExpired = isAuthorityMetadataExpired(metadataEntity);
    if (this.isAuthoritySameType(metadataEntity) && metadataEntity.endpointsFromNetwork && !metadataEntityExpired) {
      this.logger.verbose("16uq31", "");
      return { source: AuthorityMetadataSource.CACHE };
    } else if (metadataEntityExpired) {
      this.logger.verbose("0uoibc", "");
    }
    return null;
  }
  /**
   * Compares the number of url components after the domain to determine if the cached
   * authority metadata can be used for the requested authority. Protects against same domain different
   * authority such as login.microsoftonline.com/tenant and login.microsoftonline.com/tfp/tenant/policy
   * @param metadataEntity
   */
  isAuthoritySameType(metadataEntity) {
    const cachedAuthorityUrl = new UrlString(metadataEntity.canonical_authority);
    const cachedParts = cachedAuthorityUrl.getUrlComponents().PathSegments;
    return cachedParts.length === this.canonicalAuthorityUrlComponents.PathSegments.length;
  }
  /**
   * Parse authorityMetadata config option
   */
  getEndpointMetadataFromConfig() {
    if (this.authorityOptions.authorityMetadata) {
      try {
        return JSON.parse(this.authorityOptions.authorityMetadata);
      } catch (e) {
        throw createClientConfigurationError(invalidAuthorityMetadata);
      }
    }
    return null;
  }
  /**
   * Gets OAuth endpoints from the given OpenID configuration endpoint.
   *
   * @param hasHardcodedMetadata boolean
   */
  async getEndpointMetadataFromNetwork() {
    const options = {};
    const openIdConfigurationEndpoint = this.defaultOpenIdConfigurationEndpoint;
    this.logger.verbose("1y65x6", this.correlationId);
    try {
      const response = await this.networkInterface.sendGetRequestAsync(openIdConfigurationEndpoint, options);
      const isValidResponse = isOpenIdConfigResponse(response.body);
      if (isValidResponse) {
        return response.body;
      } else {
        this.logger.verbose("1koyv8", this.correlationId);
        return null;
      }
    } catch (e) {
      this.logger.verbose("0a9wik", this.correlationId);
      return null;
    }
  }
  /**
   * Get OAuth endpoints for common authorities.
   */
  getEndpointMetadataFromHardcodedValues() {
    if (this.hostnameAndPort in EndpointMetadata) {
      return EndpointMetadata[this.hostnameAndPort];
    }
    return null;
  }
  /**
   * Update the retrieved metadata with regional information.
   * User selected Azure region will be used if configured.
   */
  async updateMetadataWithRegionalInformation(metadata) {
    const userConfiguredAzureRegion = this.authorityOptions.azureRegionConfiguration?.azureRegion;
    if (userConfiguredAzureRegion) {
      if (userConfiguredAzureRegion !== AZURE_REGION_AUTO_DISCOVER_FLAG) {
        this.regionDiscoveryMetadata.region_outcome = RegionDiscoveryOutcomes.CONFIGURED_NO_AUTO_DETECTION;
        this.regionDiscoveryMetadata.region_used = userConfiguredAzureRegion;
        return _Authority.replaceWithRegionalInformation(metadata, userConfiguredAzureRegion);
      }
      const autodetectedRegionName = await invokeAsync(this.regionDiscovery.detectRegion.bind(this.regionDiscovery), RegionDiscoveryDetectRegion, this.logger, this.performanceClient, this.correlationId)(this.authorityOptions.azureRegionConfiguration?.environmentRegion, this.regionDiscoveryMetadata);
      if (autodetectedRegionName) {
        this.regionDiscoveryMetadata.region_outcome = RegionDiscoveryOutcomes.AUTO_DETECTION_REQUESTED_SUCCESSFUL;
        this.regionDiscoveryMetadata.region_used = autodetectedRegionName;
        return _Authority.replaceWithRegionalInformation(metadata, autodetectedRegionName);
      }
      this.regionDiscoveryMetadata.region_outcome = RegionDiscoveryOutcomes.AUTO_DETECTION_REQUESTED_FAILED;
    }
    return metadata;
  }
  /**
   * Updates the AuthorityMetadataEntity with new aliases, preferred_network and preferred_cache
   * and returns where the information was retrieved from
   * @param metadataEntity
   * @returns AuthorityMetadataSource
   */
  async updateCloudDiscoveryMetadata(metadataEntity) {
    const localMetadataSource = this.updateCloudDiscoveryMetadataFromLocalSources(metadataEntity);
    if (localMetadataSource) {
      return localMetadataSource;
    }
    const metadata = await invokeAsync(this.getCloudDiscoveryMetadataFromNetwork.bind(this), AuthorityGetCloudDiscoveryMetadataFromNetwork, this.logger, this.performanceClient, this.correlationId)();
    if (metadata) {
      updateCloudDiscoveryMetadata(metadataEntity, metadata, true);
      return AuthorityMetadataSource.NETWORK;
    }
    throw createClientConfigurationError(untrustedAuthority);
  }
  updateCloudDiscoveryMetadataFromLocalSources(metadataEntity) {
    this.logger.verbose("1tpqlr", this.correlationId);
    this.logger.verbosePii("1fy7uz", this.correlationId);
    this.logger.verbosePii("08zabj", this.correlationId);
    this.logger.verbosePii("1o1kv3", this.correlationId);
    const metadata = this.getCloudDiscoveryMetadataFromConfig();
    if (metadata) {
      this.logger.verbose("1nakio", this.correlationId);
      updateCloudDiscoveryMetadata(metadataEntity, metadata, false);
      return AuthorityMetadataSource.CONFIG;
    }
    this.logger.verbose("1x74aj", this.correlationId);
    const hardcodedMetadata = getCloudDiscoveryMetadataFromHardcodedValues(this.hostnameAndPort);
    if (hardcodedMetadata) {
      this.logger.verbose("0by47c", this.correlationId);
      updateCloudDiscoveryMetadata(metadataEntity, hardcodedMetadata, false);
      return AuthorityMetadataSource.HARDCODED_VALUES;
    }
    this.logger.verbose("0r2fzy", this.correlationId);
    const metadataEntityExpired = isAuthorityMetadataExpired(metadataEntity);
    if (this.isAuthoritySameType(metadataEntity) && metadataEntity.aliasesFromNetwork && !metadataEntityExpired) {
      this.logger.verbose("1uffgh", "");
      return AuthorityMetadataSource.CACHE;
    } else if (metadataEntityExpired) {
      this.logger.verbose("0uoibc", "");
    }
    return null;
  }
  /**
   * Parse cloudDiscoveryMetadata config or check knownAuthorities
   */
  getCloudDiscoveryMetadataFromConfig() {
    if (this.authorityType === AuthorityType.Ciam) {
      this.logger.verbose("04y84h", this.correlationId);
      return _Authority.createCloudDiscoveryMetadataFromHost(this.hostnameAndPort);
    }
    if (this.authorityOptions.cloudDiscoveryMetadata) {
      this.logger.verbose("0gszr3", this.correlationId);
      try {
        this.logger.verbose("1iifkx", this.correlationId);
        const parsedResponse = JSON.parse(this.authorityOptions.cloudDiscoveryMetadata);
        const metadata = getCloudDiscoveryMetadataFromNetworkResponse(parsedResponse.metadata, this.hostnameAndPort);
        this.logger.verbose("0q67e3", "");
        if (metadata) {
          this.logger.verbose("0hzfao", this.correlationId);
          return metadata;
        } else {
          this.logger.verbose("1ajz3u", this.correlationId);
        }
      } catch (e) {
        this.logger.verbose("1wq5tu", this.correlationId);
        throw createClientConfigurationError(invalidCloudDiscoveryMetadata);
      }
    }
    if (this.isInKnownAuthorities()) {
      this.logger.verbose("0mt9al", this.correlationId);
      return _Authority.createCloudDiscoveryMetadataFromHost(this.hostnameAndPort);
    }
    return null;
  }
  /**
   * Called to get metadata from network if CloudDiscoveryMetadata was not populated by config
   *
   * @param hasHardcodedMetadata boolean
   */
  async getCloudDiscoveryMetadataFromNetwork() {
    const instanceDiscoveryEndpoint = `${AAD_INSTANCE_DISCOVERY_ENDPT}${this.canonicalAuthority}oauth2/v2.0/authorize`;
    const options = {};
    let match = null;
    try {
      const response = await this.networkInterface.sendGetRequestAsync(instanceDiscoveryEndpoint, options);
      let typedResponseBody;
      let metadata;
      if (isCloudInstanceDiscoveryResponse(response.body)) {
        typedResponseBody = response.body;
        metadata = typedResponseBody.metadata;
        this.logger.verbosePii("1vglyt", this.correlationId);
      } else if (isCloudInstanceDiscoveryErrorResponse(response.body)) {
        this.logger.warning("062uto", this.correlationId);
        typedResponseBody = response.body;
        if (typedResponseBody.error === INVALID_INSTANCE) {
          this.logger.error("1x90tm", this.correlationId);
          return null;
        }
        this.logger.warning("0wchdm", this.correlationId);
        this.logger.warning("1s5mpv", this.correlationId);
        this.logger.warning("1yhqpw", this.correlationId);
        metadata = [];
      } else {
        this.logger.error("0768g0", this.correlationId);
        return null;
      }
      this.logger.verbose("1lrobr", this.correlationId);
      match = getCloudDiscoveryMetadataFromNetworkResponse(metadata, this.hostnameAndPort);
    } catch (error) {
      if (error instanceof AuthError) {
        this.logger.error("0vwhc7", this.correlationId);
      } else {
        this.logger.error("0s2z41", this.correlationId);
      }
      return null;
    }
    if (!match) {
      this.logger.warning("0jp28q", this.correlationId);
      this.logger.verbose("130sd8", this.correlationId);
      match = _Authority.createCloudDiscoveryMetadataFromHost(this.hostnameAndPort);
    }
    return match;
  }
  /**
   * Helper function to determine if this host is included in the knownAuthorities config option
   */
  isInKnownAuthorities() {
    const matches = this.authorityOptions.knownAuthorities.filter((authority) => {
      return authority && UrlString.getDomainFromUrl(authority).toLowerCase() === this.hostnameAndPort;
    });
    return matches.length > 0;
  }
  /**
   * helper function to populate the authority based on azureCloudOptions
   * @param authorityString
   * @param azureCloudOptions
   */
  static generateAuthority(authorityString, azureCloudOptions) {
    let authorityAzureCloudInstance;
    if (azureCloudOptions && azureCloudOptions.azureCloudInstance !== AzureCloudInstance.None) {
      const tenant = azureCloudOptions.tenant ? azureCloudOptions.tenant : DEFAULT_COMMON_TENANT;
      authorityAzureCloudInstance = `${azureCloudOptions.azureCloudInstance}/${tenant}/`;
    }
    return authorityAzureCloudInstance ? authorityAzureCloudInstance : authorityString;
  }
  /**
   * Creates cloud discovery metadata object from a given host
   * @param host
   */
  static createCloudDiscoveryMetadataFromHost(host) {
    return {
      preferred_network: host,
      preferred_cache: host,
      aliases: [host]
    };
  }
  /**
   * helper function to generate environment from authority object
   */
  getPreferredCache() {
    if (this.managedIdentity) {
      return DEFAULT_AUTHORITY_HOST;
    } else if (this.discoveryComplete()) {
      return this.metadata.preferred_cache;
    } else {
      throw createClientAuthError(endpointResolutionError);
    }
  }
  /**
   * Returns whether or not the provided host is an alias of this authority instance
   * @param host
   */
  isAlias(host) {
    return this.metadata.aliases.indexOf(host) > -1;
  }
  /**
   * Returns whether or not the provided host is an alias of a known Microsoft authority for purposes of endpoint discovery
   * @param host
   */
  isAliasOfKnownMicrosoftAuthority(host) {
    return InstanceDiscoveryMetadataAliases.has(host);
  }
  /**
   * Validates the `issuer` returned by an OIDC discovery document against
   * this authority, per
   * https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationValidation
   *
   * The issuer is accepted when ANY of the following holds:
   *  1. The issuer scheme + host + port match the authority's (path may
   *     differ). Applies to all authorities.
   *  2. The authority is a Microsoft cloud authority (public, sovereign,
   *     or CIAM), the issuer is HTTPS, and the issuer host is in the known
   *     Microsoft authority host set.
   *  3. Same as (2), but the issuer host is a single-label regional variant
   *     of a known Microsoft host (e.g. `westus.login.microsoftonline.com`).
   *  4. Same as (2), but the issuer host matches the CIAM tenant pattern
   *     `{tenant}.ciamlogin.com` with an optional `/{tenant}[.onmicrosoft.com][/v2.0]`
   *     path.
   *
   * @param issuer The `issuer` value returned in the OIDC discovery document.
   * @throws ClientConfigurationError("issuer_validation_failed") on failure.
   */
  validateIssuer(issuer) {
    if (!issuer) {
      throw createClientConfigurationError(issuerValidationFailed);
    }
    let issuerUrl;
    try {
      issuerUrl = new URL(issuer);
    } catch {
      throw createClientConfigurationError(issuerValidationFailed);
    }
    const issuerScheme = issuerUrl.protocol;
    const issuerHost = issuerUrl.host;
    const authorityScheme = (this.canonicalAuthorityUrlComponents.Protocol || "").toLowerCase();
    const authorityHost = (this.canonicalAuthorityUrlComponents.HostNameAndPort || "").toLowerCase();
    const matchesAuthorityOrigin = this.matchesAuthorityOrigin(issuerScheme, issuerHost, authorityScheme, authorityHost);
    const matchesKnownMicrosoftHost = issuerScheme === "https:" && this.isAliasOfKnownMicrosoftAuthority(issuerHost);
    const matchesRegionalMicrosoftHost = issuerScheme === "https:" && this.matchesRegionalMicrosoftHost(issuerHost);
    const matchesCiamTenantPattern = this.matchesCiamTenantPattern(issuerUrl, authorityHost, this.canonicalAuthorityUrlComponents.PathSegments);
    if (matchesAuthorityOrigin || matchesKnownMicrosoftHost || matchesRegionalMicrosoftHost || matchesCiamTenantPattern) {
      return;
    }
    throw createClientConfigurationError(issuerValidationFailed);
  }
  /**
   * Rule 1: The issuer scheme + host (and port) match the authority's. Path
   * may differ. Applies to all authorities.
   */
  matchesAuthorityOrigin(issuerScheme, issuerHost, authorityScheme, authorityHost) {
    return issuerScheme === authorityScheme && issuerHost === authorityHost;
  }
  /**
   * Rule 3: The issuer host is a regional variant
   * (`{region}.{host}`) of a known Microsoft authority host.
   * E.g. `westus2.login.microsoft.com`.
   */
  matchesRegionalMicrosoftHost(issuerHost) {
    const firstDot = issuerHost.indexOf(".");
    if (firstDot > 0 && firstDot < issuerHost.length - 1) {
      const hostWithoutRegion = issuerHost.substring(firstDot + 1);
      return this.isAliasOfKnownMicrosoftAuthority(hostWithoutRegion);
    }
    return false;
  }
  /**
   * Rule 4: The issuer matches one of the well-known CIAM tenant patterns
   * (`https://{tenant}.ciamlogin.com[/{tenant}[.onmicrosoft.com][/v2.0]]`).
   *
   * The bare tenant name is extracted from the authority's first path segment
   * when available (stripping the `.onmicrosoft.com` suffix that
   * `transformCIAMAuthority` adds), or otherwise from the leftmost label of
   * the authority host (to support CIAM custom domain scenarios).
   *
   * Both `/{tenant}` and `/{tenant}.onmicrosoft.com` path forms are accepted
   * because the OIDC issuer may use either form depending on the authority URL
   * that was used to trigger discovery.
   */
  matchesCiamTenantPattern(issuerUrl, authorityHost, authorityPathSegments) {
    const pathSegment = authorityPathSegments[0];
    const tenantName = pathSegment ? pathSegment.endsWith(AAD_TENANT_DOMAIN_SUFFIX) ? pathSegment.slice(0, -AAD_TENANT_DOMAIN_SUFFIX.length) : pathSegment : authorityHost.split(".")[0];
    if (!tenantName) {
      return false;
    }
    const ciamBaseURL = `https://${tenantName}${CIAM_AUTH_URL}`;
    const validCiamPatterns = [
      ciamBaseURL,
      `${ciamBaseURL}/${tenantName}`,
      `${ciamBaseURL}/${tenantName}/v2.0`,
      `${ciamBaseURL}/${tenantName}${AAD_TENANT_DOMAIN_SUFFIX}`,
      `${ciamBaseURL}/${tenantName}${AAD_TENANT_DOMAIN_SUFFIX}/v2.0`
      // https://{tenant}.ciamlogin.com/{tenant}.onmicrosoft.com/v2.0
    ];
    const issuerPath = issuerUrl.pathname.replace(/\/+$/, "");
    const normalizedIssuer = `${issuerUrl.protocol}//${issuerUrl.host}${issuerPath}`;
    return validCiamPatterns.some((pattern) => pattern === normalizedIssuer);
  }
  /**
   * Checks whether the provided host is that of a public cloud authority
   *
   * @param authority string
   * @returns bool
   */
  static isPublicCloudAuthority(host) {
    return KNOWN_PUBLIC_CLOUDS.indexOf(host) >= 0;
  }
  /**
   * Rebuild the authority string with the region
   *
   * @param host string
   * @param region string
   */
  static buildRegionalAuthorityString(host, region, queryString) {
    const authorityUrlInstance = new UrlString(host);
    authorityUrlInstance.validateAsUri();
    const authorityUrlParts = authorityUrlInstance.getUrlComponents();
    let hostNameAndPort = `${region}.${authorityUrlParts.HostNameAndPort}`;
    if (this.isPublicCloudAuthority(authorityUrlParts.HostNameAndPort)) {
      hostNameAndPort = `${region}.${REGIONAL_AUTH_PUBLIC_CLOUD_SUFFIX}`;
    }
    const url = UrlString.constructAuthorityUriFromObject(__spreadProps(__spreadValues({}, authorityUrlInstance.getUrlComponents()), {
      HostNameAndPort: hostNameAndPort
    })).urlString;
    if (queryString)
      return `${url}?${queryString}`;
    return url;
  }
  /**
   * Replace the endpoints in the metadata object with their regional equivalents.
   *
   * @param metadata OpenIdConfigResponse
   * @param azureRegion string
   */
  static replaceWithRegionalInformation(metadata, azureRegion) {
    const regionalMetadata = __spreadValues({}, metadata);
    regionalMetadata.authorization_endpoint = _Authority.buildRegionalAuthorityString(regionalMetadata.authorization_endpoint, azureRegion);
    regionalMetadata.token_endpoint = _Authority.buildRegionalAuthorityString(regionalMetadata.token_endpoint, azureRegion);
    if (regionalMetadata.end_session_endpoint) {
      regionalMetadata.end_session_endpoint = _Authority.buildRegionalAuthorityString(regionalMetadata.end_session_endpoint, azureRegion);
    }
    return regionalMetadata;
  }
  /**
   * Transform CIAM_AUTHORIY as per the below rules:
   * If no path segments found and it is a CIAM authority (hostname ends with .ciamlogin.com), then transform it
   *
   * NOTE: The transformation path should go away once STS supports CIAM with the format: `tenantIdorDomain.ciamlogin.com`
   * `ciamlogin.com` can also change in the future and we should accommodate the same
   *
   * @param authority
   */
  static transformCIAMAuthority(authority) {
    let ciamAuthority = authority;
    const authorityUrl = new UrlString(authority);
    const authorityUrlComponents = authorityUrl.getUrlComponents();
    if (authorityUrlComponents.PathSegments.length === 0 && authorityUrlComponents.HostNameAndPort.endsWith(CIAM_AUTH_URL)) {
      const tenantIdOrDomain = authorityUrlComponents.HostNameAndPort.split(".")[0];
      ciamAuthority = `${ciamAuthority}${tenantIdOrDomain}${AAD_TENANT_DOMAIN_SUFFIX}`;
    }
    return ciamAuthority;
  }
};
Authority.reservedTenantDomains = /* @__PURE__ */ new Set([
  "{tenant}",
  "{tenantid}",
  AADAuthority.COMMON,
  AADAuthority.CONSUMERS,
  AADAuthority.ORGANIZATIONS
]);
function getTenantFromAuthorityString(authority) {
  const authorityUrl = new UrlString(authority);
  const authorityUrlComponents = authorityUrl.getUrlComponents();
  const tenantId = authorityUrlComponents.PathSegments.slice(-1)[0]?.toLowerCase();
  switch (tenantId) {
    case AADAuthority.COMMON:
    case AADAuthority.ORGANIZATIONS:
    case AADAuthority.CONSUMERS:
      return void 0;
    default:
      return tenantId;
  }
}
function formatAuthorityUri(authorityUri) {
  return authorityUri.endsWith(FORWARD_SLASH) ? authorityUri : `${authorityUri}${FORWARD_SLASH}`;
}
function buildStaticAuthorityOptions(authOptions) {
  const rawCloudDiscoveryMetadata = authOptions.cloudDiscoveryMetadata;
  let cloudDiscoveryMetadata = void 0;
  if (rawCloudDiscoveryMetadata) {
    try {
      cloudDiscoveryMetadata = JSON.parse(rawCloudDiscoveryMetadata);
    } catch (e) {
      throw createClientConfigurationError(invalidCloudDiscoveryMetadata);
    }
  }
  return {
    canonicalAuthority: authOptions.authority ? formatAuthorityUri(authOptions.authority) : void 0,
    knownAuthorities: authOptions.knownAuthorities,
    cloudDiscoveryMetadata
  };
}

// ../../node_modules/@azure/msal-common/dist-browser/authority/AuthorityFactory.mjs
async function createDiscoveredInstance(authorityUri, networkClient, cacheManager, authorityOptions, logger, correlationId, performanceClient) {
  const authorityUriFinal = Authority.transformCIAMAuthority(formatAuthorityUri(authorityUri));
  const acquireTokenAuthority = new Authority(authorityUriFinal, networkClient, cacheManager, authorityOptions, logger, correlationId, performanceClient);
  try {
    await invokeAsync(acquireTokenAuthority.resolveEndpointsAsync.bind(acquireTokenAuthority), AuthorityResolveEndpointsAsync, logger, performanceClient, correlationId)();
    return acquireTokenAuthority;
  } catch (e) {
    throw createClientAuthError(endpointResolutionError);
  }
}

// ../../node_modules/@azure/msal-common/dist-browser/client/AuthorizationCodeClient.mjs
var AuthorizationCodeClient = class {
  constructor(configuration, performanceClient) {
    this.includeRedirectUri = true;
    this.config = buildClientConfiguration(configuration);
    this.logger = new Logger(this.config.loggerOptions, name, version);
    this.cryptoUtils = this.config.cryptoInterface;
    this.cacheManager = this.config.storageInterface;
    this.networkClient = this.config.networkInterface;
    this.serverTelemetryManager = this.config.serverTelemetryManager;
    this.authority = this.config.authOptions.authority;
    this.performanceClient = performanceClient;
    this.oidcDefaultScopes = this.config.authOptions.authority.options.OIDCOptions?.defaultScopes;
  }
  /**
   * API to acquire a token in exchange of 'authorization_code` acquired by the user in the first leg of the
   * authorization_code_grant
   * @param request
   */
  async acquireToken(request, apiId, authCodePayload) {
    if (!request.code) {
      throw createClientAuthError(requestCannotBeMade);
    }
    if (authCodePayload && authCodePayload.cloud_instance_host_name) {
      await invokeAsync(this.updateTokenEndpointAuthority.bind(this), UpdateTokenEndpointAuthority, this.logger, this.performanceClient, request.correlationId)(authCodePayload.cloud_instance_host_name, request.correlationId);
    }
    const reqTimestamp = nowSeconds();
    const response = await invokeAsync(this.executeTokenRequest.bind(this), AuthClientExecuteTokenRequest, this.logger, this.performanceClient, request.correlationId)(this.authority, request, this.serverTelemetryManager);
    const requestId = response.headers?.[HeaderNames.X_MS_REQUEST_ID];
    const responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, this.performanceClient, this.config.serializableCache, this.config.persistencePlugin);
    responseHandler.validateTokenResponse(response.body, request.correlationId);
    return invokeAsync(responseHandler.handleServerTokenResponse.bind(responseHandler), HandleServerTokenResponse, this.logger, this.performanceClient, request.correlationId)(response.body, this.authority, reqTimestamp, request, apiId, authCodePayload, void 0, void 0, void 0, requestId);
  }
  /**
   * Used to log out the current user, and redirect the user to the postLogoutRedirectUri.
   * Default behaviour is to redirect the user to `window.location.href`.
   * @param authorityUri
   */
  getLogoutUri(logoutRequest) {
    if (!logoutRequest) {
      throw createClientConfigurationError(logoutRequestEmpty);
    }
    const queryString = this.createLogoutUrlQueryString(logoutRequest);
    return UrlString.appendQueryString(this.authority.endSessionEndpoint, queryString);
  }
  /**
   * Executes POST request to token endpoint
   * @param authority
   * @param request
   */
  async executeTokenRequest(authority, request, serverTelemetryManager) {
    const queryParametersString = createTokenQueryParameters(request, this.config.authOptions.clientId, this.config.authOptions.redirectUri, this.performanceClient);
    const endpoint = UrlString.appendQueryString(authority.tokenEndpoint, queryParametersString);
    const requestBody = await invokeAsync(this.createTokenRequestBody.bind(this), AuthClientCreateTokenRequestBody, this.logger, this.performanceClient, request.correlationId)(request);
    let ccsCredential = void 0;
    if (request.clientInfo) {
      try {
        const clientInfo = buildClientInfo(request.clientInfo, this.cryptoUtils.base64Decode);
        ccsCredential = {
          credential: `${clientInfo.uid}${CLIENT_INFO_SEPARATOR}${clientInfo.utid}`,
          type: CcsCredentialType.HOME_ACCOUNT_ID
        };
      } catch (e) {
        this.logger.verbose("0wznt3", request.correlationId);
      }
    }
    const headers = createTokenRequestHeaders(this.logger, this.config.systemOptions.preventCorsPreflight, ccsCredential || request.ccsCredential);
    const thumbprint = getRequestThumbprint(this.config.authOptions.clientId, request);
    return invokeAsync(executePostToTokenEndpoint, AuthorizationCodeClientExecutePostToTokenEndpoint, this.logger, this.performanceClient, request.correlationId)(endpoint, requestBody, headers, thumbprint, request.correlationId, this.cacheManager, this.networkClient, this.logger, this.performanceClient, serverTelemetryManager);
  }
  /**
   * Generates a map for all the params to be sent to the service
   * @param request
   */
  async createTokenRequestBody(request) {
    const parameters = /* @__PURE__ */ new Map();
    addClientId(parameters, request.embeddedClientId || request.extraParameters?.[CLIENT_ID] || this.config.authOptions.clientId);
    if (!this.includeRedirectUri) {
      if (!request.redirectUri) {
        throw createClientConfigurationError(redirectUriEmpty);
      }
    } else {
      addRedirectUri(parameters, request.redirectUri);
    }
    addScopes(parameters, request.scopes, true, this.oidcDefaultScopes);
    addResource(parameters, request.resource);
    addAuthorizationCode(parameters, request.code);
    addLibraryInfo(parameters, this.config.libraryInfo);
    addApplicationTelemetry(parameters, this.config.telemetry.application);
    addThrottling(parameters);
    if (this.serverTelemetryManager && !isOidcProtocolMode(this.config)) {
      addServerTelemetry(parameters, this.serverTelemetryManager);
    }
    if (request.codeVerifier) {
      addCodeVerifier(parameters, request.codeVerifier);
    }
    if (this.config.clientCredentials.clientSecret) {
      addClientSecret(parameters, this.config.clientCredentials.clientSecret);
    }
    if (this.config.clientCredentials.clientAssertion) {
      const clientAssertion = this.config.clientCredentials.clientAssertion;
      addClientAssertion(parameters, await getClientAssertion(clientAssertion.assertion, this.config.authOptions.clientId, request.resourceRequestUri));
      addClientAssertionType(parameters, clientAssertion.assertionType);
    }
    addGrantType(parameters, GrantType.AUTHORIZATION_CODE_GRANT);
    addClientInfo(parameters);
    if (request.authenticationScheme === AuthenticationScheme.POP) {
      const popTokenGenerator = new PopTokenGenerator(this.cryptoUtils, this.performanceClient);
      let reqCnfData;
      if (!request.popKid) {
        const generatedReqCnfData = await invokeAsync(popTokenGenerator.generateCnf.bind(popTokenGenerator), PopTokenGenerateCnf, this.logger, this.performanceClient, request.correlationId)(request, this.logger);
        reqCnfData = generatedReqCnfData.reqCnfString;
      } else {
        reqCnfData = this.cryptoUtils.encodeKid(request.popKid);
      }
      addPopToken(parameters, reqCnfData);
    } else if (request.authenticationScheme === AuthenticationScheme.SSH) {
      if (request.sshJwk) {
        addSshJwk(parameters, request.sshJwk);
      } else {
        throw createClientConfigurationError(missingSshJwk);
      }
    }
    let ccsCred = void 0;
    if (request.clientInfo) {
      try {
        const clientInfo = buildClientInfo(request.clientInfo, this.cryptoUtils.base64Decode);
        ccsCred = {
          credential: `${clientInfo.uid}${CLIENT_INFO_SEPARATOR}${clientInfo.utid}`,
          type: CcsCredentialType.HOME_ACCOUNT_ID
        };
      } catch (e) {
        this.logger.verbose("0wznt3", request.correlationId);
      }
    } else {
      ccsCred = request.ccsCredential;
    }
    if (this.config.systemOptions.preventCorsPreflight && ccsCred) {
      switch (ccsCred.type) {
        case CcsCredentialType.HOME_ACCOUNT_ID:
          try {
            const clientInfo = buildClientInfoFromHomeAccountId(ccsCred.credential);
            addCcsOid(parameters, clientInfo);
          } catch (e) {
            this.logger.verbose("1qhtee", request.correlationId);
          }
          break;
        case CcsCredentialType.UPN:
          addCcsUpn(parameters, ccsCred.credential);
          break;
      }
    }
    if (request.embeddedClientId) {
      addBrokerParameters(parameters, this.config.authOptions.clientId, this.config.authOptions.redirectUri);
    }
    if (request.extraParameters) {
      addExtraParameters(parameters, request.extraParameters);
    }
    if (request.enableSpaAuthorizationCode && (!request.extraParameters || !request.extraParameters[RETURN_SPA_CODE])) {
      addExtraParameters(parameters, {
        [RETURN_SPA_CODE]: "1"
      });
    }
    instrumentBrokerParams(parameters, request.correlationId, this.performanceClient);
    addClaims(parameters, request.claims, this.config.authOptions.clientCapabilities, request.skipBrokerClaims);
    return mapToQueryString(parameters);
  }
  /**
   * This API validates the `EndSessionRequest` and creates a URL
   * @param request
   */
  createLogoutUrlQueryString(request) {
    const parameters = /* @__PURE__ */ new Map();
    if (request.postLogoutRedirectUri) {
      addPostLogoutRedirectUri(parameters, request.postLogoutRedirectUri);
    }
    if (request.correlationId) {
      addCorrelationId(parameters, request.correlationId);
    }
    if (request.idTokenHint) {
      addIdTokenHint(parameters, request.idTokenHint);
    }
    if (request.state) {
      addState(parameters, request.state);
    }
    if (request.logoutHint) {
      addLogoutHint(parameters, request.logoutHint);
    }
    if (request.extraQueryParameters) {
      addExtraParameters(parameters, request.extraQueryParameters);
    }
    if (this.config.authOptions.instanceAware) {
      addInstanceAware(parameters);
    }
    return mapToQueryString(parameters);
  }
  /**
   * Updates the authority to the cloud instance provided in the authorization response
   * @param cloudInstanceHostName - cloud instance host name from authorization code payload
   * @param correlationId - request correlation id
   */
  async updateTokenEndpointAuthority(cloudInstanceHostName, correlationId) {
    const cloudInstanceAuthorityUri = `https://${cloudInstanceHostName}/${this.authority.tenant}/`;
    const cloudInstanceAuthority = await createDiscoveredInstance(cloudInstanceAuthorityUri, this.networkClient, this.cacheManager, this.authority.options, this.logger, correlationId, this.performanceClient);
    this.authority = cloudInstanceAuthority;
  }
};

// ../../node_modules/@azure/msal-common/dist-browser/client/RefreshTokenClient.mjs
var DEFAULT_REFRESH_TOKEN_EXPIRATION_OFFSET_SECONDS = 300;
var RefreshTokenClient = class {
  constructor(configuration, performanceClient) {
    this.config = buildClientConfiguration(configuration);
    this.logger = new Logger(this.config.loggerOptions, name, version);
    this.cryptoUtils = this.config.cryptoInterface;
    this.cacheManager = this.config.storageInterface;
    this.networkClient = this.config.networkInterface;
    this.serverTelemetryManager = this.config.serverTelemetryManager;
    this.authority = this.config.authOptions.authority;
    this.performanceClient = performanceClient;
  }
  async acquireToken(request, apiId) {
    const reqTimestamp = nowSeconds();
    const response = await invokeAsync(this.executeTokenRequest.bind(this), RefreshTokenClientExecuteTokenRequest, this.logger, this.performanceClient, request.correlationId)(request, this.authority);
    const requestId = response.headers?.[HeaderNames.X_MS_REQUEST_ID];
    const responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, this.performanceClient, this.config.serializableCache, this.config.persistencePlugin);
    responseHandler.validateTokenResponse(response.body, request.correlationId);
    return invokeAsync(responseHandler.handleServerTokenResponse.bind(responseHandler), HandleServerTokenResponse, this.logger, this.performanceClient, request.correlationId)(response.body, this.authority, reqTimestamp, request, apiId, void 0, void 0, true, request.forceCache, requestId);
  }
  /**
   * Gets cached refresh token and attaches to request, then calls acquireToken API
   * @param request
   */
  async acquireTokenByRefreshToken(request, apiId) {
    if (!request) {
      throw createClientConfigurationError(tokenRequestEmpty);
    }
    if (!request.account) {
      throw createClientAuthError(noAccountInSilentRequest);
    }
    const isFOCI = this.cacheManager.isAppMetadataFOCI(request.account.environment, request.correlationId);
    if (isFOCI) {
      try {
        return await invokeAsync(this.acquireTokenWithCachedRefreshToken.bind(this), RefreshTokenClientAcquireTokenWithCachedRefreshToken, this.logger, this.performanceClient, request.correlationId)(request, true, apiId);
      } catch (e) {
        const noFamilyRTInCache = e instanceof InteractionRequiredAuthError && e.errorCode === noTokensFound;
        const clientMismatchErrorWithFamilyRT = e instanceof ServerError && e.errorCode === INVALID_GRANT_ERROR && e.subError === CLIENT_MISMATCH_ERROR;
        if (noFamilyRTInCache || clientMismatchErrorWithFamilyRT) {
          return invokeAsync(this.acquireTokenWithCachedRefreshToken.bind(this), RefreshTokenClientAcquireTokenWithCachedRefreshToken, this.logger, this.performanceClient, request.correlationId)(request, false, apiId);
        } else {
          throw e;
        }
      }
    }
    return invokeAsync(this.acquireTokenWithCachedRefreshToken.bind(this), RefreshTokenClientAcquireTokenWithCachedRefreshToken, this.logger, this.performanceClient, request.correlationId)(request, false, apiId);
  }
  /**
   * makes a network call to acquire tokens by exchanging RefreshToken available in userCache; throws if refresh token is not cached
   * @param request
   */
  async acquireTokenWithCachedRefreshToken(request, foci, apiId) {
    const refreshToken = invoke(this.cacheManager.getRefreshToken.bind(this.cacheManager), CacheManagerGetRefreshToken, this.logger, this.performanceClient, request.correlationId)(request.account, foci, request.correlationId, void 0);
    if (!refreshToken) {
      throw createInteractionRequiredAuthError(noTokensFound);
    }
    if (refreshToken.expiresOn) {
      const offset = request.refreshTokenExpirationOffsetSeconds || DEFAULT_REFRESH_TOKEN_EXPIRATION_OFFSET_SECONDS;
      this.performanceClient?.addFields({
        cacheRtExpiresOnSeconds: Number(refreshToken.expiresOn),
        rtOffsetSeconds: offset
      }, request.correlationId);
      if (isTokenExpired(refreshToken.expiresOn, offset)) {
        throw createInteractionRequiredAuthError(refreshTokenExpired);
      }
    }
    const refreshTokenRequest = __spreadProps(__spreadValues({}, request), {
      refreshToken: refreshToken.secret,
      authenticationScheme: request.authenticationScheme || AuthenticationScheme.BEARER,
      ccsCredential: {
        credential: request.account.homeAccountId,
        type: CcsCredentialType.HOME_ACCOUNT_ID
      }
    });
    try {
      return await invokeAsync(this.acquireToken.bind(this), RefreshTokenClientAcquireToken, this.logger, this.performanceClient, request.correlationId)(refreshTokenRequest, apiId);
    } catch (e) {
      if (e instanceof InteractionRequiredAuthError) {
        if (e.subError === badToken) {
          this.logger.verbose("1pg3ap", request.correlationId);
          const badRefreshTokenKey = this.cacheManager.generateCredentialKey(refreshToken);
          this.cacheManager.removeRefreshToken(badRefreshTokenKey, request.correlationId);
        }
      }
      throw e;
    }
  }
  /**
   * Constructs the network message and makes a NW call to the underlying secure token service
   * @param request
   * @param authority
   */
  async executeTokenRequest(request, authority) {
    const queryParametersString = createTokenQueryParameters(request, this.config.authOptions.clientId, this.config.authOptions.redirectUri, this.performanceClient);
    const endpoint = UrlString.appendQueryString(authority.tokenEndpoint, queryParametersString);
    const requestBody = await invokeAsync(this.createTokenRequestBody.bind(this), RefreshTokenClientCreateTokenRequestBody, this.logger, this.performanceClient, request.correlationId)(request);
    const headers = createTokenRequestHeaders(this.logger, this.config.systemOptions.preventCorsPreflight, request.ccsCredential);
    const thumbprint = getRequestThumbprint(this.config.authOptions.clientId, request);
    return invokeAsync(executePostToTokenEndpoint, RefreshTokenClientExecutePostToTokenEndpoint, this.logger, this.performanceClient, request.correlationId)(endpoint, requestBody, headers, thumbprint, request.correlationId, this.cacheManager, this.networkClient, this.logger, this.performanceClient, this.serverTelemetryManager);
  }
  /**
   * Helper function to create the token request body
   * @param request
   */
  async createTokenRequestBody(request) {
    const parameters = /* @__PURE__ */ new Map();
    addClientId(parameters, request.embeddedClientId || request.extraParameters?.[CLIENT_ID] || this.config.authOptions.clientId);
    if (request.redirectUri) {
      addRedirectUri(parameters, request.redirectUri);
    }
    addScopes(parameters, request.scopes, true, this.config.authOptions.authority.options.OIDCOptions?.defaultScopes);
    addGrantType(parameters, GrantType.REFRESH_TOKEN_GRANT);
    addClientInfo(parameters);
    addLibraryInfo(parameters, this.config.libraryInfo);
    addApplicationTelemetry(parameters, this.config.telemetry.application);
    addThrottling(parameters);
    if (this.serverTelemetryManager && !isOidcProtocolMode(this.config)) {
      addServerTelemetry(parameters, this.serverTelemetryManager);
    }
    addRefreshToken(parameters, request.refreshToken);
    if (this.config.clientCredentials.clientSecret) {
      addClientSecret(parameters, this.config.clientCredentials.clientSecret);
    }
    if (this.config.clientCredentials.clientAssertion) {
      const clientAssertion = this.config.clientCredentials.clientAssertion;
      addClientAssertion(parameters, await getClientAssertion(clientAssertion.assertion, this.config.authOptions.clientId, request.resourceRequestUri));
      addClientAssertionType(parameters, clientAssertion.assertionType);
    }
    if (request.authenticationScheme === AuthenticationScheme.POP) {
      const popTokenGenerator = new PopTokenGenerator(this.cryptoUtils, this.performanceClient);
      let reqCnfData;
      if (!request.popKid) {
        const generatedReqCnfData = await invokeAsync(popTokenGenerator.generateCnf.bind(popTokenGenerator), PopTokenGenerateCnf, this.logger, this.performanceClient, request.correlationId)(request, this.logger);
        reqCnfData = generatedReqCnfData.reqCnfString;
      } else {
        reqCnfData = this.cryptoUtils.encodeKid(request.popKid);
      }
      addPopToken(parameters, reqCnfData);
    } else if (request.authenticationScheme === AuthenticationScheme.SSH) {
      if (request.sshJwk) {
        addSshJwk(parameters, request.sshJwk);
      } else {
        throw createClientConfigurationError(missingSshJwk);
      }
    }
    if (this.config.systemOptions.preventCorsPreflight && request.ccsCredential) {
      switch (request.ccsCredential.type) {
        case CcsCredentialType.HOME_ACCOUNT_ID:
          try {
            const clientInfo = buildClientInfoFromHomeAccountId(request.ccsCredential.credential);
            addCcsOid(parameters, clientInfo);
          } catch (e) {
            this.logger.verbose("1qhtee", request.correlationId);
          }
          break;
        case CcsCredentialType.UPN:
          addCcsUpn(parameters, request.ccsCredential.credential);
          break;
      }
    }
    if (request.embeddedClientId) {
      addBrokerParameters(parameters, this.config.authOptions.clientId, this.config.authOptions.redirectUri);
    }
    if (request.extraParameters) {
      addExtraParameters(parameters, __spreadValues({}, request.extraParameters));
    }
    instrumentBrokerParams(parameters, request.correlationId, this.performanceClient);
    addClaims(parameters, request.claims, this.config.authOptions.clientCapabilities, request.skipBrokerClaims);
    return mapToQueryString(parameters);
  }
};

// ../../node_modules/@azure/msal-common/dist-browser/client/SilentFlowClient.mjs
var SilentFlowClient = class {
  constructor(configuration, performanceClient) {
    this.config = buildClientConfiguration(configuration);
    this.logger = new Logger(this.config.loggerOptions, name, version);
    this.cryptoUtils = this.config.cryptoInterface;
    this.cacheManager = this.config.storageInterface;
    this.networkClient = this.config.networkInterface;
    this.serverTelemetryManager = this.config.serverTelemetryManager;
    this.authority = this.config.authOptions.authority;
    this.performanceClient = performanceClient;
  }
  /**
   * Retrieves token from cache or throws an error if it must be refreshed.
   * @param request
   */
  async acquireCachedToken(request) {
    let lastCacheOutcome = CacheOutcome.NOT_APPLICABLE;
    if (request.forceRefresh || !StringUtils.isEmptyObj(request.claims)) {
      this.setCacheOutcome(CacheOutcome.FORCE_REFRESH_OR_CLAIMS, request.correlationId);
      throw createClientAuthError(tokenRefreshRequired);
    }
    if (!request.account) {
      throw createClientAuthError(noAccountInSilentRequest);
    }
    const requestTenantId = request.account.tenantId || getTenantFromAuthorityString(request.authority);
    const tokenKeys = this.cacheManager.getTokenKeys();
    const cachedAccessToken = this.cacheManager.getAccessToken(request.account, request, tokenKeys, requestTenantId);
    if (!cachedAccessToken) {
      this.setCacheOutcome(CacheOutcome.NO_CACHED_ACCESS_TOKEN, request.correlationId);
      throw createClientAuthError(tokenRefreshRequired);
    } else if (wasClockTurnedBack(cachedAccessToken.cachedAt) || isTokenExpired(cachedAccessToken.expiresOn, this.config.systemOptions.tokenRenewalOffsetSeconds)) {
      this.setCacheOutcome(CacheOutcome.CACHED_ACCESS_TOKEN_EXPIRED, request.correlationId);
      throw createClientAuthError(tokenRefreshRequired);
    } else if (request.resource) {
      if (cachedAccessToken.resource !== request.resource) {
        this.setCacheOutcome(CacheOutcome.NO_CACHED_ACCESS_TOKEN, request.correlationId);
        throw createClientAuthError(tokenRefreshRequired);
      }
    } else if (cachedAccessToken.refreshOn && isTokenExpired(cachedAccessToken.refreshOn, 0)) {
      lastCacheOutcome = CacheOutcome.PROACTIVELY_REFRESHED;
    }
    const environment = request.authority || this.authority.getPreferredCache();
    const cacheRecord = {
      account: this.cacheManager.getAccount(this.cacheManager.generateAccountKey(request.account), request.correlationId),
      accessToken: cachedAccessToken,
      idToken: this.cacheManager.getIdToken(request.account, request.correlationId, tokenKeys, requestTenantId),
      refreshToken: null,
      appMetadata: this.cacheManager.readAppMetadataFromCache(environment, request.correlationId)
    };
    this.setCacheOutcome(lastCacheOutcome, request.correlationId);
    if (this.config.serverTelemetryManager) {
      this.config.serverTelemetryManager.incrementCacheHits();
    }
    return [
      await invokeAsync(this.generateResultFromCacheRecord.bind(this), SilentFlowClientGenerateResultFromCacheRecord, this.logger, this.performanceClient, request.correlationId)(cacheRecord, request),
      lastCacheOutcome
    ];
  }
  setCacheOutcome(cacheOutcome, correlationId) {
    this.serverTelemetryManager?.setCacheOutcome(cacheOutcome);
    this.performanceClient?.addFields({
      cacheOutcome
    }, correlationId);
    if (cacheOutcome !== CacheOutcome.NOT_APPLICABLE) {
      this.logger.info("09ingz", correlationId);
    }
  }
  /**
   * Helper function to build response object from the CacheRecord
   * @param cacheRecord
   */
  async generateResultFromCacheRecord(cacheRecord, request) {
    let idTokenClaims;
    if (cacheRecord.idToken) {
      idTokenClaims = extractTokenClaims(cacheRecord.idToken.secret, this.config.cryptoInterface.base64Decode);
    }
    if (request.maxAge || request.maxAge === 0) {
      const authTime = idTokenClaims?.auth_time;
      if (!authTime) {
        throw createClientAuthError(authTimeNotFound);
      }
      checkMaxAge(authTime, request.maxAge);
    }
    return ResponseHandler.generateAuthenticationResult(this.cryptoUtils, this.authority, cacheRecord, true, request, this.performanceClient, idTokenClaims);
  }
};

// ../../node_modules/@azure/msal-common/dist-browser/network/INetworkModule.mjs
var StubbedNetworkModule = {
  sendGetRequestAsync: () => {
    return Promise.reject(createClientAuthError(methodNotImplemented));
  },
  sendPostRequestAsync: () => {
    return Promise.reject(createClientAuthError(methodNotImplemented));
  }
};

// ../../node_modules/@azure/msal-common/dist-browser/protocol/Authorize.mjs
var Authorize_exports = {};
__export(Authorize_exports, {
  getAuthorizationCodePayload: () => getAuthorizationCodePayload,
  getAuthorizeUrl: () => getAuthorizeUrl,
  getStandardAuthorizeRequestParameters: () => getStandardAuthorizeRequestParameters,
  validateAuthorizationResponse: () => validateAuthorizationResponse
});
function getStandardAuthorizeRequestParameters(authOptions, request, logger, performanceClient) {
  const correlationId = request.correlationId;
  const parameters = /* @__PURE__ */ new Map();
  addClientId(parameters, request.embeddedClientId || request.extraQueryParameters?.[CLIENT_ID] || authOptions.clientId);
  const requestScopes = [
    ...request.scopes || [],
    ...request.extraScopesToConsent || []
  ];
  addScopes(parameters, requestScopes, true, authOptions.authority.options.OIDCOptions?.defaultScopes);
  addResource(parameters, request.resource);
  addRedirectUri(parameters, request.redirectUri);
  addCorrelationId(parameters, correlationId);
  addResponseMode(parameters, request.responseMode);
  addClientInfo(parameters);
  addCliData(parameters);
  if (request.prompt) {
    addPrompt(parameters, request.prompt);
    performanceClient?.addFields({ prompt: request.prompt }, correlationId);
  }
  if (request.domainHint) {
    addDomainHint(parameters, request.domainHint);
    performanceClient?.addFields({ domainHintFromRequest: true }, correlationId);
  }
  if (request.prompt !== PromptValue.SELECT_ACCOUNT) {
    if (request.sid && request.prompt === PromptValue.NONE) {
      logger.verbose("1tvqyx", request.correlationId);
      addSid(parameters, request.sid);
      performanceClient?.addFields({ sidFromRequest: true }, correlationId);
    } else if (request.account) {
      const accountSid = extractAccountSid(request.account);
      let accountLoginHintClaim = extractLoginHint(request.account);
      if (accountLoginHintClaim && request.domainHint) {
        logger.warning("0wkg3v", request.correlationId);
        accountLoginHintClaim = null;
      }
      if (accountLoginHintClaim) {
        logger.verbose("1eyfsw", request.correlationId);
        addLoginHint(parameters, accountLoginHintClaim);
        performanceClient?.addFields({ loginHintFromClaim: true }, correlationId);
        try {
          const clientInfo = buildClientInfoFromHomeAccountId(request.account.homeAccountId);
          addCcsOid(parameters, clientInfo);
        } catch (e) {
          logger.verbose("12ugck", request.correlationId);
        }
      } else if (accountSid && request.prompt === PromptValue.NONE) {
        logger.verbose("1rmd8s", request.correlationId);
        addSid(parameters, accountSid);
        performanceClient?.addFields({ sidFromClaim: true }, correlationId);
        try {
          const clientInfo = buildClientInfoFromHomeAccountId(request.account.homeAccountId);
          addCcsOid(parameters, clientInfo);
        } catch (e) {
          logger.verbose("12ugck", request.correlationId);
        }
      } else if (request.loginHint) {
        logger.verbose("0y3007", request.correlationId);
        addLoginHint(parameters, request.loginHint);
        addCcsUpn(parameters, request.loginHint);
        performanceClient?.addFields({ loginHintFromRequest: true }, correlationId);
      } else if (request.account.username) {
        logger.verbose("02f507", request.correlationId);
        addLoginHint(parameters, request.account.username);
        performanceClient?.addFields({ loginHintFromUpn: true }, correlationId);
        try {
          const clientInfo = buildClientInfoFromHomeAccountId(request.account.homeAccountId);
          addCcsOid(parameters, clientInfo);
        } catch (e) {
          logger.verbose("12ugck", request.correlationId);
        }
      }
    } else if (request.loginHint) {
      logger.verbose("0g01ey", request.correlationId);
      addLoginHint(parameters, request.loginHint);
      addCcsUpn(parameters, request.loginHint);
      performanceClient?.addFields({ loginHintFromRequest: true }, correlationId);
    }
  } else {
    logger.verbose("169k9v", request.correlationId);
  }
  if (request.nonce) {
    addNonce(parameters, request.nonce);
  }
  if (request.state) {
    addState(parameters, request.state);
  }
  if (request.embeddedClientId) {
    addBrokerParameters(parameters, authOptions.clientId, authOptions.redirectUri);
  }
  addClaims(parameters, request.claims, authOptions.clientCapabilities, request.skipBrokerClaims);
  if (authOptions.instanceAware && (!request.extraQueryParameters || !Object.keys(request.extraQueryParameters).includes(INSTANCE_AWARE))) {
    addInstanceAware(parameters);
  }
  return parameters;
}
function getAuthorizeUrl(authority, requestParameters) {
  const queryString = mapToQueryString(requestParameters);
  return UrlString.appendQueryString(authority.authorizationEndpoint, queryString);
}
function getAuthorizationCodePayload(serverParams, cachedState) {
  validateAuthorizationResponse(serverParams, cachedState);
  if (!serverParams.code) {
    throw createClientAuthError(authorizationCodeMissingFromServerResponse);
  }
  return serverParams;
}
function validateAuthorizationResponse(serverResponse, requestState) {
  if (!serverResponse.state || !requestState) {
    throw serverResponse.state ? createClientAuthError(stateNotFound, "Cached State") : createClientAuthError(stateNotFound, "Server State");
  }
  let decodedServerResponseState;
  let decodedRequestState;
  try {
    decodedServerResponseState = decodeURIComponent(serverResponse.state);
  } catch (e) {
    throw createClientAuthError(invalidState, serverResponse.state);
  }
  try {
    decodedRequestState = decodeURIComponent(requestState);
  } catch (e) {
    throw createClientAuthError(invalidState, serverResponse.state);
  }
  if (decodedServerResponseState !== decodedRequestState) {
    throw createClientAuthError(stateMismatch);
  }
  if (serverResponse.error || serverResponse.error_description || serverResponse.suberror) {
    const serverErrorNo = parseServerErrorNo(serverResponse);
    if (isInteractionRequiredError(serverResponse.error, serverResponse.error_description, serverResponse.suberror)) {
      throw new InteractionRequiredAuthError(serverResponse.error || "", serverResponse.error_description, serverResponse.suberror, serverResponse.timestamp || "", serverResponse.trace_id || "", serverResponse.correlation_id || "", serverResponse.claims || "", serverErrorNo);
    }
    throw new ServerError(serverResponse.error || "", serverResponse.error_description, serverResponse.suberror, serverErrorNo);
  }
}
function parseServerErrorNo(serverResponse) {
  const errorCodePrefix = "code=";
  const errorCodePrefixIndex = serverResponse.error_uri?.lastIndexOf(errorCodePrefix);
  return errorCodePrefixIndex && errorCodePrefixIndex >= 0 ? serverResponse.error_uri?.substring(errorCodePrefixIndex + errorCodePrefix.length) : void 0;
}
function extractAccountSid(account) {
  return account.idTokenClaims?.sid || null;
}
function extractLoginHint(account) {
  return account.loginHint || account.idTokenClaims?.login_hint || null;
}

// ../../node_modules/@azure/msal-common/dist-browser/telemetry/server/ServerTelemetryManager.mjs
var skuGroupSeparator = ",";
var skuValueSeparator = "|";
function makeExtraSkuString(params) {
  const { skus, libraryName, libraryVersion, extensionName, extensionVersion } = params;
  const skuMap = /* @__PURE__ */ new Map([
    [0, [libraryName, libraryVersion]],
    [2, [extensionName, extensionVersion]]
  ]);
  let skuArr = [];
  if (skus?.length) {
    skuArr = skus.split(skuGroupSeparator);
    if (skuArr.length < 4) {
      return skus;
    }
  } else {
    skuArr = Array.from({ length: 4 }, () => skuValueSeparator);
  }
  skuMap.forEach((value, key) => {
    if (value.length === 2 && value[0]?.length && value[1]?.length) {
      setSku({
        skuArr,
        index: key,
        skuName: value[0],
        skuVersion: value[1]
      });
    }
  });
  return skuArr.join(skuGroupSeparator);
}
function setSku(params) {
  const { skuArr, index, skuName, skuVersion } = params;
  if (index >= skuArr.length) {
    return;
  }
  skuArr[index] = [skuName, skuVersion].join(skuValueSeparator);
}
var ServerTelemetryManager = class _ServerTelemetryManager {
  constructor(telemetryRequest, cacheManager) {
    this.cacheOutcome = CacheOutcome.NOT_APPLICABLE;
    this.cacheManager = cacheManager;
    this.apiId = telemetryRequest.apiId;
    this.correlationId = telemetryRequest.correlationId;
    this.wrapperSKU = telemetryRequest.wrapperSKU || "";
    this.wrapperVer = telemetryRequest.wrapperVer || "";
    this.telemetryCacheKey = SERVER_TELEM_CACHE_KEY + CACHE_KEY_SEPARATOR + telemetryRequest.clientId;
  }
  /**
   * API to add MSER Telemetry to request
   */
  generateCurrentRequestHeaderValue() {
    const request = `${this.apiId}${SERVER_TELEM_VALUE_SEPARATOR}${this.cacheOutcome}`;
    const platformFieldsArr = [this.wrapperSKU, this.wrapperVer];
    const nativeBrokerErrorCode = this.getNativeBrokerErrorCode();
    if (nativeBrokerErrorCode?.length) {
      platformFieldsArr.push(`broker_error=${nativeBrokerErrorCode}`);
    }
    const platformFields = platformFieldsArr.join(SERVER_TELEM_VALUE_SEPARATOR);
    const regionDiscoveryFields = this.getRegionDiscoveryFields();
    const requestWithRegionDiscoveryFields = [
      request,
      regionDiscoveryFields
    ].join(SERVER_TELEM_VALUE_SEPARATOR);
    return [
      SERVER_TELEM_SCHEMA_VERSION,
      requestWithRegionDiscoveryFields,
      platformFields
    ].join(SERVER_TELEM_CATEGORY_SEPARATOR);
  }
  /**
   * API to add MSER Telemetry for the last failed request
   */
  generateLastRequestHeaderValue() {
    const lastRequests = this.getLastRequests();
    const maxErrors = _ServerTelemetryManager.maxErrorsToSend(lastRequests);
    const failedRequests = lastRequests.failedRequests.slice(0, 2 * maxErrors).join(SERVER_TELEM_VALUE_SEPARATOR);
    const errors = lastRequests.errors.slice(0, maxErrors).join(SERVER_TELEM_VALUE_SEPARATOR);
    const errorCount = lastRequests.errors.length;
    const overflow = maxErrors < errorCount ? SERVER_TELEM_OVERFLOW_TRUE : SERVER_TELEM_OVERFLOW_FALSE;
    const platformFields = [errorCount, overflow].join(SERVER_TELEM_VALUE_SEPARATOR);
    return [
      SERVER_TELEM_SCHEMA_VERSION,
      lastRequests.cacheHits,
      failedRequests,
      errors,
      platformFields
    ].join(SERVER_TELEM_CATEGORY_SEPARATOR);
  }
  /**
   * API to cache token failures for MSER data capture
   * @param error
   */
  cacheFailedRequest(error) {
    const lastRequests = this.getLastRequests();
    if (lastRequests.errors.length >= SERVER_TELEM_MAX_CACHED_ERRORS) {
      lastRequests.failedRequests.shift();
      lastRequests.failedRequests.shift();
      lastRequests.errors.shift();
    }
    lastRequests.failedRequests.push(this.apiId, this.correlationId);
    if (error instanceof Error && !!error && error.toString()) {
      if (error instanceof AuthError) {
        if (error.subError) {
          lastRequests.errors.push(error.subError);
        } else if (error.errorCode) {
          lastRequests.errors.push(error.errorCode);
        } else {
          lastRequests.errors.push(error.toString());
        }
      } else {
        lastRequests.errors.push(error.toString());
      }
    } else {
      lastRequests.errors.push(SERVER_TELEM_UNKNOWN_ERROR);
    }
    this.cacheManager.setServerTelemetry(this.telemetryCacheKey, lastRequests, this.correlationId);
    return;
  }
  /**
   * Update server telemetry cache entry by incrementing cache hit counter
   */
  incrementCacheHits() {
    const lastRequests = this.getLastRequests();
    lastRequests.cacheHits += 1;
    this.cacheManager.setServerTelemetry(this.telemetryCacheKey, lastRequests, this.correlationId);
    return lastRequests.cacheHits;
  }
  /**
   * Get the server telemetry entity from cache or initialize a new one
   */
  getLastRequests() {
    const initialValue = {
      failedRequests: [],
      errors: [],
      cacheHits: 0
    };
    const lastRequests = this.cacheManager.getServerTelemetry(this.telemetryCacheKey, this.correlationId);
    return lastRequests || initialValue;
  }
  /**
   * Remove server telemetry cache entry
   */
  clearTelemetryCache() {
    const lastRequests = this.getLastRequests();
    const numErrorsFlushed = _ServerTelemetryManager.maxErrorsToSend(lastRequests);
    const errorCount = lastRequests.errors.length;
    if (numErrorsFlushed === errorCount) {
      this.cacheManager.removeItem(this.telemetryCacheKey, this.correlationId);
    } else {
      const serverTelemEntity = {
        failedRequests: lastRequests.failedRequests.slice(numErrorsFlushed * 2),
        errors: lastRequests.errors.slice(numErrorsFlushed),
        cacheHits: 0
      };
      this.cacheManager.setServerTelemetry(this.telemetryCacheKey, serverTelemEntity, this.correlationId);
    }
  }
  /**
   * Returns the maximum number of errors that can be flushed to the server in the next network request
   * @param serverTelemetryEntity
   */
  static maxErrorsToSend(serverTelemetryEntity) {
    let i;
    let maxErrors = 0;
    let dataSize = 0;
    const errorCount = serverTelemetryEntity.errors.length;
    for (i = 0; i < errorCount; i++) {
      const apiId = serverTelemetryEntity.failedRequests[2 * i] || "";
      const correlationId = serverTelemetryEntity.failedRequests[2 * i + 1] || "";
      const errorCode = serverTelemetryEntity.errors[i] || "";
      dataSize += apiId.toString().length + correlationId.toString().length + errorCode.length + 3;
      if (dataSize < SERVER_TELEM_MAX_LAST_HEADER_BYTES) {
        maxErrors += 1;
      } else {
        break;
      }
    }
    return maxErrors;
  }
  /**
   * Get the region discovery fields
   *
   * @returns string
   */
  getRegionDiscoveryFields() {
    const regionDiscoveryFields = [];
    regionDiscoveryFields.push(this.regionUsed || "");
    regionDiscoveryFields.push(this.regionSource || "");
    regionDiscoveryFields.push(this.regionOutcome || "");
    return regionDiscoveryFields.join(",");
  }
  /**
   * Update the region discovery metadata
   *
   * @param regionDiscoveryMetadata
   * @returns void
   */
  updateRegionDiscoveryMetadata(regionDiscoveryMetadata) {
    this.regionUsed = regionDiscoveryMetadata.region_used;
    this.regionSource = regionDiscoveryMetadata.region_source;
    this.regionOutcome = regionDiscoveryMetadata.region_outcome;
  }
  /**
   * Set cache outcome
   */
  setCacheOutcome(cacheOutcome) {
    this.cacheOutcome = cacheOutcome;
  }
  setNativeBrokerErrorCode(errorCode) {
    const lastRequests = this.getLastRequests();
    lastRequests.nativeBrokerErrorCode = errorCode;
    this.cacheManager.setServerTelemetry(this.telemetryCacheKey, lastRequests, this.correlationId);
  }
  getNativeBrokerErrorCode() {
    return this.getLastRequests().nativeBrokerErrorCode;
  }
  clearNativeBrokerErrorCode() {
    const lastRequests = this.getLastRequests();
    delete lastRequests.nativeBrokerErrorCode;
    this.cacheManager.setServerTelemetry(this.telemetryCacheKey, lastRequests, this.correlationId);
  }
  static makeExtraSkuString(params) {
    return makeExtraSkuString(params);
  }
};

// ../../node_modules/@azure/msal-common/dist-browser/error/JoseHeaderError.mjs
var JoseHeaderError = class _JoseHeaderError extends AuthError {
  constructor(errorCode, errorMessage) {
    super(errorCode, errorMessage);
    this.name = "JoseHeaderError";
    Object.setPrototypeOf(this, _JoseHeaderError.prototype);
  }
};
function createJoseHeaderError(code) {
  return new JoseHeaderError(code);
}

// ../../node_modules/@azure/msal-common/dist-browser/error/JoseHeaderErrorCodes.mjs
var missingKidError = "missing_kid_error";
var missingAlgError = "missing_alg_error";

// ../../node_modules/@azure/msal-common/dist-browser/crypto/JoseHeader.mjs
var JoseHeader = class _JoseHeader {
  constructor(options) {
    this.typ = options.typ;
    this.alg = options.alg;
    this.kid = options.kid;
  }
  /**
   * Builds SignedHttpRequest formatted JOSE Header from the
   * JOSE Header options provided or previously set on the object and returns
   * the stringified header object.
   * Throws if keyId or algorithm aren't provided since they are required for Access Token Binding.
   * @param shrHeaderOptions
   * @returns
   */
  static getShrHeaderString(shrHeaderOptions) {
    if (!shrHeaderOptions.kid) {
      throw createJoseHeaderError(missingKidError);
    }
    if (!shrHeaderOptions.alg) {
      throw createJoseHeaderError(missingAlgError);
    }
    const shrHeader = new _JoseHeader({
      // Access Token PoP headers must have type pop, but the type header can be overriden for special cases
      typ: shrHeaderOptions.typ || JsonWebTokenTypes.Pop,
      kid: shrHeaderOptions.kid,
      alg: shrHeaderOptions.alg
    });
    return JSON.stringify(shrHeader);
  }
};

// ../../node_modules/@azure/msal-common/dist-browser/telemetry/performance/PerformanceClient.mjs
function startContext(event, stack) {
  if (!stack) {
    return;
  }
  stack.push({
    name: event.name
  });
}
function endContext(event, stack, error) {
  if (!stack?.length) {
    return;
  }
  const peek = (stack2) => {
    return stack2.length ? stack2[stack2.length - 1] : void 0;
  };
  const abbrEventName = event.name;
  const top = peek(stack);
  if (top?.name !== abbrEventName) {
    return;
  }
  const current = stack?.pop();
  if (!current) {
    return;
  }
  const errorCode = error instanceof AuthError ? error.errorCode : error instanceof Error ? error.name : void 0;
  const subErr = error instanceof AuthError ? error.subError : void 0;
  if (errorCode && current.childErr !== errorCode) {
    current.err = errorCode;
    if (subErr) {
      current.subErr = subErr;
    }
  }
  delete current.name;
  delete current.childErr;
  const context = __spreadProps(__spreadValues({}, current), {
    dur: event.durationMs
  });
  if (!event.success) {
    context.fail = 1;
  }
  const parent = peek(stack);
  if (!parent) {
    return { [abbrEventName]: context };
  }
  if (errorCode) {
    parent.childErr = errorCode;
  }
  let childName;
  if (!parent[abbrEventName]) {
    childName = abbrEventName;
  } else {
    const siblings = Object.keys(parent).filter((key) => key.startsWith(abbrEventName)).length;
    childName = `${abbrEventName}_${siblings + 1}`;
  }
  parent[childName] = context;
  return parent;
}
function addError(error, logger, event, stackMaxSize = 5) {
  if (!(error instanceof Error)) {
    logger.trace("0gcyox", event.correlationId);
    return;
  } else if (error instanceof AuthError) {
    event.errorCode = error.errorCode;
    event.subErrorCode = error.subError;
    if (!event.serverErrorNo && (error instanceof ServerError || error instanceof InteractionRequiredAuthError) && error.errorNo) {
      event.serverErrorNo = error.errorNo;
    }
    return;
  } else if (error instanceof CacheError) {
    event.errorCode = error.errorCode;
    return;
  } else if (event.errorStack?.length) {
    logger.trace("0lmqrh", event.correlationId);
    return;
  } else if (!error.stack?.length) {
    logger.trace("1cnpwa", event.correlationId);
    return;
  }
  if (error.stack) {
    event.errorStack = compactStack(error.stack, stackMaxSize);
  }
  event.errorName = error.name;
}
function compactStack(stack, stackMaxSize) {
  if (stackMaxSize < 0) {
    return [];
  }
  const stackArr = stack.split("\n") || [];
  const res = [];
  const firstLine = stackArr[0];
  if (firstLine.startsWith("TypeError: Cannot read property") || firstLine.startsWith("TypeError: Cannot read properties of") || firstLine.startsWith("TypeError: Cannot set property") || firstLine.startsWith("TypeError: Cannot set properties of") || firstLine.endsWith("is not a function")) {
    res.push(compactStackLine(firstLine));
  } else if (firstLine.startsWith("SyntaxError") || firstLine.startsWith("TypeError")) {
    res.push(compactStackLine(
      // Example: SyntaxError: Unexpected token 'e', "test" is not valid JSON -> SyntaxError: Unexpected token <redacted>, <redacted> is not valid JSON
      firstLine.replace(/['].*[']|["].*["]/g, "<redacted>")
    ));
  }
  for (let ix = 1; ix < stackArr.length; ix++) {
    if (res.length >= stackMaxSize) {
      break;
    }
    const line = stackArr[ix];
    res.push(compactStackLine(line));
  }
  return res;
}
function compactStackLine(line) {
  const filePathIx = line.lastIndexOf(" ") + 1;
  if (filePathIx < 1) {
    return line;
  }
  const filePath = line.substring(filePathIx);
  let fileNameIx = filePath.lastIndexOf("/");
  fileNameIx = fileNameIx < 0 ? filePath.lastIndexOf("\\") : fileNameIx;
  if (fileNameIx >= 0) {
    return (line.substring(0, filePathIx) + "(" + filePath.substring(fileNameIx + 1) + (filePath.charAt(filePath.length - 1) === ")" ? "" : ")")).trimStart();
  }
  return line.trimStart();
}
function getAccountType(account) {
  const idTokenClaims = account?.idTokenClaims;
  if (idTokenClaims?.tfp || idTokenClaims?.acr) {
    return "B2C";
  }
  if (!idTokenClaims?.tid) {
    return void 0;
  } else if (idTokenClaims?.tid === "9188040d-6c67-4c5b-b112-36a304b66dad") {
    return "MSA";
  }
  return "AAD";
}
var PerformanceClient = class {
  /**
   * Creates an instance of PerformanceClient,
   * an abstract class containing core performance telemetry logic.
   *
   * @constructor
   * @param {string} clientId Client ID of the application
   * @param {string} authority Authority used by the application
   * @param {Logger} logger Logger used by the application
   * @param {string} libraryName Name of the library
   * @param {string} libraryVersion Version of the library
   * @param {ApplicationTelemetry} applicationTelemetry application name and version
   * @param {Set<String>} intFields integer fields to be truncated
   */
  constructor(clientId, authority, logger, libraryName, libraryVersion, applicationTelemetry, intFields) {
    this.authority = authority;
    this.libraryName = libraryName;
    this.libraryVersion = libraryVersion;
    this.applicationTelemetry = applicationTelemetry;
    this.clientId = clientId;
    this.logger = logger;
    this.callbacks = /* @__PURE__ */ new Map();
    this.eventsByCorrelationId = /* @__PURE__ */ new Map();
    this.eventStack = /* @__PURE__ */ new Map();
    this.intFields = intFields || /* @__PURE__ */ new Set();
    for (const item of IntFields) {
      this.intFields.add(item);
    }
  }
  /**
   * Starts measuring performance for a given operation. Returns a function that should be used to end the measurement.
   *
   * @param {PerformanceEvents} measureName
   * @param {?string} [correlationId]
   * @returns {InProgressPerformanceEvent}
   */
  startMeasurement(measureName, correlationId) {
    const eventCorrelationId = correlationId || this.generateId();
    const inProgressEvent = {
      eventId: this.generateId(),
      status: PerformanceEventStatus.InProgress,
      authority: this.authority,
      libraryName: this.libraryName,
      libraryVersion: this.libraryVersion,
      clientId: this.clientId,
      name: measureName,
      startTimeMs: Date.now(),
      correlationId: eventCorrelationId,
      appName: this.applicationTelemetry?.appName,
      appVersion: this.applicationTelemetry?.appVersion
    };
    this.cacheEventByCorrelationId(inProgressEvent);
    startContext(inProgressEvent, this.eventStack.get(eventCorrelationId));
    return {
      end: (event, error, account) => {
        return this.endMeasurement(__spreadValues(__spreadValues({}, inProgressEvent), event), error, account);
      },
      discard: () => {
        return this.discardMeasurements(inProgressEvent.correlationId);
      },
      add: (fields) => {
        return this.addFields(fields, inProgressEvent.correlationId);
      },
      increment: (fields) => {
        return this.incrementFields(fields, inProgressEvent.correlationId);
      },
      event: inProgressEvent
    };
  }
  /**
   * Stops measuring the performance for an operation. Should only be called directly by PerformanceClient classes,
   * as consumers should instead use the function returned by startMeasurement.
   * Adds a new field named as "[event name]DurationMs" for sub-measurements, completes and emits an event
   * otherwise.
   *
   * @param {PerformanceEvent} event
   * @param {unknown} error
   * @param {AccountInfo?} account
   * @returns {(PerformanceEvent | null)}
   */
  endMeasurement(event, error, account) {
    const rootEvent = this.eventsByCorrelationId.get(event.correlationId);
    if (!rootEvent) {
      this.logger.trace("0k9ti8", event.correlationId);
      return null;
    }
    const isRoot = event.eventId === rootEvent.eventId;
    event.durationMs = Math.round(event.durationMs || this.getDurationMs(event.startTimeMs));
    const context = JSON.stringify(endContext(event, this.eventStack.get(rootEvent.correlationId), error));
    if (isRoot) {
      this.discardMeasurements(rootEvent.correlationId);
    } else {
      rootEvent.incompleteSubMeasurements?.delete(event.eventId);
    }
    if (error) {
      addError(error, this.logger, rootEvent);
    }
    if (!isRoot) {
      rootEvent.ext = __spreadValues(__spreadValues({}, rootEvent.ext), event.ext);
      rootEvent.ext[event.name + "DurationMs"] = Math.floor(event.durationMs);
      return __spreadValues({}, rootEvent);
    }
    if (isRoot && !error && (rootEvent.errorCode || rootEvent.subErrorCode)) {
      this.logger.trace("1fm1tm", event.correlationId);
      rootEvent.errorCode = void 0;
      rootEvent.subErrorCode = void 0;
    }
    let finalEvent = __spreadValues(__spreadValues({}, rootEvent), event);
    let incompleteSubsCount = 0;
    finalEvent.incompleteSubMeasurements?.forEach((subMeasurement) => {
      this.logger.trace("0nxk52", finalEvent.correlationId);
      incompleteSubsCount++;
    });
    finalEvent.incompleteSubMeasurements = void 0;
    const logs = getAndFlushLogsFromCache(event.correlationId);
    const formattedLogs = logs.map((logMessage) => `${logMessage.milliseconds},${logMessage.hash}`).join(";");
    finalEvent = __spreadProps(__spreadValues({}, finalEvent), {
      status: PerformanceEventStatus.Completed,
      incompleteSubsCount,
      context,
      logs: formattedLogs
    });
    if (account) {
      finalEvent.accountType = getAccountType(account);
      finalEvent.dataBoundary = account.dataBoundary;
    }
    this.truncateIntegralFields(finalEvent);
    this.emitEvents([finalEvent], event.correlationId);
    return finalEvent;
  }
  /**
   * Saves extra information to be emitted when the measurements are flushed
   * @param fields
   * @param correlationId
   */
  addFields(fields, correlationId) {
    const event = this.eventsByCorrelationId.get(correlationId);
    if (event) {
      const staticFields = {};
      const dynamicFields = {};
      for (const key in fields) {
        if (key.startsWith(EXT_FIELD_PREFIX)) {
          const dynamicKey = key.slice(EXT_FIELD_PREFIX.length);
          const value = fields[key];
          if (typeof value === "string" || typeof value === "number") {
            dynamicFields[dynamicKey] = value;
          }
        } else {
          staticFields[key] = fields[key];
        }
      }
      const updatedEvent = __spreadValues(__spreadValues({}, event), staticFields);
      if (Object.keys(dynamicFields).length) {
        updatedEvent.ext = __spreadValues(__spreadValues({}, updatedEvent.ext), dynamicFields);
      }
      this.eventsByCorrelationId.set(correlationId, updatedEvent);
    } else {
      this.logger.trace("0thl6s", correlationId);
    }
  }
  /**
   * Increment counters to be emitted when the measurements are flushed
   * @param fields {string[]}
   * @param correlationId {string} correlation identifier
   */
  incrementFields(fields, correlationId) {
    const event = this.eventsByCorrelationId.get(correlationId);
    if (event) {
      for (const counter in fields) {
        if (counter.startsWith(EXT_FIELD_PREFIX)) {
          event.ext = event.ext || {};
          const dynamicKey = counter.slice(EXT_FIELD_PREFIX.length);
          const currentValue = event.ext[dynamicKey];
          if (currentValue === void 0) {
            event.ext[dynamicKey] = 0;
          } else if (isNaN(Number(currentValue))) {
            return;
          }
          event.ext[dynamicKey] = (Number(event.ext[dynamicKey]) || 0) + (fields[counter] ?? 0);
        } else {
          if (!event.hasOwnProperty(counter)) {
            event[counter] = 0;
          } else if (isNaN(Number(event[counter]))) {
            return;
          }
          event[counter] += fields[counter];
        }
      }
    } else {
      this.logger.trace("0thl6s", correlationId);
    }
  }
  /**
   * Upserts event into event cache.
   * First key is the correlation id, second key is the event id.
   * Allows for events to be grouped by correlation id,
   * and to easily allow for properties on them to be updated.
   *
   * @private
   * @param {PerformanceEvent} event
   */
  cacheEventByCorrelationId(event) {
    const rootEvent = this.eventsByCorrelationId.get(event.correlationId);
    if (rootEvent) {
      rootEvent.incompleteSubMeasurements = rootEvent.incompleteSubMeasurements || /* @__PURE__ */ new Map();
      rootEvent.incompleteSubMeasurements.set(event.eventId, {
        name: event.name,
        startTimeMs: event.startTimeMs
      });
    } else {
      this.eventsByCorrelationId.set(event.correlationId, __spreadValues({}, event));
      this.eventStack.set(event.correlationId, []);
    }
  }
  /**
   * Removes measurements and aux data for a given correlation id.
   *
   * @param {string} correlationId
   */
  discardMeasurements(correlationId) {
    this.eventsByCorrelationId.delete(correlationId);
    this.eventStack.delete(correlationId);
  }
  /**
   * Registers a callback function to receive performance events.
   *
   * @param {PerformanceCallbackFunction} callback
   * @returns {string}
   */
  addPerformanceCallback(callback) {
    for (const [id, cb] of this.callbacks) {
      if (cb.toString() === callback.toString()) {
        this.logger.warning("1eap5p", "");
        return id;
      }
    }
    const callbackId = this.generateId();
    this.callbacks.set(callbackId, callback);
    this.logger.verbose("0c9ujz", "");
    return callbackId;
  }
  /**
   * Removes a callback registered with addPerformanceCallback.
   *
   * @param {string} callbackId
   * @returns {boolean}
   */
  removePerformanceCallback(callbackId) {
    const result = this.callbacks.delete(callbackId);
    if (result) {
      this.logger.verbose("0253if", "");
    } else {
      this.logger.verbose("0iqk07", "");
    }
    return result;
  }
  /**
   * Emits events to all registered callbacks.
   *
   * @param {PerformanceEvent[]} events
   * @param {?string} [correlationId]
   */
  emitEvents(events, correlationId) {
    this.logger.verbose("11jb1y", correlationId);
    this.callbacks.forEach((callback, callbackId) => {
      this.logger.trace("0p2pjl", correlationId);
      callback.apply(null, [events]);
    });
  }
  /**
   * Enforce truncation of integral fields in performance event.
   * @param {PerformanceEvent} event performance event to update.
   */
  truncateIntegralFields(event) {
    this.intFields.forEach((key) => {
      if (key in event && typeof event[key] === "number") {
        event[key] = Math.floor(event[key]);
      }
    });
  }
  /**
   * Returns event duration in milliseconds
   * @param startTimeMs {number}
   * @returns {number}
   */
  getDurationMs(startTimeMs) {
    const durationMs = Date.now() - startTimeMs;
    return durationMs < 0 ? durationMs : 0;
  }
};

// ../../node_modules/@azure/msal-browser/dist/error/BrowserAuthError.mjs
function getDefaultErrorMessage2(code) {
  return `See https://aka.ms/msal.js.errors#${code} for details`;
}
var BrowserAuthError = class _BrowserAuthError extends AuthError {
  constructor(errorCode, subError) {
    super(errorCode, getDefaultErrorMessage2(errorCode), subError);
    Object.setPrototypeOf(this, _BrowserAuthError.prototype);
    this.name = "BrowserAuthError";
  }
};
function createBrowserAuthError(errorCode, subError) {
  return new BrowserAuthError(errorCode, subError);
}

// ../../node_modules/@azure/msal-browser/dist/utils/BrowserConstants.mjs
var BrowserConstants = {
  /**
   * Invalid grant error code
   */
  INVALID_GRANT_ERROR: "invalid_grant",
  /**
   * Default popup window width
   */
  POPUP_WIDTH: 483,
  /**
   * Default popup window height
   */
  POPUP_HEIGHT: 600,
  /**
   * Name of the popup window starts with
   */
  POPUP_NAME_PREFIX: "msal",
  /**
   * Msal-browser SKU
   */
  MSAL_SKU: "msal.js.browser"
};
var PlatformAuthConstants = {
  CHANNEL_ID: "53ee284d-920a-4b59-9d30-a60315b26836",
  PREFERRED_EXTENSION_ID: "ppnbnpeolgkicgegkbkbjmhlideopiji",
  MATS_TELEMETRY: "MATS",
  MICROSOFT_ENTRA_BROKERID: "MicrosoftEntra",
  DOM_API_NAME: "DOM API",
  PLATFORM_DOM_APIS: "get-token-and-sign-out",
  PLATFORM_DOM_PROVIDER: "PlatformAuthDOMHandler",
  PLATFORM_EXTENSION_PROVIDER: "PlatformAuthExtensionHandler"
};
var NativeExtensionMethod = {
  HandshakeRequest: "Handshake",
  HandshakeResponse: "HandshakeResponse",
  GetToken: "GetToken",
  Response: "Response"
};
var BrowserCacheLocation = {
  LocalStorage: "localStorage",
  SessionStorage: "sessionStorage",
  MemoryStorage: "memoryStorage"
};
var HTTP_REQUEST_TYPE = {
  GET: "GET",
  POST: "POST"
};
var INTERACTION_TYPE = {
  SIGNIN: "signin",
  SIGNOUT: "signout"
};
var TemporaryCacheKeys = {
  ORIGIN_URI: "request.origin",
  URL_HASH: "urlHash",
  REQUEST_PARAMS: "request.params",
  VERIFIER: "code.verifier",
  INTERACTION_STATUS_KEY: "interaction.status",
  NATIVE_REQUEST: "request.native"
};
var InMemoryCacheKeys = {
  WRAPPER_SKU: "wrapper.sku",
  WRAPPER_VER: "wrapper.version"
};
var ApiId = {
  acquireTokenRedirect: 861,
  acquireTokenPopup: 862,
  ssoSilent: 863,
  acquireTokenSilent_authCode: 864,
  handleRedirectPromise: 865,
  acquireTokenByCode: 866,
  acquireTokenSilent_silentFlow: 61,
  logout: 961,
  logoutPopup: 962,
  hydrateCache: 963,
  loadExternalTokens: 964
};
var ApiName = {
  861: "acquireTokenRedirect",
  862: "acquireTokenPopup",
  863: "ssoSilent",
  864: "acquireTokenSilent_authCode",
  865: "handleRedirectPromise",
  866: "acquireTokenByCode",
  61: "acquireTokenSilent_silentFlow",
  961: "logout",
  962: "logoutPopup",
  963: "hydrateCache",
  964: "loadExternalTokens"
};
var apiIdToName = (id) => {
  if (typeof id === "number" && id in ApiName) {
    return ApiName[id];
  }
  return "unknown";
};
var InteractionType;
(function(InteractionType2) {
  InteractionType2["Redirect"] = "redirect";
  InteractionType2["Popup"] = "popup";
  InteractionType2["Silent"] = "silent";
  InteractionType2["None"] = "none";
})(InteractionType || (InteractionType = {}));
var InteractionStatus = {
  /**
   * Initial status before interaction occurs
   */
  Startup: "startup",
  /**
   * Status set when logout call occuring
   */
  Logout: "logout",
  /**
   * Status set for acquireToken calls
   */
  AcquireToken: "acquireToken",
  /**
   * Status set when handleRedirect in progress
   */
  HandleRedirect: "handleRedirect",
  /**
   * Status set when interaction is complete
   */
  None: "none"
};
var DEFAULT_REQUEST = {
  scopes: Constants_exports.OIDC_DEFAULT_SCOPES
};
var KEY_FORMAT_JWK = "jwk";
var WrapperSKU = {
  React: "@azure/msal-react",
  Angular: "@azure/msal-angular"
};
var DB_NAME = "msal.db";
var DB_VERSION = 1;
var DB_TABLE_NAME = `${DB_NAME}.keys`;
var CacheLookupPolicy = {
  /*
   * acquireTokenSilent will attempt to retrieve an access token from the cache. If the access token is expired
   * or cannot be found the refresh token will be used to acquire a new one. Finally, if the refresh token
   * is expired acquireTokenSilent will attempt to acquire new access and refresh tokens.
   */
  Default: 0,
  /*
   * acquireTokenSilent will only look for access tokens in the cache. It will not attempt to renew access or
   * refresh tokens.
   */
  AccessToken: 1,
  /*
   * acquireTokenSilent will attempt to retrieve an access token from the cache. If the access token is expired or
   * cannot be found, the refresh token will be used to acquire a new one. If the refresh token is expired, it
   * will not be renewed and acquireTokenSilent will fail.
   */
  AccessTokenAndRefreshToken: 2,
  /*
   * acquireTokenSilent will not attempt to retrieve access tokens from the cache and will instead attempt to
   * exchange the cached refresh token for a new access token. If the refresh token is expired, it will not be
   * renewed and acquireTokenSilent will fail.
   */
  RefreshToken: 3,
  /*
   * acquireTokenSilent will not look in the cache for the access token. It will go directly to network with the
   * cached refresh token. If the refresh token is expired an attempt will be made to renew it. This is equivalent to
   * setting "forceRefresh: true".
   */
  RefreshTokenAndNetwork: 4,
  /*
   * acquireTokenSilent will attempt to renew both access and refresh tokens. It will not look in the cache. This will
   * always fail if 3rd party cookies are blocked by the browser.
   */
  Skip: 5
};
var iFrameRenewalPolicies = [
  CacheLookupPolicy.Default,
  CacheLookupPolicy.Skip,
  CacheLookupPolicy.RefreshTokenAndNetwork
];

// ../../node_modules/@azure/msal-browser/dist/error/BrowserAuthErrorCodes.mjs
var BrowserAuthErrorCodes_exports = {};
__export(BrowserAuthErrorCodes_exports, {
  authCodeOrNativeAccountIdRequired: () => authCodeOrNativeAccountIdRequired,
  authCodeRequired: () => authCodeRequired,
  authRequestNotSetError: () => authRequestNotSetError,
  blockIframeReload: () => blockIframeReload,
  blockNestedPopups: () => blockNestedPopups,
  cryptoKeyNotFound: () => cryptoKeyNotFound,
  cryptoNonExistent: () => cryptoNonExistent,
  databaseNotOpen: () => databaseNotOpen,
  databaseUnavailable: () => databaseUnavailable,
  earJweEmpty: () => earJweEmpty,
  earJwkEmpty: () => earJwkEmpty,
  emptyNavigateUri: () => emptyNavigateUri,
  emptyResponse: () => emptyResponse,
  emptyWindowError: () => emptyWindowError,
  failedToBuildHeaders: () => failedToBuildHeaders,
  failedToDecryptEarResponse: () => failedToDecryptEarResponse,
  failedToParseHeaders: () => failedToParseHeaders,
  failedToParseResponse: () => failedToParseResponse,
  getRequestFailed: () => getRequestFailed,
  hashDoesNotContainKnownProperties: () => hashDoesNotContainKnownProperties,
  hashEmptyError: () => hashEmptyError,
  iframeClosedPrematurely: () => iframeClosedPrematurely,
  interactionInProgress: () => interactionInProgress,
  interactionInProgressCancelled: () => interactionInProgressCancelled,
  invalidBase64String: () => invalidBase64String,
  invalidCacheType: () => invalidCacheType,
  invalidPopTokenRequest: () => invalidPopTokenRequest,
  nativeConnectionNotEstablished: () => nativeConnectionNotEstablished,
  nativeExtensionNotInstalled: () => nativeExtensionNotInstalled,
  nativeHandshakeTimeout: () => nativeHandshakeTimeout,
  nativePromptNotSupported: () => nativePromptNotSupported,
  noAccountError: () => noAccountError,
  noNetworkConnectivity: () => noNetworkConnectivity2,
  noStateInHash: () => noStateInHash,
  noTokenRequestCacheError: () => noTokenRequestCacheError,
  nonBrowserEnvironment: () => nonBrowserEnvironment,
  pkceNotCreated: () => pkceNotCreated,
  popupWindowError: () => popupWindowError,
  postRequestFailed: () => postRequestFailed2,
  redirectBridgeEmptyResponse: () => redirectBridgeEmptyResponse,
  redirectInIframe: () => redirectInIframe,
  silentLogoutUnsupported: () => silentLogoutUnsupported,
  silentPromptValueError: () => silentPromptValueError,
  spaCodeAndNativeAccountIdPresent: () => spaCodeAndNativeAccountIdPresent,
  stateInteractionTypeMismatch: () => stateInteractionTypeMismatch,
  timedOut: () => timedOut,
  unableToAcquireTokenFromNativePlatform: () => unableToAcquireTokenFromNativePlatform,
  unableToLoadToken: () => unableToLoadToken,
  unableToParseState: () => unableToParseState,
  unableToParseTokenRequestCacheError: () => unableToParseTokenRequestCacheError,
  uninitializedPublicClientApplication: () => uninitializedPublicClientApplication,
  userCancelled: () => userCancelled
});
var pkceNotCreated = "pkce_not_created";
var earJwkEmpty = "ear_jwk_empty";
var earJweEmpty = "ear_jwe_empty";
var cryptoNonExistent = "crypto_nonexistent";
var emptyNavigateUri = "empty_navigate_uri";
var hashEmptyError = "hash_empty_error";
var noStateInHash = "no_state_in_hash";
var hashDoesNotContainKnownProperties = "hash_does_not_contain_known_properties";
var unableToParseState = "unable_to_parse_state";
var stateInteractionTypeMismatch = "state_interaction_type_mismatch";
var interactionInProgress = "interaction_in_progress";
var interactionInProgressCancelled = "interaction_in_progress_cancelled";
var popupWindowError = "popup_window_error";
var emptyWindowError = "empty_window_error";
var userCancelled = "user_cancelled";
var redirectBridgeEmptyResponse = "redirect_bridge_empty_response";
var redirectInIframe = "redirect_in_iframe";
var blockIframeReload = "block_iframe_reload";
var blockNestedPopups = "block_nested_popups";
var iframeClosedPrematurely = "iframe_closed_prematurely";
var silentLogoutUnsupported = "silent_logout_unsupported";
var noAccountError = "no_account_error";
var silentPromptValueError = "silent_prompt_value_error";
var noTokenRequestCacheError = "no_token_request_cache_error";
var unableToParseTokenRequestCacheError = "unable_to_parse_token_request_cache_error";
var authRequestNotSetError = "auth_request_not_set_error";
var invalidCacheType = "invalid_cache_type";
var nonBrowserEnvironment = "non_browser_environment";
var databaseNotOpen = "database_not_open";
var noNetworkConnectivity2 = "no_network_connectivity";
var postRequestFailed2 = "post_request_failed";
var getRequestFailed = "get_request_failed";
var failedToParseResponse = "failed_to_parse_response";
var unableToLoadToken = "unable_to_load_token";
var cryptoKeyNotFound = "crypto_key_not_found";
var authCodeRequired = "auth_code_required";
var authCodeOrNativeAccountIdRequired = "auth_code_or_nativeAccountId_required";
var spaCodeAndNativeAccountIdPresent = "spa_code_and_nativeAccountId_present";
var databaseUnavailable = "database_unavailable";
var unableToAcquireTokenFromNativePlatform = "unable_to_acquire_token_from_native_platform";
var nativeHandshakeTimeout = "native_handshake_timeout";
var nativeExtensionNotInstalled = "native_extension_not_installed";
var nativeConnectionNotEstablished = "native_connection_not_established";
var uninitializedPublicClientApplication = "uninitialized_public_client_application";
var nativePromptNotSupported = "native_prompt_not_supported";
var invalidBase64String = "invalid_base64_string";
var invalidPopTokenRequest = "invalid_pop_token_request";
var failedToBuildHeaders = "failed_to_build_headers";
var failedToParseHeaders = "failed_to_parse_headers";
var failedToDecryptEarResponse = "failed_to_decrypt_ear_response";
var timedOut = "timed_out";
var emptyResponse = "empty_response";

// ../../node_modules/@azure/msal-browser/dist/error/BrowserConfigurationAuthError.mjs
var BrowserConfigurationAuthError = class _BrowserConfigurationAuthError extends AuthError {
  constructor(errorCode, errorMessage) {
    super(errorCode, errorMessage);
    this.name = "BrowserConfigurationAuthError";
    Object.setPrototypeOf(this, _BrowserConfigurationAuthError.prototype);
  }
};
function createBrowserConfigurationAuthError(errorCode) {
  return new BrowserConfigurationAuthError(errorCode, getDefaultErrorMessage2(errorCode));
}

// ../../node_modules/@azure/msal-browser/dist/error/BrowserConfigurationAuthErrorCodes.mjs
var BrowserConfigurationAuthErrorCodes_exports = {};
__export(BrowserConfigurationAuthErrorCodes_exports, {
  inMemRedirectUnavailable: () => inMemRedirectUnavailable,
  storageNotSupported: () => storageNotSupported,
  stubbedPublicClientApplicationCalled: () => stubbedPublicClientApplicationCalled
});
var storageNotSupported = "storage_not_supported";
var stubbedPublicClientApplicationCalled = "stubbed_public_client_application_called";
var inMemRedirectUnavailable = "in_mem_redirect_unavailable";

// ../../node_modules/@azure/msal-browser/dist/utils/BrowserUtils.mjs
var BrowserUtils_exports = {};
__export(BrowserUtils_exports, {
  addClientCapabilitiesToClaims: () => addClientCapabilitiesToClaims2,
  blockAPICallsBeforeInitialize: () => blockAPICallsBeforeInitialize,
  blockAcquireTokenInPopups: () => blockAcquireTokenInPopups,
  blockNonBrowserEnvironment: () => blockNonBrowserEnvironment,
  blockRedirectInIframe: () => blockRedirectInIframe,
  blockReloadInHiddenIframes: () => blockReloadInHiddenIframes,
  cancelPendingBridgeResponse: () => cancelPendingBridgeResponse,
  clearHash: () => clearHash,
  createGuid: () => createGuid,
  getCurrentUri: () => getCurrentUri,
  getHomepage: () => getHomepage,
  invoke: () => invoke,
  invokeAsync: () => invokeAsync,
  isInIframe: () => isInIframe,
  isInPopup: () => isInPopup,
  parseAuthResponseFromUrl: () => parseAuthResponseFromUrl,
  preconnect: () => preconnect,
  preflightCheck: () => preflightCheck,
  redirectPreflightCheck: () => redirectPreflightCheck,
  replaceHash: () => replaceHash,
  waitForBridgeResponse: () => waitForBridgeResponse
});

// ../../node_modules/@azure/msal-browser/dist/telemetry/BrowserPerformanceEvents.mjs
var AcquireTokenFromCache = "acquireTokenFromCache";
var AcquireTokenByRefreshToken = "acquireTokenByRefreshToken";
var AcquireTokenSilentAsync = "acquireTokenSilentAsync";
var CryptoOptsGetPublicKeyThumbprint = "cryptoOptsGetPublicKeyThumbprint";
var CryptoOptsSignJwt = "cryptoOptsSignJwt";
var SilentCacheClientAcquireToken = "silentCacheClientAcquireToken";
var SilentIframeClientAcquireToken = "silentIframeClientAcquireToken";
var AwaitConcurrentIframe = "awaitConcurrentIframe";
var SilentRefreshClientAcquireToken = "silentRefreshClientAcquireToken";
var StandardInteractionClientGetDiscoveredAuthority = "standardInteractionClientGetDiscoveredAuthority";
var NativeInteractionClientAcquireToken = "nativeInteractionClientAcquireToken";
var NativeInteractionClientAcquireTokenRedirect = "nativeInteractionClientAcquireToken";
var RefreshTokenClientAcquireTokenByRefreshToken = "refreshTokenClientAcquireTokenByRefreshToken";
var AcquireTokenBySilentIframe = "acquireTokenBySilentIframe";
var InitializeBaseRequest = "initializeBaseRequest";
var InitializeSilentRequest = "initializeSilentRequest";
var InitializeCache = "initializeCache";
var SilentIframeClientTokenHelper = "silentIframeClientTokenHelper";
var SilentHandlerInitiateAuthRequest = "silentHandlerInitiateAuthRequest";
var SilentHandlerMonitorIframeForHash = "silentHandlerMonitorIframeForHash";
var SilentHandlerLoadFrameSync = "silentHandlerLoadFrameSync";
var StandardInteractionClientCreateAuthCodeClient = "standardInteractionClientCreateAuthCodeClient";
var StandardInteractionClientGetClientConfiguration = "standardInteractionClientGetClientConfiguration";
var StandardInteractionClientInitializeAuthorizationRequest = "standardInteractionClientInitializeAuthorizationRequest";
var SilentFlowClientAcquireCachedToken = "silentFlowClientAcquireCachedToken";
var GetStandardParams = "getStandardParams";
var HandleCodeResponse = "handleCodeResponse";
var HandleResponseEar = "handleResponseEar";
var HandleResponsePlatformBroker = "handleResponsePlatformBroker";
var HandleResponseCode = "handleResponseCode";
var AuthClientAcquireToken = "authClientAcquireToken";
var DeserializeResponse = "deserializeResponse";
var AuthorityFactoryCreateDiscoveredInstance = "authorityFactoryCreateDiscoveredInstance";
var AcquireTokenByCodeAsync = "acquireTokenByCodeAsync";
var HandleRedirectPromiseMeasurement = "handleRedirectPromise";
var HandleNativeRedirectPromiseMeasurement = "handleNativeRedirectPromise";
var NativeMessageHandlerHandshake = "nativeMessageHandlerHandshake";
var RemoveHiddenIframe = "removeHiddenIframe";
var ImportExistingCache = "importExistingCache";
var GeneratePkceCodes = "generatePkceCodes";
var GenerateCodeVerifier = "generateCodeVerifier";
var GenerateCodeChallengeFromVerifier = "generateCodeChallengeFromVerifier";
var Sha256Digest = "sha256Digest";
var GetRandomValues = "getRandomValues";
var GenerateHKDF = "generateHKDF";
var GenerateBaseKey = "generateBaseKey";
var Base64Decode = "base64Decode";
var UrlEncodeArr = "urlEncodeArr";
var Encrypt = "encrypt";
var Decrypt = "decrypt";
var GenerateEarKey = "generateEarKey";
var DecryptEarResponse = "decryptEarResponse";
var LoadAccount = "loadAccount";
var LoadIdToken = "loadIdToken";
var LoadAccessToken = "loadAccessToken";
var LoadRefreshToken = "loadRefreshToken";
var WaitForBridgeLateResponse = "waitForBridgeLateResponse";

// ../../node_modules/@azure/msal-browser/dist/encode/Base64Encode.mjs
function urlEncode(input) {
  return encodeURIComponent(base64Encode(input).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_"));
}
function urlEncodeArr(inputArr) {
  return base64EncArr(inputArr).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function base64Encode(input) {
  return base64EncArr(new TextEncoder().encode(input));
}
function base64EncArr(aBytes) {
  const binString = Array.from(aBytes, (x) => String.fromCodePoint(x)).join("");
  return btoa(binString);
}

// ../../node_modules/@azure/msal-browser/dist/encode/Base64Decode.mjs
function base64Decode(input) {
  return new TextDecoder().decode(base64DecToArr(input));
}
function base64DecToArr(base64String) {
  let encodedString = base64String.replace(/-/g, "+").replace(/_/g, "/");
  switch (encodedString.length % 4) {
    case 0:
      break;
    case 2:
      encodedString += "==";
      break;
    case 3:
      encodedString += "=";
      break;
    default:
      throw createBrowserAuthError(invalidBase64String);
  }
  const binString = atob(encodedString);
  return Uint8Array.from(binString, (m) => m.codePointAt(0) || 0);
}

// ../../node_modules/@azure/msal-browser/dist/crypto/BrowserCrypto.mjs
var PKCS1_V15_KEYGEN_ALG = "RSASSA-PKCS1-v1_5";
var AES_GCM = "AES-GCM";
var HKDF = "HKDF";
var S256_HASH_ALG = "SHA-256";
var MODULUS_LENGTH = 2048;
var PUBLIC_EXPONENT = new Uint8Array([1, 0, 1]);
var UUID_CHARS = "0123456789abcdef";
var UINT32_ARR = new Uint32Array(1);
var RAW = "raw";
var ENCRYPT = "encrypt";
var DECRYPT = "decrypt";
var DERIVE_KEY = "deriveKey";
var SUBTLE_SUBERROR = "crypto_subtle_undefined";
var keygenAlgorithmOptions = {
  name: PKCS1_V15_KEYGEN_ALG,
  hash: S256_HASH_ALG,
  modulusLength: MODULUS_LENGTH,
  publicExponent: PUBLIC_EXPONENT
};
function validateCryptoAvailable(skipValidateSubtleCrypto) {
  if (!window) {
    throw createBrowserAuthError(nonBrowserEnvironment);
  }
  if (!window.crypto) {
    throw createBrowserAuthError(cryptoNonExistent);
  }
  if (!skipValidateSubtleCrypto && !window.crypto.subtle) {
    throw createBrowserAuthError(cryptoNonExistent, SUBTLE_SUBERROR);
  }
}
async function sha256Digest(dataString) {
  const encoder = new TextEncoder();
  const data = encoder.encode(dataString);
  return window.crypto.subtle.digest(S256_HASH_ALG, data);
}
function getRandomValues(dataBuffer) {
  return window.crypto.getRandomValues(dataBuffer);
}
function getRandomUint32() {
  window.crypto.getRandomValues(UINT32_ARR);
  return UINT32_ARR[0];
}
function createNewGuid() {
  const currentTimestamp = Date.now();
  const baseRand = getRandomUint32() * 1024 + (getRandomUint32() & 1023);
  const bytes = new Uint8Array(16);
  const randA = Math.trunc(baseRand / 2 ** 30);
  const randBHi = baseRand & 2 ** 30 - 1;
  const randBLo = getRandomUint32();
  bytes[0] = currentTimestamp / 2 ** 40;
  bytes[1] = currentTimestamp / 2 ** 32;
  bytes[2] = currentTimestamp / 2 ** 24;
  bytes[3] = currentTimestamp / 2 ** 16;
  bytes[4] = currentTimestamp / 2 ** 8;
  bytes[5] = currentTimestamp;
  bytes[6] = 112 | randA >>> 8;
  bytes[7] = randA;
  bytes[8] = 128 | randBHi >>> 24;
  bytes[9] = randBHi >>> 16;
  bytes[10] = randBHi >>> 8;
  bytes[11] = randBHi;
  bytes[12] = randBLo >>> 24;
  bytes[13] = randBLo >>> 16;
  bytes[14] = randBLo >>> 8;
  bytes[15] = randBLo;
  let text = "";
  for (let i = 0; i < bytes.length; i++) {
    text += UUID_CHARS.charAt(bytes[i] >>> 4);
    text += UUID_CHARS.charAt(bytes[i] & 15);
    if (i === 3 || i === 5 || i === 7 || i === 9) {
      text += "-";
    }
  }
  return text;
}
async function generateKeyPair(extractable, usages) {
  return window.crypto.subtle.generateKey(keygenAlgorithmOptions, extractable, usages);
}
async function exportJwk(key) {
  return window.crypto.subtle.exportKey(KEY_FORMAT_JWK, key);
}
async function importJwk(key, extractable, usages) {
  return window.crypto.subtle.importKey(KEY_FORMAT_JWK, key, keygenAlgorithmOptions, extractable, usages);
}
async function sign(key, data) {
  return window.crypto.subtle.sign(keygenAlgorithmOptions, key, data);
}
async function generateEarKey() {
  const key = await generateBaseKey();
  const keyStr = urlEncodeArr(new Uint8Array(key));
  const jwk = {
    alg: "dir",
    kty: "oct",
    k: keyStr
  };
  return base64Encode(JSON.stringify(jwk));
}
async function importEarKey(earJwk) {
  const b64DecodedJwk = base64Decode(earJwk);
  const jwkJson = JSON.parse(b64DecodedJwk);
  const rawKey = jwkJson.k;
  const keyBuffer = base64DecToArr(rawKey);
  return window.crypto.subtle.importKey(RAW, keyBuffer, AES_GCM, false, [
    DECRYPT
  ]);
}
async function decryptEarResponse(earJwk, earJwe) {
  const earJweParts = earJwe.split(".");
  if (earJweParts.length !== 5) {
    throw createBrowserAuthError(failedToDecryptEarResponse, "jwe_length");
  }
  const key = await importEarKey(earJwk).catch(() => {
    throw createBrowserAuthError(failedToDecryptEarResponse, "import_key");
  });
  try {
    const header = new TextEncoder().encode(earJweParts[0]);
    const iv = base64DecToArr(earJweParts[2]);
    const ciphertext = base64DecToArr(earJweParts[3]);
    const tag = base64DecToArr(earJweParts[4]);
    const tagLengthBits = tag.byteLength * 8;
    const encryptedData = new Uint8Array(ciphertext.length + tag.length);
    encryptedData.set(ciphertext);
    encryptedData.set(tag, ciphertext.length);
    const decryptedData = await window.crypto.subtle.decrypt({
      name: AES_GCM,
      iv,
      tagLength: tagLengthBits,
      additionalData: header
    }, key, encryptedData);
    return new TextDecoder().decode(decryptedData);
  } catch (e) {
    throw createBrowserAuthError(failedToDecryptEarResponse, "decrypt");
  }
}
async function generateBaseKey() {
  const key = await window.crypto.subtle.generateKey({
    name: AES_GCM,
    length: 256
  }, true, [ENCRYPT, DECRYPT]);
  return window.crypto.subtle.exportKey(RAW, key);
}
async function generateHKDF(baseKey) {
  return window.crypto.subtle.importKey(RAW, baseKey, HKDF, false, [
    DERIVE_KEY
  ]);
}
async function deriveKey(baseKey, nonce, context) {
  return window.crypto.subtle.deriveKey({
    name: HKDF,
    salt: nonce,
    hash: S256_HASH_ALG,
    info: new TextEncoder().encode(context)
  }, baseKey, { name: AES_GCM, length: 256 }, false, [ENCRYPT, DECRYPT]);
}
async function encrypt(baseKey, rawData, context) {
  const encodedData = new TextEncoder().encode(rawData);
  const nonce = window.crypto.getRandomValues(new Uint8Array(16));
  const derivedKey = await deriveKey(baseKey, nonce, context);
  const encryptedData = await window.crypto.subtle.encrypt({
    name: AES_GCM,
    iv: new Uint8Array(12)
    // New key is derived for every encrypt so we don't need a new nonce
  }, derivedKey, encodedData);
  return {
    data: urlEncodeArr(new Uint8Array(encryptedData)),
    nonce: urlEncodeArr(nonce)
  };
}
async function decrypt(baseKey, nonce, context, encryptedData) {
  const encodedData = base64DecToArr(encryptedData);
  const derivedKey = await deriveKey(baseKey, base64DecToArr(nonce), context);
  const decryptedData = await window.crypto.subtle.decrypt({
    name: AES_GCM,
    iv: new Uint8Array(12)
    // New key is derived for every encrypt so we don't need a new nonce
  }, derivedKey, encodedData);
  return new TextDecoder().decode(decryptedData);
}
async function hashString(plainText) {
  const hashBuffer = await sha256Digest(plainText);
  const hashBytes = new Uint8Array(hashBuffer);
  return urlEncodeArr(hashBytes);
}

// ../../node_modules/@azure/msal-browser/dist/utils/BrowserUtils.mjs
function parseAuthResponseFromUrl() {
  const urlHash = window.location.hash;
  const urlQuery = window.location.search;
  let hasResponseInHash = false;
  let hasResponseInQuery = false;
  let payload = "";
  let params = void 0;
  if (urlHash && urlHash.length > 1) {
    const hashContent = urlHash.charAt(0) === "#" ? urlHash.substring(1) : urlHash;
    const hashParams = new URLSearchParams(hashContent);
    if (hashParams.has("state")) {
      hasResponseInHash = true;
      payload = hashContent;
      params = hashParams;
    }
  }
  if (urlQuery && urlQuery.length > 1) {
    const queryContent = urlQuery.charAt(0) === "?" ? urlQuery.substring(1) : urlQuery;
    const queryParams = new URLSearchParams(queryContent);
    if (queryParams.has("state")) {
      hasResponseInQuery = true;
      payload = queryContent;
      params = queryParams;
    }
  }
  if (hasResponseInHash && hasResponseInQuery) {
    const queryContent = urlQuery.charAt(0) === "?" ? urlQuery.substring(1) : urlQuery;
    const hashContent = urlHash.charAt(0) === "#" ? urlHash.substring(1) : urlHash;
    payload = `${queryContent}${hashContent}`;
    params = new URLSearchParams(payload);
  }
  if (!payload || !params) {
    throw createBrowserAuthError(emptyResponse);
  }
  const state = params.get("state");
  if (!state) {
    throw createBrowserAuthError(noStateInHash);
  }
  const { libraryState } = ProtocolUtils_exports.parseRequestState(base64Decode, state);
  const { id, meta } = libraryState;
  if (!id || !meta) {
    throw createBrowserAuthError(unableToParseState, "missing_library_state");
  }
  return {
    params,
    payload,
    urlHash,
    urlQuery,
    hasResponseInHash,
    hasResponseInQuery,
    libraryState: {
      id,
      meta
    }
  };
}
function clearHash(contentWindow) {
  contentWindow.location.hash = "";
  if (typeof contentWindow.history.replaceState === "function") {
    contentWindow.history.replaceState(null, "", `${contentWindow.location.origin}${contentWindow.location.pathname}${contentWindow.location.search}`);
  }
}
function replaceHash(url) {
  const urlParts = url.split("#");
  urlParts.shift();
  window.location.hash = urlParts.length > 0 ? urlParts.join("#") : "";
}
function isInIframe() {
  return window.parent !== window;
}
function isInPopup() {
  if (isInIframe()) {
    return false;
  }
  try {
    const { libraryState } = parseAuthResponseFromUrl();
    const { meta } = libraryState;
    return meta["interactionType"] === InteractionType.Popup;
  } catch (e) {
    return false;
  }
}
var activeBridgeMonitor = null;
function cancelPendingBridgeResponse(logger, correlationId) {
  if (activeBridgeMonitor) {
    logger.verbose("18y01k", correlationId);
    clearTimeout(activeBridgeMonitor.timeoutId);
    activeBridgeMonitor.channel.close();
    activeBridgeMonitor.reject(createBrowserAuthError(interactionInProgressCancelled));
    activeBridgeMonitor = null;
  }
}
async function waitForBridgeResponse(timeoutMs, logger, browserCrypto, request, performanceClient, experimentalConfig) {
  return new Promise((resolve, reject) => {
    logger.verbose("1rf6em", request.correlationId);
    const correlationId = request.correlationId;
    performanceClient.addFields({
      redirectBridgeTimeoutMs: timeoutMs,
      lateResponseExperimentEnabled: experimentalConfig?.iframeTimeoutTelemetry || false
    }, correlationId);
    const { libraryState } = ProtocolUtils_exports.parseRequestState(browserCrypto.base64Decode, request.state || "");
    const channel = new BroadcastChannel(libraryState.id);
    let responseString = void 0;
    let timedOut$1 = false;
    let lateTimeoutId;
    let lateMeasurement;
    const timeoutId = window.setTimeout(() => {
      activeBridgeMonitor = null;
      if (experimentalConfig?.iframeTimeoutTelemetry) {
        lateMeasurement = performanceClient.startMeasurement(WaitForBridgeLateResponse, correlationId);
        timedOut$1 = true;
        lateTimeoutId = window.setTimeout(() => {
          lateMeasurement?.end({ success: false });
          clearTimeout(lateTimeoutId);
          channel.close();
        }, 6e4);
      } else {
        channel.close();
      }
      reject(createBrowserAuthError(timedOut, "redirect_bridge_timeout"));
    }, timeoutMs);
    activeBridgeMonitor = {
      timeoutId,
      channel,
      reject
    };
    channel.onmessage = (event) => {
      responseString = event.data.payload;
      const messageVersion = event?.data && typeof event.data.v === "number" ? event.data.v : void 0;
      if (timedOut$1) {
        lateMeasurement?.end({
          success: responseString ? true : false
        });
        clearTimeout(lateTimeoutId);
        channel.close();
        return;
      }
      performanceClient.addFields({
        redirectBridgeMessageVersion: messageVersion
      }, correlationId);
      activeBridgeMonitor = null;
      clearTimeout(timeoutId);
      channel.close();
      if (responseString) {
        resolve(responseString);
      } else {
        reject(createBrowserAuthError(redirectBridgeEmptyResponse));
      }
    };
  });
}
function getCurrentUri() {
  return typeof window !== "undefined" && window.location ? window.location.href.split("?")[0].split("#")[0] : "";
}
function getHomepage() {
  const currentUrl = new UrlString(window.location.href);
  const urlComponents = currentUrl.getUrlComponents();
  return `${urlComponents.Protocol}//${urlComponents.HostNameAndPort}/`;
}
function blockReloadInHiddenIframes() {
  const isResponseHash = UrlUtils_exports.getDeserializedResponse(window.location.hash);
  if (isResponseHash && isInIframe()) {
    throw createBrowserAuthError(blockIframeReload);
  }
}
function blockRedirectInIframe(allowRedirectInIframe) {
  if (isInIframe() && !allowRedirectInIframe) {
    throw createBrowserAuthError(redirectInIframe);
  }
}
function blockAcquireTokenInPopups() {
  if (isInPopup()) {
    throw createBrowserAuthError(blockNestedPopups);
  }
}
function blockNonBrowserEnvironment() {
  if (typeof window === "undefined") {
    throw createBrowserAuthError(nonBrowserEnvironment);
  }
}
function blockAPICallsBeforeInitialize(initialized) {
  if (!initialized) {
    throw createBrowserAuthError(uninitializedPublicClientApplication);
  }
}
function preflightCheck(initialized) {
  blockNonBrowserEnvironment();
  blockReloadInHiddenIframes();
  blockAcquireTokenInPopups();
  blockAPICallsBeforeInitialize(initialized);
}
function redirectPreflightCheck(initialized, config) {
  preflightCheck(initialized);
  blockRedirectInIframe(config.system.allowRedirectInIframe);
  if (config.cache.cacheLocation === BrowserCacheLocation.MemoryStorage) {
    throw createBrowserConfigurationAuthError(inMemRedirectUnavailable);
  }
}
function preconnect(authority) {
  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = new URL(authority).origin;
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
  window.setTimeout(() => {
    try {
      document.head.removeChild(link);
    } catch {
    }
  }, 1e4);
}
function createGuid() {
  return createNewGuid();
}
var addClientCapabilitiesToClaims2 = RequestParameterBuilder_exports.addClientCapabilitiesToClaims;

// ../../node_modules/@azure/msal-browser/dist/navigation/NavigationClient.mjs
var NavigationClient = class _NavigationClient {
  /**
   * Navigates to other pages within the same web application
   * @param url
   * @param options
   */
  navigateInternal(url, options) {
    return _NavigationClient.defaultNavigateWindow(url, options);
  }
  /**
   * Navigates to other pages outside the web application i.e. the Identity Provider
   * @param url
   * @param options
   */
  navigateExternal(url, options) {
    return _NavigationClient.defaultNavigateWindow(url, options);
  }
  /**
   * Default navigation implementation invoked by the internal and external functions
   * @param url
   * @param options
   */
  static defaultNavigateWindow(url, options) {
    if (options.noHistory) {
      window.location.replace(url);
    } else {
      window.location.assign(url);
    }
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(createBrowserAuthError(timedOut, "failed_to_redirect"));
      }, options.timeout);
    });
  }
};

// ../../node_modules/@azure/msal-browser/dist/network/FetchClient.mjs
var FetchClient = class {
  /**
   * Fetch Client for REST endpoints - Get request
   * @param url
   * @param headers
   * @param body
   */
  async sendGetRequestAsync(url, options) {
    let response;
    let responseHeaders = {};
    let responseStatus = 0;
    const reqHeaders = getFetchHeaders(options);
    try {
      response = await fetch(url, {
        method: HTTP_REQUEST_TYPE.GET,
        headers: reqHeaders
      });
    } catch (e) {
      throw createNetworkError(createBrowserAuthError(window.navigator.onLine ? getRequestFailed : noNetworkConnectivity2), void 0, void 0, e);
    }
    responseHeaders = getHeaderDict(response.headers);
    try {
      responseStatus = response.status;
      return {
        headers: responseHeaders,
        body: await response.json(),
        status: responseStatus
      };
    } catch (e) {
      throw createNetworkError(createBrowserAuthError(failedToParseResponse), responseStatus, responseHeaders, e);
    }
  }
  /**
   * Fetch Client for REST endpoints - Post request
   * @param url
   * @param headers
   * @param body
   */
  async sendPostRequestAsync(url, options) {
    const reqBody = options && options.body || "";
    const reqHeaders = getFetchHeaders(options);
    let response;
    let responseStatus = 0;
    let responseHeaders = {};
    try {
      response = await fetch(url, {
        method: HTTP_REQUEST_TYPE.POST,
        headers: reqHeaders,
        body: reqBody
      });
    } catch (e) {
      throw createNetworkError(createBrowserAuthError(window.navigator.onLine ? postRequestFailed2 : noNetworkConnectivity2), void 0, void 0, e);
    }
    responseHeaders = getHeaderDict(response.headers);
    try {
      responseStatus = response.status;
      return {
        headers: responseHeaders,
        body: await response.json(),
        status: responseStatus
      };
    } catch (e) {
      throw createNetworkError(createBrowserAuthError(failedToParseResponse), responseStatus, responseHeaders, e);
    }
  }
};
function getFetchHeaders(options) {
  try {
    const headers = new Headers();
    if (!(options && options.headers)) {
      return headers;
    }
    const optionsHeaders = options.headers;
    Object.entries(optionsHeaders).forEach(([key, value]) => {
      headers.append(key, value);
    });
    return headers;
  } catch (e) {
    throw createNetworkError(createBrowserAuthError(failedToBuildHeaders), void 0, void 0, e);
  }
}
function getHeaderDict(headers) {
  try {
    const headerDict = {};
    headers.forEach((value, key) => {
      headerDict[key] = value;
    });
    return headerDict;
  } catch (e) {
    throw createBrowserAuthError(failedToParseHeaders);
  }
}

// ../../node_modules/@azure/msal-browser/dist/config/Configuration.mjs
var DEFAULT_POPUP_TIMEOUT_MS = 6e4;
var DEFAULT_IFRAME_TIMEOUT_MS = 1e4;
var DEFAULT_REDIRECT_TIMEOUT_MS = 3e4;
var DEFAULT_NATIVE_BROKER_HANDSHAKE_TIMEOUT_MS = 2e3;
function buildConfiguration({ auth: userInputAuth, cache: userInputCache, system: userInputSystem, experimental: userInputExperimental, telemetry: userInputTelemetry }, isBrowserEnvironment) {
  const DEFAULT_AUTH_OPTIONS = {
    clientId: "",
    authority: `${Constants_exports.DEFAULT_AUTHORITY}`,
    knownAuthorities: [],
    cloudDiscoveryMetadata: "",
    authorityMetadata: "",
    redirectUri: typeof window !== "undefined" && window.location ? window.location.href.split("?")[0].split("#")[0] : "",
    postLogoutRedirectUri: "",
    clientCapabilities: [],
    OIDCOptions: {
      responseMode: Constants_exports.ResponseMode.FRAGMENT,
      defaultScopes: [
        Constants_exports.OPENID_SCOPE,
        Constants_exports.PROFILE_SCOPE,
        Constants_exports.OFFLINE_ACCESS_SCOPE
      ]
    },
    azureCloudOptions: {
      azureCloudInstance: AzureCloudInstance.None,
      tenant: ""
    },
    instanceAware: false,
    isMcp: false,
    verifySSO: false
  };
  const DEFAULT_CACHE_OPTIONS = {
    cacheLocation: BrowserCacheLocation.SessionStorage,
    cacheRetentionDays: 5
  };
  const DEFAULT_LOGGER_OPTIONS = {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    loggerCallback: () => {
    },
    logLevel: LogLevel.Info,
    piiLoggingEnabled: false
  };
  const DEFAULT_BROWSER_SYSTEM_OPTIONS = __spreadProps(__spreadValues({}, DEFAULT_SYSTEM_OPTIONS), {
    loggerOptions: DEFAULT_LOGGER_OPTIONS,
    networkClient: isBrowserEnvironment ? new FetchClient() : StubbedNetworkModule,
    navigationClient: new NavigationClient(),
    popupBridgeTimeout: userInputSystem?.popupBridgeTimeout || DEFAULT_POPUP_TIMEOUT_MS,
    iframeBridgeTimeout: userInputSystem?.iframeBridgeTimeout || DEFAULT_IFRAME_TIMEOUT_MS,
    redirectNavigationTimeout: DEFAULT_REDIRECT_TIMEOUT_MS,
    allowRedirectInIframe: false,
    navigatePopups: true,
    allowPlatformBroker: false,
    nativeBrokerHandshakeTimeout: userInputSystem?.nativeBrokerHandshakeTimeout || DEFAULT_NATIVE_BROKER_HANDSHAKE_TIMEOUT_MS,
    protocolMode: ProtocolMode.AAD
  });
  const providedSystemOptions = __spreadProps(__spreadValues(__spreadValues({}, DEFAULT_BROWSER_SYSTEM_OPTIONS), userInputSystem), {
    loggerOptions: userInputSystem?.loggerOptions || DEFAULT_LOGGER_OPTIONS
  });
  const DEFAULT_TELEMETRY_OPTIONS2 = {
    application: {
      appName: "",
      appVersion: ""
    },
    client: new StubPerformanceClient()
  };
  const DEFAULT_EXPERIMENTAL_OPTIONS = {
    iframeTimeoutTelemetry: false,
    allowPlatformBrokerWithDOM: false
  };
  if (userInputSystem?.protocolMode !== ProtocolMode.OIDC && userInputAuth?.OIDCOptions) {
    const logger = new Logger(providedSystemOptions.loggerOptions);
    logger.warning(JSON.stringify(createClientConfigurationError(ClientConfigurationErrorCodes_exports.cannotSetOIDCOptions)), "");
  }
  if (userInputSystem?.protocolMode && userInputSystem.protocolMode === ProtocolMode.OIDC && providedSystemOptions?.allowPlatformBroker) {
    throw createClientConfigurationError(ClientConfigurationErrorCodes_exports.cannotAllowPlatformBroker);
  }
  const overlayedConfig = {
    auth: __spreadProps(__spreadValues(__spreadValues({}, DEFAULT_AUTH_OPTIONS), userInputAuth), {
      OIDCOptions: __spreadValues(__spreadValues({}, DEFAULT_AUTH_OPTIONS.OIDCOptions), userInputAuth?.OIDCOptions)
    }),
    cache: __spreadValues(__spreadValues({}, DEFAULT_CACHE_OPTIONS), userInputCache),
    system: providedSystemOptions,
    experimental: __spreadValues(__spreadValues({}, DEFAULT_EXPERIMENTAL_OPTIONS), userInputExperimental),
    telemetry: __spreadValues(__spreadValues({}, DEFAULT_TELEMETRY_OPTIONS2), userInputTelemetry)
  };
  return overlayedConfig;
}

// ../../node_modules/@azure/msal-browser/dist/cache/CacheKeys.mjs
var PREFIX = "msal";
var BROWSER_PREFIX = "browser";
var CACHE_KEY_SEPARATOR2 = "|";
var CREDENTIAL_SCHEMA_VERSION = 3;
var ACCOUNT_SCHEMA_VERSION = 3;
var LOG_LEVEL_CACHE_KEY = `${PREFIX}.${BROWSER_PREFIX}.log.level`;
var LOG_PII_CACHE_KEY = `${PREFIX}.${BROWSER_PREFIX}.log.pii`;
var BROWSER_PERF_ENABLED_KEY = `${PREFIX}.${BROWSER_PREFIX}.performance.enabled`;
var VERSION_CACHE_KEY = `${PREFIX}.version`;
var ACCOUNT_KEYS = "account.keys";
var TOKEN_KEYS = "token.keys";
var SSO_CAPABLE = `${PREFIX}.${BROWSER_PREFIX}.sso.capable`;
function getAccountKeysCacheKey(schema = ACCOUNT_SCHEMA_VERSION) {
  if (schema < 1) {
    return `${PREFIX}.${ACCOUNT_KEYS}`;
  }
  return `${PREFIX}.${schema}.${ACCOUNT_KEYS}`;
}
function getTokenKeysCacheKey(clientId, schema = CREDENTIAL_SCHEMA_VERSION) {
  if (schema < 1) {
    return `${PREFIX}.${TOKEN_KEYS}.${clientId}`;
  }
  return `${PREFIX}.${schema}.${TOKEN_KEYS}.${clientId}`;
}

export {
  Constants_exports,
  AADServerParamKeys_exports,
  AuthError,
  createAuthError,
  ClientConfigurationError,
  createClientConfigurationError,
  StringUtils,
  ClientAuthError,
  createClientAuthError,
  ClientConfigurationErrorCodes_exports,
  ClientAuthErrorCodes_exports,
  ScopeSet,
  RequestParameterBuilder_exports,
  UrlUtils_exports,
  DEFAULT_CRYPTO_IMPLEMENTATION,
  LogLevel,
  Logger,
  AzureCloudInstance,
  buildTenantProfile,
  updateAccountTenantProfileData,
  AuthToken_exports,
  UrlString,
  CacheErrorCodes_exports,
  CacheError,
  createCacheError,
  AuthorityType,
  getTenantIdFromIdTokenClaims,
  ProtocolMode,
  AccountEntityUtils_exports,
  CacheManager,
  StubPerformanceClient,
  TimeUtils_exports,
  CacheHelpers_exports,
  PerformanceEvents_exports,
  invoke,
  invokeAsync,
  PopTokenGenerator,
  InteractionRequiredAuthErrorCodes_exports,
  InteractionRequiredAuthError,
  createInteractionRequiredAuthError,
  ServerError,
  ProtocolUtils_exports,
  ResponseHandler,
  buildAccountToCache,
  CcsCredentialType,
  getRequestThumbprint,
  ThrottlingUtils,
  Authority,
  buildStaticAuthorityOptions,
  AuthorityFactory_exports,
  AuthorizationCodeClient,
  RefreshTokenClient,
  SilentFlowClient,
  Authorize_exports,
  enforceResourceParameter,
  AuthenticationHeaderParser,
  AuthErrorCodes_exports,
  ServerTelemetryManager,
  JoseHeader,
  PerformanceClient,
  AcquireTokenFromCache,
  AcquireTokenByRefreshToken,
  AcquireTokenSilentAsync,
  CryptoOptsGetPublicKeyThumbprint,
  CryptoOptsSignJwt,
  SilentCacheClientAcquireToken,
  SilentIframeClientAcquireToken,
  AwaitConcurrentIframe,
  SilentRefreshClientAcquireToken,
  StandardInteractionClientGetDiscoveredAuthority,
  NativeInteractionClientAcquireToken,
  NativeInteractionClientAcquireTokenRedirect,
  RefreshTokenClientAcquireTokenByRefreshToken,
  AcquireTokenBySilentIframe,
  InitializeBaseRequest,
  InitializeSilentRequest,
  InitializeCache,
  SilentIframeClientTokenHelper,
  SilentHandlerInitiateAuthRequest,
  SilentHandlerMonitorIframeForHash,
  SilentHandlerLoadFrameSync,
  StandardInteractionClientCreateAuthCodeClient,
  StandardInteractionClientGetClientConfiguration,
  StandardInteractionClientInitializeAuthorizationRequest,
  SilentFlowClientAcquireCachedToken,
  GetStandardParams,
  HandleCodeResponse,
  HandleResponseEar,
  HandleResponsePlatformBroker,
  HandleResponseCode,
  AuthClientAcquireToken,
  DeserializeResponse,
  AuthorityFactoryCreateDiscoveredInstance,
  AcquireTokenByCodeAsync,
  HandleRedirectPromiseMeasurement,
  HandleNativeRedirectPromiseMeasurement,
  NativeMessageHandlerHandshake,
  RemoveHiddenIframe,
  ImportExistingCache,
  GeneratePkceCodes,
  GenerateCodeVerifier,
  GenerateCodeChallengeFromVerifier,
  Sha256Digest,
  GetRandomValues,
  GenerateHKDF,
  GenerateBaseKey,
  Base64Decode,
  UrlEncodeArr,
  Encrypt,
  Decrypt,
  GenerateEarKey,
  DecryptEarResponse,
  LoadAccount,
  LoadIdToken,
  LoadAccessToken,
  LoadRefreshToken,
  getDefaultErrorMessage2 as getDefaultErrorMessage,
  BrowserAuthError,
  createBrowserAuthError,
  BrowserConstants,
  PlatformAuthConstants,
  NativeExtensionMethod,
  BrowserCacheLocation,
  INTERACTION_TYPE,
  TemporaryCacheKeys,
  InMemoryCacheKeys,
  ApiId,
  apiIdToName,
  InteractionType,
  InteractionStatus,
  DEFAULT_REQUEST,
  WrapperSKU,
  DB_NAME,
  DB_VERSION,
  DB_TABLE_NAME,
  CacheLookupPolicy,
  iFrameRenewalPolicies,
  urlEncode,
  urlEncodeArr,
  base64Encode,
  pkceNotCreated,
  earJwkEmpty,
  earJweEmpty,
  emptyNavigateUri,
  hashEmptyError,
  noStateInHash,
  hashDoesNotContainKnownProperties,
  unableToParseState,
  stateInteractionTypeMismatch,
  interactionInProgress,
  popupWindowError,
  emptyWindowError,
  userCancelled,
  silentLogoutUnsupported,
  noAccountError,
  noTokenRequestCacheError,
  unableToParseTokenRequestCacheError,
  databaseNotOpen,
  noNetworkConnectivity2 as noNetworkConnectivity,
  unableToLoadToken,
  cryptoKeyNotFound,
  authCodeRequired,
  authCodeOrNativeAccountIdRequired,
  spaCodeAndNativeAccountIdPresent,
  databaseUnavailable,
  unableToAcquireTokenFromNativePlatform,
  nativeHandshakeTimeout,
  nativeExtensionNotInstalled,
  nativeConnectionNotEstablished,
  uninitializedPublicClientApplication,
  nativePromptNotSupported,
  invalidPopTokenRequest,
  timedOut,
  BrowserAuthErrorCodes_exports,
  base64Decode,
  base64DecToArr,
  validateCryptoAvailable,
  sha256Digest,
  getRandomValues,
  createNewGuid,
  generateKeyPair,
  exportJwk,
  importJwk,
  sign,
  generateEarKey,
  decryptEarResponse,
  generateBaseKey,
  generateHKDF,
  encrypt,
  decrypt,
  hashString,
  BrowserConfigurationAuthError,
  createBrowserConfigurationAuthError,
  storageNotSupported,
  stubbedPublicClientApplicationCalled,
  BrowserConfigurationAuthErrorCodes_exports,
  parseAuthResponseFromUrl,
  clearHash,
  replaceHash,
  isInIframe,
  cancelPendingBridgeResponse,
  waitForBridgeResponse,
  getCurrentUri,
  getHomepage,
  blockNonBrowserEnvironment,
  blockAPICallsBeforeInitialize,
  preflightCheck,
  redirectPreflightCheck,
  preconnect,
  createGuid,
  BrowserUtils_exports,
  NavigationClient,
  DEFAULT_IFRAME_TIMEOUT_MS,
  DEFAULT_REDIRECT_TIMEOUT_MS,
  DEFAULT_NATIVE_BROKER_HANDSHAKE_TIMEOUT_MS,
  buildConfiguration,
  PREFIX,
  CACHE_KEY_SEPARATOR2 as CACHE_KEY_SEPARATOR,
  CREDENTIAL_SCHEMA_VERSION,
  ACCOUNT_SCHEMA_VERSION,
  LOG_LEVEL_CACHE_KEY,
  LOG_PII_CACHE_KEY,
  BROWSER_PERF_ENABLED_KEY,
  VERSION_CACHE_KEY,
  SSO_CAPABLE,
  getAccountKeysCacheKey,
  getTokenKeysCacheKey
};
//# sourceMappingURL=chunk-ILSSUSQM.js.map
