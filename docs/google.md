# Google Cloud Platform (GCP) Integration for Node.js

This document provides an overview of integrating Google Cloud services into this Node.js application, focusing on authentication methods and environment configuration.

## 1. Client Libraries

Google provides idiomatic Node.js client libraries for interacting with its services. These libraries handle low-level details like authentication, retries, and pagination.

### Core Authentication

*   **google-auth-library**: The primary library for handling OAuth 2.0, Application Default Credentials, and service account authentication.
    *   *Context7 ID:* `/googleapis/google-auth-library-nodejs`

**Installation:**

```bash
pnpm add google-auth-library
```

## 2. Authentication

Google Cloud uses **Application Default Credentials (ADC)** to automatically find and verify credentials. This allows your code to run seamlessly in both local development and production environments without changing the authentication logic.

### Local Development

1.  **gcloud CLI (Recommended):**
    If you have the Google Cloud CLI installed, you can login with your user account. This creates a local credential file that ADC detects.
    ```bash
    gcloud auth application-default login
    ```

2.  **Service Account Key (Alternative):**
    If you need to impersonate a specific service account:
    *   Create a Service Account in the GCP Console.
    *   Download the JSON key file.
    *   Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the **absolute path** of this file.

    ```bash
    export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
    ```

### Production (Cloud Run, App Engine, GKE)

Do **not** use JSON key files in production if possible. Instead, attach a **Service Account** to your compute resource (e.g., the Cloud Run service or VM).
*   Grant this Service Account the necessary IAM roles for the services you intend to use.
*   The client libraries will automatically detect and use these attached credentials via the metadata server.

## 3. Environment Configuration

### Required Environment Variables

When using a Service Account Key (standard for local dev or external servers):

*   **`GOOGLE_APPLICATION_CREDENTIALS`**: Absolute path to your JSON key file.
*   **`GOOGLE_CLOUD_PROJECT`**: (Optional but recommended) The ID of your GCP project.

### .env Example

Add these to your `.env` file (ensure this file is in `.gitignore`!):

```env
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT="your-project-id-123"
GOOGLE_APPLICATION_CREDENTIALS="./secrets/google-service-account.json"
```

### Best Practices

1.  **Never commit JSON keys to Git.** Add `*.json` or specific paths like `secrets/` to your `.gitignore`.
2.  **Least Privilege:** Grant your Service Accounts only the specific IAM roles they need.
3.  **Versioning:** Pin your dependencies in `package.json` to avoid breaking changes.
