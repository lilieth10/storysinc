/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🚀 Configuración para desarrollo estable (SIN Turbopack)
  // NO incluimos experimental.turbo para usar webpack clásico

  // 📁 Configuración de paths
  trailingSlash: false,

  // 🎨 Configuración de imágenes
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "proogia.com",
        pathname: "/**",
      },
    ],
    formats: ["image/webp", "image/avif"],
    // Permitir SVG
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ⚡ Optimizaciones
  compress: true,

  // 🔧 Configuración de Webpack
  webpack: (config, { dev }) => {
    // Configuraciones adicionales si son necesarias
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    return config;
  },

  // 📝 Headers de seguridad
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
