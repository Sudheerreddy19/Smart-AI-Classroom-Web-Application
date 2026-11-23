import { httpClient } from './httpClient'

/**
 * AI API — wraps all Stage 2, 3, and 4 backend endpoints.
 *
 * Endpoints (all require JWT except where noted):
 *   POST /api/ai/chat                        → { answer, sessionId, queryId }
 *   GET  /api/ai/provider-status             → { provider, model, status }
 *   POST /api/knowledge/upload               → { id, title, status } (TEACHER/ADMIN only)
 *   GET  /api/knowledge/documents            → Page<KnowledgeDocumentResponse>
 *   DELETE /api/knowledge/documents/{id}     → 204
 *   POST /api/knowledge/documents/{id}/reindex → { status }
 *   GET  /api/ai/tools/sensors/{classroomId} → sensor readings map
 *   GET  /api/ai/tools/timetable/{classroomId} → timetable info
 *   GET  /api/ai/tools/attendance/{classroomId} → aggregate attendance
 *
 * PRIVACY: Never attach student names, roll numbers, or per-student data to any call.
 */

// ── Chat ────────────────────────────────────────────────────────────────────

export const aiChatApi = {
  /**
   * Send a question to JARVIS (routes through Gemini + RAG + tools on the backend).
   * @param {string} question
   * @param {number|null} classroomId  – optional, helps tool routing
   * @returns {Promise<{ answer: string, sessionId: number, queryId: number, citations?: object[] }>}
   */
  ask: (question, classroomId = null) =>
    httpClient.post('/api/ai/chat', {
      question,
      ...(classroomId ? { classroomId } : {}),
    }),

  /** Provider health check — no auth required on this endpoint. */
  providerStatus: () => httpClient.get('/api/ai/provider-status'),

  /** Paginated chat session history. */
  getSessions: (page = 0, size = 10) =>
    httpClient.get('/api/ai/sessions', { params: { page, size } }),
}

// ── Knowledge base ───────────────────────────────────────────────────────────

export const knowledgeApi = {
  /**
   * Upload a PDF or TXT document. TEACHER / ADMIN only.
   * Sends as multipart/form-data.
   * @param {File} file
   * @param {string} title
   * @param {string|null} visibleToRole  – optional, e.g. "STUDENT"
   * @returns {Promise<{ id, title, status, message }>}
   */
  upload: (file, title, visibleToRole = null) => {
    const form = new FormData()
    form.append('file', file)
    form.append('title', title)
    if (visibleToRole) form.append('visibleToRole', visibleToRole)
    return httpClient.post('/api/knowledge/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // large files / extraction can be slow
    })
  },

  /**
   * List all documents visible to the caller.
   */
  listDocuments: (page = 0, size = 20) =>
    httpClient.get('/api/knowledge/documents', { params: { page, size } }),

  /**
   * Delete a document and all its chunks.
   * @param {number} id
   */
  deleteDocument: (id) => httpClient.delete(`/api/knowledge/documents/${id}`),

  /**
   * Re-index a document (re-embed after model change).
   * @param {number} id
   */
  reindex: (id) => httpClient.post(`/api/knowledge/documents/${id}/reindex`),

  /**
   * Semantic search across the knowledge base.
   * @param {string} query
   * @param {number} topK
   */
  search: (query, topK = 5) =>
    httpClient.get('/api/knowledge/search', { params: { query, topK } }),
}

// ── Classroom tools (Stage 4) ─────────────────────────────────────────────────

export const classroomToolsApi = {
  /** Live sensor readings for a classroom. */
  getSensors: (classroomId) =>
    httpClient.get(`/api/ai/tools/sensors/${classroomId}`),

  /** Current timetable slot for a classroom. */
  getTimetable: (classroomId) =>
    httpClient.get(`/api/ai/tools/timetable/${classroomId}`),

  /**
   * Aggregate-only attendance summary (no student PII).
   * @param {number} classroomId
   * @param {string|null} date  – ISO date string e.g. "2024-11-01", null = today
   */
  getAttendanceSummary: (classroomId, date = null) =>
    httpClient.get(`/api/ai/tools/attendance/${classroomId}`, {
      params: date ? { date } : {},
    }),

  /** Device status for a classroom. */
  getDeviceStatus: (classroomId) =>
    httpClient.get(`/api/ai/tools/devices/${classroomId}`),
}
