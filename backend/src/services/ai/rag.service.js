const db = require("../../config/database");

/**
 * Portable Document Intelligence & RAG Service
 * Implements chunking, semantic similarity ranking, and grounded retrieval.
 */
class RagService {
  /**
   * Split document text into overlapping chunks
   */
  chunkText(text, chunkSize = 800, overlap = 150) {
    if (!text) return [];
    const chunks = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end).trim();
      if (chunk.length > 20) {
        chunks.push(chunk);
      }
      start += chunkSize - overlap;
    }
    return chunks;
  }

  /**
   * Compute a lightweight normalized semantic hash vector for resilient RAG search
   * (Operates reliably on any free-tier or offline environment without breaking)
   */
  generateSemanticVector(text, dimensions = 64) {
    const vector = new Array(dimensions).fill(0);
    const words = (text || "").toLowerCase().match(/\b[a-z0-9_]{2,}\b/g) || [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = (hash << 5) - hash + word.charCodeAt(j);
        hash |= 0;
      }
      const index = Math.abs(hash) % dimensions;
      vector[index] += 1;
    }

    // L2 Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map((v) => Number((v / magnitude).toFixed(6)));
  }

  /**
   * Cosine similarity between two float vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
    }
    return dot;
  }

  /**
   * Ingest and index a document into knowledge base
   */
  async ingestDocument({ workspaceId, projectId, userId, filename, mimeType, rawContent }) {
    if (!rawContent || !filename) {
      throw new Error("Document content and filename are required.");
    }

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Create document entry
      const docRes = await client.query(
        `INSERT INTO ai_documents (workspace_id, project_id, uploaded_by, filename, mime_type, file_size_bytes, processing_status, raw_content)
         VALUES ($1, $2, $3, $4, $5, $6, 'processing', $7) RETURNING *`,
        [workspaceId, projectId || null, userId, filename, mimeType, Buffer.byteLength(rawContent, "utf8"), rawContent]
      );
      const document = docRes.rows[0];

      // 2. Chunk text
      const chunks = this.chunkText(rawContent);

      // 3. Generate embeddings and store chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        const embedding = this.generateSemanticVector(chunkText);

        await client.query(
          `INSERT INTO ai_knowledge_chunks (document_id, workspace_id, project_id, source_type, source_id, chunk_index, content, embedding, token_count)
           VALUES ($1, $2, $3, 'document', $4, $5, $6, $7, $8)`,
          [
            document.id,
            workspaceId,
            projectId || null,
            filename,
            i,
            chunkText,
            JSON.stringify(embedding),
            Math.ceil(chunkText.length / 4),
          ]
        );
      }

      // 4. Mark document as indexed
      await client.query(
        "UPDATE ai_documents SET processing_status = 'indexed', chunk_count = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [chunks.length, document.id]
      );

      await client.query("COMMIT");
      return { documentId: document.id, chunksIndexed: chunks.length };
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Document ingestion error:", err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Search knowledge base using semantic cosine similarity
   */
  async retrieveContext({ workspaceId, projectId, query, topK = 4 }) {
    if (!query || !workspaceId) return [];

    const queryVec = this.generateSemanticVector(query);

    // Fetch chunks within active workspace scope
    let q = `SELECT c.id, c.document_id, c.content, c.embedding, c.metadata, d.filename
             FROM ai_knowledge_chunks c
             LEFT JOIN ai_documents d ON c.document_id = d.id
             WHERE c.workspace_id = $1`;
    const params = [workspaceId];

    if (projectId) {
      q += ` AND (c.project_id = $2 OR c.project_id IS NULL)`;
      params.push(projectId);
    }

    q += ` ORDER BY c.id DESC LIMIT 200`;

    const res = await db.query(q, params);
    const scored = res.rows
      .map((row) => {
        let embedding = row.embedding;
        if (typeof embedding === "string") {
          try {
            embedding = JSON.parse(embedding);
          } catch (e) {
            embedding = [];
          }
        }
        const score = this.cosineSimilarity(queryVec, embedding);
        return {
          id: row.id,
          filename: row.filename || "Project Knowledge",
          content: row.content,
          score,
        };
      })
      .filter((item) => item.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored;
  }
}

module.exports = new RagService();

