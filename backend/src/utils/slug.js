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

  // Check if it ends with a sequential number (e.g., acme-corp-1 or acme-corp-01)
  const trailingNumMatch = clean.match(/^(.*?)-(\d{1,4})$/);
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
    if (counter > preferredNum + 100) {
      candidate = `${baseSlug}-${Date.now().toString(36)}`;
      break;
    }
  }
  return candidate;
}

function getUserIdentifierCode(name) {
  if (!name || typeof name !== "string") return "USR";
  const clean = name.trim();
  if (!clean) return "USR";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return parts.map((p) => p[0].toUpperCase()).slice(0, 3).join("");
  }
  return clean.slice(0, 3).toUpperCase() || "USR";
}

async function generateProjectSlug(name, workspace_id, client = defaultDb) {
  let baseSlug = (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  if (!baseSlug) baseSlug = "project";

  const res = await client.query(
    "SELECT slug FROM projects WHERE workspace_id = $1 AND slug LIKE $2",
    [workspace_id, `${baseSlug}%`],
  );
  const existingSlugs = new Set(res.rows.map((r) => r.slug));
  if (!existingSlugs.has(baseSlug)) return baseSlug;

  let counter = 1;
  while (existingSlugs.has(`${baseSlug}-${counter}`)) {
    counter++;
  }
  return `${baseSlug}-${counter}`;
}

async function generateProjectIdentifier(workspace_id, user_name, client = defaultDb) {
  const userCode = getUserIdentifierCode(user_name);
  const prefix = `KRI-${userCode}-`;

  const res = await client.query(
    "SELECT identifier FROM projects WHERE workspace_id = $1 AND identifier LIKE $2",
    [workspace_id, `${prefix}%`],
  );

  let maxNum = 0;
  for (const row of res.rows) {
    if (row.identifier) {
      const match = row.identifier.match(new RegExp(`^${prefix}(\\d+)$`));
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  return `${prefix}${maxNum + 1}`;
}

module.exports = {
  generateWorkspaceSlug,
  getUserIdentifierCode,
  generateProjectSlug,
  generateProjectIdentifier,
};
