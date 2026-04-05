// Poster data for the swipe deck. These are SVG posters encoded as data URIs
// so they are bundled with the repo and require no external network requests.

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

export function makePosterDataUri(
  title: string,
  subtitle: string | undefined,
  colorA: string,
  colorB: string,
) {
  const w = 600;
  const h = 900;
  // NOTE: omit the XML prolog for better compatibility when inlining
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
        <stop offset='0' stop-color='${colorA}' />
        <stop offset='1' stop-color='${colorB}' />
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)' rx='18' ry='18' />
    <g transform='translate(32,32)'>
      <rect x='0' y='0' width='536' height='736' rx='12' ry='12' fill='rgba(255,255,255,0.06)' />
      <g transform='translate(24,24)'>
        <rect x='0' y='0' width='488' height='488' rx='6' ry='6' fill='rgba(0,0,0,0.12)' />
        <text x='244' y='540' text-anchor='middle' font-family='Inter, Arial, sans-serif' font-weight='700' font-size='32' fill='white'>${escapeXml(title)}</text>
        ${subtitle ? `<text x='244' y='580' text-anchor='middle' font-family='Inter, Arial, sans-serif' font-size='16' fill='rgba(255,255,255,0.9)'>${escapeXml(subtitle)}</text>` : ""}
      </g>
    </g>
  </svg>`;

  // Base64-encode the SVG for maximum compatibility (handles UTF-8 safely).
  // btoa expects a binary string, so use the standard UTF-8 -> binary shim.
  try {
    const base64 = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${base64}`;
  } catch (e) {
    // Fallback to URI-encoded form if btoa isn't available for some reason.
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}

export type PosterCard = {
  id: bigint;
  title: string;
  subtitle?: string;
  image: string; // data URI
};

// 7 cards: Dragon Age (Origins, II, Inquisition, The Veilguard) + Mass Effect (1,2,3)
export const posterCards: PosterCard[] = [
  {
    id: 100n,
    title: "Dragon Age: Origins",
    subtitle: "Dragon Age",
    image: makePosterDataUri(
      "Dragon Age: Origins",
      "Dragon Age",
      "#5b2c6f",
      "#d5603e",
    ),
  },
  {
    id: 101n,
    title: "Dragon Age II",
    subtitle: "Dragon Age",
    image: makePosterDataUri(
      "Dragon Age II",
      "Dragon Age",
      "#2b5876",
      "#4e4376",
    ),
  },
  {
    id: 102n,
    title: "Dragon Age: Inquisition",
    subtitle: "Dragon Age",
    image: makePosterDataUri(
      "Dragon Age: Inquisition",
      "Dragon Age",
      "#0f9b66",
      "#2b5876",
    ),
  },
  {
    id: 103n,
    title: "Dragon Age: The Veilguard",
    subtitle: "Dragon Age",
    image: makePosterDataUri(
      "Dragon Age: The Veilguard",
      "Dragon Age",
      "#3a1c71",
      "#d76d77",
    ),
  },
  {
    id: 200n,
    title: "Mass Effect",
    subtitle: "Mass Effect",
    image: makePosterDataUri(
      "Mass Effect",
      "Mass Effect",
      "#0f2027",
      "#203a43",
    ),
  },
  {
    id: 201n,
    title: "Mass Effect 2",
    subtitle: "Mass Effect",
    image: makePosterDataUri(
      "Mass Effect 2",
      "Mass Effect",
      "#1f1c2c",
      "#6f86d6",
    ),
  },
  {
    id: 202n,
    title: "Mass Effect 3",
    subtitle: "Mass Effect",
    image: makePosterDataUri(
      "Mass Effect 3",
      "Mass Effect",
      "#42275a",
      "#734b6d",
    ),
  },
];

export default posterCards;
