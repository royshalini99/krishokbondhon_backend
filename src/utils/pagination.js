/**
 * Simple offset-based cursor, base64-encoded so the client treats it as an
 * opaque string (per API_CONTRACT.md). Encoding {"offset": 20} produces
 * exactly the example cursor shown in that doc, so the Flutter app and
 * this backend agree on the format without either side special-casing it.
 */

function encodeCursor(offset) {
  return Buffer.from(JSON.stringify({ offset })).toString('base64');
}

function decodeCursor(cursor) {
  if (!cursor) return { offset: 0 };
  try {
    const json = Buffer.from(cursor, 'base64').toString('utf8');
    const parsed = JSON.parse(json);
    return { offset: Number(parsed.offset) || 0 };
  } catch {
    return { offset: 0 };
  }
}

/**
 * Runs a Mongoose query with offset/limit and returns the paginated
 * envelope shape the app expects: { items, nextCursor, hasMore }.
 */
async function paginate(query, { cursor, limit = 20 }) {
  const { offset } = decodeCursor(cursor);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);

  // Fetch one extra item to cheaply know whether there's a next page.
  const items = await query.clone().skip(offset).limit(safeLimit + 1);
  const hasMore = items.length > safeLimit;
  const page = hasMore ? items.slice(0, safeLimit) : items;

  return {
    items: page,
    nextCursor: hasMore ? encodeCursor(offset + safeLimit) : null,
    hasMore,
  };
}

module.exports = { encodeCursor, decodeCursor, paginate };
