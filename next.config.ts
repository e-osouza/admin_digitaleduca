import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Todas as imagens da API passam pelo proxy de otimização dela (`/img`).
    // Assets locais de /public passam direto — ver o loader.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },
  experimental: {
    serverActions: {
      /*
       * O padrão é 1MB, e o formulário de conteúdo envia até três thumbnails
       * numa requisição só — estourava com facilidade. 12MB dá folga e ainda
       * fica abaixo do limite de 20MB que a API aceita no corpo.
       *
       * O vídeo NÃO passa por aqui: ele vai direto do browser para o Vimeo.
       */
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
