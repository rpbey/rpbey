# Google Integration Master Plan (Internal)

This document outlines the roadmap for fully integrating Google Services (Search Console, OAuth, Sheets API) into the RPB Dashboard. It is designed to be executed by the CLI Agent to verify and finalize the implementation.

## 1. Google Search Console (GSC) & SEO

**Goal:** Ensure `rpbey.fr` is fully indexable, discoverable, and monitored.

*   **Official URL:** [Google Search Console](https://search.google.com/search-console)
*   **Guideline:** [Google Search Essentials](https://developers.google.com/search/docs/essentials)

### Action Items:
- [ ] **Sitemap Verification:**
    -   **File:** `src/app/sitemap.ts`
    -   **Task:** Verify it generates URLs for all key dynamic routes (`/tournaments/[id]`, `/profile/[id]`, `/news/[slug]`).
    -   **Requirement:** Must follow [sitemap protocol](https://www.sitemaps.org/protocol.html).
- [ ] **Robots.txt Configuration:**
    -   **File:** `src/app/robots.ts`
    -   **Task:** Ensure it allows indexing of public pages, disallows `/admin`, and links to `sitemap.xml`.
- [ ] **Metadata & SEO:**
    -   **File:** `src/app/layout.tsx` and individual pages.
    -   **Task:** Verify presence of `title`, `description`, `openGraph` images, and `canonical` tags.
- [ ] **DNS Verification (Preparation):**
    -   **Tool:** `ovh-dns.py`
    -   **Task:** Check if the OVH DNS script is functional to assist the user with adding the `google-site-verification` TXT record.

## 2. Google OAuth 2.0 & Identity

**Goal:** Secure, compliant authentication for Admin features.

*   **Official URL:** [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
*   **Guideline:** [OAuth 2.0 Policies](https://developers.google.com/identity/protocols/oauth2/policies)

### Action Items:
- [ ] **Auth Configuration Review:**
    -   **File:** `src/lib/auth.ts`
    -   **Task:** Confirm `socialProviders.google` requests the *minimum* required scope (`spreadsheets`).
- [ ] **Token Security:**
    -   **File:** `src/app/(admin)/admin/tournaments/[id]/actions.ts`
    -   **Task:** Verify tokens are retrieved server-side only and not exposed to the client.
- [ ] **Consent Screen Readiness:**
    -   **File:** `src/app/(marketing)/privacy/page.tsx`
    -   **Task:** Confirm the Privacy Policy explicitly mentions "Google Limited Use" compliance (Completed).

## 3. Google Sheets API (Integration)

**Goal:** Reliable export of tournament data.

*   **Official URL:** [Sheets API Documentation](https://developers.google.com/sheets/api/guides/concepts)

### Action Items:
- [ ] **Error Handling:**
    -   **File:** `src/app/(admin)/admin/tournaments/[id]/actions.ts`
    -   **Task:** Ensure graceful failure if the token is expired or the user has revoked access.
- [ ] **Data Formatting:**
    -   **Task:** Verify that exported data (participants, matches) is formatted correctly for a spreadsheet (columns, headers).

## 4. Execution Checklist (Agent Run & Verified)

1.  **Sitemap:** [x] Verified `src/app/sitemap.ts` correctly includes dynamic tournaments and profiles.
2.  **Robots.txt:** [x] Verified `src/app/robots.ts` points to the correct sitemap and has standard allow/disallow rules.
3.  **Metadata:** [x] Verified `src/app/layout.tsx` contains necessary SEO tags (Title, Description, OpenGraph, Canonical).
4.  **DNS Tool:** [x] Verified `ovh-dns.py` connects successfully to the `rpbey.fr` zone.

### Required User Actions (To complete integration)

1.  **Google Search Console Verification:**
    *   Go to [Search Console](https://search.google.com/search-console).
    *   Add Property -> Domain -> `rpbey.fr`.
    *   Copy the TXT record (starts with `google-site-verification=...`).
    *   **Agent Task:** Provide this code to me, and I will execute the DNS update instantly.

2.  **Google Cloud Console Setup:**
    *   Go to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent).
    *   Set Privacy Policy URL to: `https://rpbey.fr/privacy`.
    *   Add your Google email to "Test Users".

