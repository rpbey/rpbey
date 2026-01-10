'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            textAlign: 'center',
            padding: '2rem',
            backgroundColor: '#000000',
            color: '#ffffff',
            background:
              'radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)',
          }}
        >
          <div
            style={{
              marginBottom: '2rem',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(220, 38, 38, 0.5)',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Icone d'erreur critique"
            >
              <title>Erreur Critique</title>
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              marginBottom: '1rem',
              background: 'linear-gradient(45deg, #dc2626, #fbbf24)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Erreur Critique
          </h1>
          <p
            style={{
              color: '#a3a3a3',
              marginBottom: '2rem',
              maxWidth: '500px',
              lineHeight: 1.6,
            }}
          >
            Une erreur inattendue a empêché le chargement de l&apos;application.
            L&apos;équipe technique a été notifiée.
          </p>
          {error.digest && (
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                marginBottom: '2rem',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                color: '#fbbf24',
                border: '1px solid rgba(251, 191, 36, 0.2)',
              }}
            >
              Code d&apos;erreur: {error.digest}
            </div>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              padding: '0.875rem 2rem',
              fontSize: '1rem',
              fontWeight: 600,
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 6px rgba(220, 38, 38, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#b91c1c';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onFocus={(e) => {
              e.currentTarget.style.backgroundColor = '#b91c1c';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Recharger la page
          </button>
        </div>
      </body>
    </html>
  );
}
