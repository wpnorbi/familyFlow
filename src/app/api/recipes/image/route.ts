const ALLOWED_HOSTS = new Set([
  "cdn.recipes.lidl",
  "image-api.nosalty.hu",
]);

function fallbackImageResponse() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200" fill="none">
      <defs>
        <linearGradient id="bg" x1="140" y1="100" x2="1060" y2="1080" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FFF7EA"/>
          <stop offset="1" stop-color="#E9EFD9"/>
        </linearGradient>
        <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(870 280) rotate(135) scale(520 520)">
          <stop stop-color="#F3C185" stop-opacity="0.48"/>
          <stop offset="1" stop-color="#F3C185" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="1200" rx="72" fill="url(#bg)"/>
      <rect width="1200" height="1200" rx="72" fill="url(#glow)"/>
      <circle cx="600" cy="560" r="214" fill="#FFF9ED" stroke="#D9E3CC" stroke-width="30"/>
      <circle cx="600" cy="560" r="142" fill="#F6E4CB"/>
      <path d="M455 390c54-39 110-58 168-58 75 0 151 32 212 95" stroke="#7C916F" stroke-width="30" stroke-linecap="round"/>
      <path d="M462 742c46 36 93 54 141 54 84 0 159-33 225-99" stroke="#B98247" stroke-width="30" stroke-linecap="round"/>
      <path d="M402 252v157M467 252v157M532 252v157M467 409c0 32-26 58-58 58s-58-26-58-58" stroke="#374332" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M780 249c62 0 112 50 112 112v52c0 56-45 101-101 101h-23v159" stroke="#374332" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `.trim();

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return fallbackImageResponse();
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return fallbackImageResponse();
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return fallbackImageResponse();
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        "user-agent": "FamilyFlow/1.0",
      },
      cache: "force-cache",
    });

    if (!upstream.ok) {
      return fallbackImageResponse();
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    const arrayBuffer = await upstream.arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return fallbackImageResponse();
  }
}
