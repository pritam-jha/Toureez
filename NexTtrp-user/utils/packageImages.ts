/**
 * @file utils/packageImages.ts
 * @description Destination photo lookup for package cards.
 *
 * Image priority order used by PackageCard and PackageListCard:
 *   1. Keyword-matched destination image  — always the correct location photo
 *   2. Cloudinary cover_image from the DB — only used if no keyword matches
 *   3. PACKAGE_DEFAULT_IMAGE             — absolute last resort, never blank
 *
 * Rules are evaluated top-to-bottom; first keyword hit wins.
 * The searchable string is: title + city + state + category name + category label.
 *
 * All Unsplash photo IDs are verified (HTTP 200) and kept in sync with the
 * home-screen DESTINATION_IMAGE_RULES in app/(tabs)/index.tsx.
 */

interface PackageImageCandidate {
  title: string;
  location?: {
    city?: string;
    state?: string;
  };
  category?: {
    name?: string;
    label?: string;
  };
}

interface DestinationImageRule {
  keywords: string[];
  url: string;
}

/**
 * Absolute last-resort image — a vibrant generic India travel shot.
 * Verified HTTP 200 on Unsplash CDN.
 */
export const PACKAGE_DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1532664189809-02133fee698d?auto=format&fit=crop&w=900&q=80';

/**
 * Per-destination rules — most-specific first so narrow matches don't get
 * eclipsed by broader keyword lists (e.g. "pangong" before "ladakh").
 *
 * Each photo ID has been verified to return HTTP 200 from the Unsplash CDN.
 * IDs kept in sync with home-screen DESTINATION_IMAGE_RULES (app/(tabs)/index.tsx).
 */
const DESTINATION_IMAGE_RULES: DestinationImageRule[] = [
  // ── Ladakh / Leh / Pangong Lake / Bike Expedition ───────────────────────
  // Leh-Manali highway, Pangong blue waters, mountain vistas
  {
    keywords: [
      'ladakh', 'leh', 'pangong', 'nubra', 'zanskar',
      'bike expedition', 'bike trip', 'bike ride', 'leh manali',
    ],
    url: 'https://images.unsplash.com/photo-1673947692587-d39df79fa52c?auto=format&fit=crop&w=900&q=80',
  },

  // ── Kashmir / Srinagar / Dal Lake / Gulmarg / Pahalgam ──────────────────
  // Dal Lake houseboats, shikara rides, Gulmarg snow slopes, tulip gardens
  // NOTE: 'dal' alone is intentionally removed — too many false positives.
  {
    keywords: [
      'srinagar', 'kashmir', 'gulmarg', 'pahalgam',
      'dal lake', 'tulip garden', 'sonmarg',
    ],
    url: 'https://images.unsplash.com/photo-1768147765107-5eef8e032a62?auto=format&fit=crop&w=900&q=80',
  },

  // ── Kerala / Alleppey / Backwaters / Houseboat ──────────────────────────
  // Alleppey canals, Kerala houseboat, palm-lined backwaters
  {
    keywords: [
      'kerala', 'alleppey', 'alappuzha', 'backwater', 'backwaters',
      'kumarakom', 'munnar', 'wayanad', 'kovalam', 'varkala',
      'thekkady', 'kochi', 'cochin', 'trivandrum', 'thiruvananthapuram',
      'houseboat',
    ],
    url: 'https://images.unsplash.com/photo-1707893013488-51672ef83425?auto=format&fit=crop&w=900&q=80',
  },

  // ── Goa / Beach / Sunset ────────────────────────────────────────────────
  // Real Goa beach + sunset — never a monument, hill station, or wrong state
  {
    keywords: [
      'goa', 'calangute', 'baga', 'anjuna', 'panaji', 'panjim',
      'vasco', 'palolem', 'candolim', 'north goa', 'south goa',
    ],
    url: 'https://images.unsplash.com/photo-1757702244726-00198554c4a0?auto=format&fit=crop&w=900&q=80',
  },

  // ── Manali / Rohtang / Himachal Pradesh / Snow ──────────────────────────
  // Manali snow peaks, Rohtang Pass, Solang Valley
  {
    keywords: [
      'manali', 'rohtang', 'solang', 'kasol', 'kufri',
      'himachal', 'spiti', 'shimla', 'dharamsala', 'mcleod ganj',
    ],
    url: 'https://images.unsplash.com/photo-1722915767859-08a59870d70b?auto=format&fit=crop&w=900&q=80',
  },

  // ── Rajasthan / Jaipur / Udaipur / Jodhpur / Jaisalmer ─────────────────
  // Jaipur palace, Hawa Mahal, Thar desert — never Goa beach or wrong city
  {
    keywords: [
      'jaipur', 'rajasthan', 'udaipur', 'jodhpur', 'jaisalmer',
      'pushkar', 'thar', 'amber fort', 'hawa mahal', 'pink city',
      'city palace', 'mehrangarh',
    ],
    url: 'https://images.unsplash.com/photo-1743399112594-0843ea59e995?auto=format&fit=crop&w=900&q=80',
  },

  // ── Agra / Taj Mahal ────────────────────────────────────────────────────
  {
    keywords: ['agra', 'taj mahal', 'fatehpur sikri'],
    url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=900&q=80',
  },

  // ── Delhi / New Delhi ───────────────────────────────────────────────────
  {
    keywords: [
      'delhi', 'new delhi', 'india gate', 'old delhi',
      'connaught', 'qutub minar', 'red fort',
    ],
    url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=900&q=80',
  },

  // ── Mumbai / Bombay ─────────────────────────────────────────────────────
  {
    keywords: [
      'mumbai', 'bombay', 'gateway of india', 'marine drive',
      'juhu', 'bandra', 'colaba',
    ],
    url: 'https://images.unsplash.com/photo-1720151722527-706786f70a01?auto=format&fit=crop&w=900&q=80',
  },

  // ── Uttarakhand / Rishikesh / Haridwar / Char Dham ─────────────────────
  // Rishikesh suspension bridge over Ganges, Haridwar ghats
  // photo-1591017683286-9e65cba8d01b was HTTP 404 — replaced below (verified 200).
  {
    keywords: [
      'uttarakhand', 'rishikesh', 'haridwar', 'mussoorie', 'nainital',
      'dehradun', 'corbett', 'kedarnath', 'badrinath', 'char dham',
      'gangotri', 'yamunotri', 'auli',
    ],
    url: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=900&q=80',
  },

  // ── Andaman & Nicobar Islands ───────────────────────────────────────────
  {
    keywords: [
      'andaman', 'port blair', 'havelock', 'neil island',
      'radhanagar', 'andaman nicobar',
    ],
    url: 'https://images.unsplash.com/photo-1586500036706-41963de24d8b?auto=format&fit=crop&w=900&q=80',
  },

  // ── Varanasi / Banaras / UP Pilgrimage ──────────────────────────────────
  {
    keywords: [
      'varanasi', 'banaras', 'benares', 'ghats', 'kashi',
      'prayagraj', 'mathura', 'vrindavan', 'ayodhya',
    ],
    url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=900&q=80',
  },

  // ── Sikkim / Northeast India / Darjeeling ───────────────────────────────
  {
    keywords: [
      'sikkim', 'gangtok', 'darjeeling', 'northeast', 'meghalaya',
      'shillong', 'cherrapunji', 'kaziranga', 'assam',
    ],
    url: 'https://images.unsplash.com/photo-1544634076-a90160ddf44c?auto=format&fit=crop&w=900&q=80',
  },

  // ── Coorg / Ooty / South India Hill Stations ────────────────────────────
  {
    keywords: [
      'coorg', 'kodagu', 'ooty', 'udhagamandalam', 'kodaikanal',
      'mysore', 'karnataka',
    ],
    url: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&w=900&q=80',
  },
];

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
}

function buildSearchable(item: PackageImageCandidate): string {
  return normalizeText(
    [
      item.title,
      item.location?.city,
      item.location?.state,
      item.category?.name,
      item.category?.label,
    ]
      .filter(Boolean)
      .join(' '),
  );
}

/**
 * Returns a destination-matched Unsplash URL for this package, or **null**
 * if no rule fires.
 *
 * Use this to build the image priority list in package card components:
 *   1. getPackageKeywordImage(item)  — correct destination photo (or skip if null)
 *   2. Cloudinary cover_image        — only when keyword returns null
 *   3. PACKAGE_DEFAULT_IMAGE         — absolute last resort
 */
export function getPackageKeywordImage(
  item: PackageImageCandidate,
): string | null {
  const searchable = buildSearchable(item);
  const match = DESTINATION_IMAGE_RULES.find((rule) =>
    rule.keywords.some((keyword) => searchable.includes(keyword)),
  );
  return match?.url ?? null;
}

/**
 * Convenience wrapper — returns the keyword-matched URL or PACKAGE_DEFAULT_IMAGE.
 * Kept for backward compatibility; prefer getPackageKeywordImage in components
 * that need fine-grained fallback control.
 */
export function getPackageDestinationImage(
  item: PackageImageCandidate,
): string {
  return getPackageKeywordImage(item) ?? PACKAGE_DEFAULT_IMAGE;
}
