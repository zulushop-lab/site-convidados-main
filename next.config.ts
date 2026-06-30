import path from 'node:path';
import type {NextConfig} from 'next';

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com",
  "connect-src 'self' https://accounts.google.com https://*.googleapis.com https://*.firebaseio.com https://*.firebasedatabase.app https://firebaseinstallations.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com wss://*.firebaseio.com ws://localhost:* http://localhost:*",
  "font-src 'self' data:",
  "media-src 'self' https://upload.wikimedia.org",
  "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),
  // firebase-admin tem require dinamico/binarios; deixa-lo external evita que o
  // bundling/coleta de page-data das rotas app/api/** (SPEC-PAYMENTS-MP) quebre.
  serverExternalPackages: ['firebase-admin'],
  async headers() {
    // A CSP rigida (sem 'unsafe-eval') so e emitida em producao. Em desenvolvimento
    // o Fast Refresh do Next (react-refresh-utils) usa eval(), que a CSP bloquearia,
    // deixando o app em tela branca. Producao nao usa eval, entao a CSP estrita vale la.
    if (process.env.NODE_ENV !== 'production') {
      return [];
    }

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
