/**
 * Azure Active Directory / MSAL configuration
 * ─────────────────────────────────────────────
 * Fill in CLIENT_ID and TENANT_ID after registering the app in Azure AD:
 *
 *  1. portal.azure.com → Azure Active Directory → App registrations → New registration
 *  2. Name: "Platinum ERP"
 *  3. Supported account types: "Accounts in this organizational directory only"
 *  4. Redirect URI:  Single-page application (SPA) → http://localhost:5000
 *     (add https://<your-azure-app>.azurewebsites.net for production)
 *  5. After creation, copy the Application (client) ID  → CLIENT_ID below
 *                         Directory (tenant) ID         → TENANT_ID below
 *  6. API Permissions → Add:
 *       Microsoft Graph → Delegated → User.Read
 *       Microsoft Graph → Delegated → Sites.Read.All
 *       Microsoft Graph → Delegated → Sites.ReadWrite.All
 *       Microsoft Graph → Delegated → Files.ReadWrite.All
 *     Then "Grant admin consent"
 */

export const AZURE_AD = {
  CLIENT_ID : '183c6d74-53bc-48b7-9a6c-5d820b42efed',
  TENANT_ID : '7dff06d2-cfbb-4bda-9163-196da43edfa6',
  REDIRECT_URI: window.location.origin, // auto-resolves to localhost:5000 or Azure URL
};

/** Microsoft Graph scopes required by GraphService. */
export const GRAPH_SCOPES = [
  'User.Read',
  'Sites.Read.All',
  'Sites.ReadWrite.All',
  'Files.ReadWrite.All',
];
