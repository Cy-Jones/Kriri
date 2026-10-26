const defaultDb = require("../config/database");

/**
 * Generates a clean, brand-compliant workspace slug following the pattern `kriri-xxx-xx`
 * Example:
 *   "Acme Corp" -> "kriri-acme-corp-01"
 *   "acme-corp-1" -> "kriri-acme-corp-01" (or "kriri-acme-corp-02" if 01 exists)
 *   "Software Development" -> "kriri-software-development-01"
 *   "🚀" -> "kriri-workspace-01"
 */
async function generateWorkspaceSlug(input, client = defaultDb) {
  let clean = (input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  if (!clean) {
    clean = "workspace";
  }

  // Strip leading "kriri-" if already prefixed
  if (clean.startsWith("kriri-")) {
    clean = clean.slice(6);
  }

  // Check if it ends with a number (e.g., acme-corp-1 or acme-corp-01)
  const trailingNumMatch = clean.match(/^(.*?)-(\d+)$/);
  let baseToken = clean;
  let preferredNum = 1;
  if (trailingNumMatch) {
    baseToken = trailingNumMatch[1] || "workspace";
    preferredNum = parseInt(trailingNumMatch[2], 10) || 1;
  }

  if (!baseToken) {
    baseToken = "workspace";
  }

  const baseSlug = `kriri-${baseToken}`;

  const res = await client.query(
    "SELECT slug FROM workspaces WHERE slug = $1 OR slug LIKE $2",
    [baseSlug, `${baseSlug}-%`],
  );
  const existing = new Set(res.rows.map((r) => r.slug));

  let counter = preferredNum;
  let candidate = `${baseSlug}-${String(counter).padStart(2, "0")}`;
  while (existing.has(candidate)) {
    counter++;
    candidate = `${baseSlug}-${String(counter).padStart(2, "0")}`;
  }
  return candidate;
}

module.exports = {
  generateWorkspaceSlug,
};
