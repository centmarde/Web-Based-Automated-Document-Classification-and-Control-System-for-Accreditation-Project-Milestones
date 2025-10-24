import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthUserStore } from '@/stores/authUser'
import { supabase } from '@/lib/supabase'

// Types
export type Document = {
  id: number
  created_at: string
  user_id?: string
  status?: string
  title?: string
  contents?: string
  tags?: Record<string, unknown>
  attach_file?: string
  collaborators?: Record<string, unknown>
  current_version?: number
  version?: Record<string, unknown>
  last_edited_by?: string
  updated_at?: string
}

export type CreateDocumentInput = Omit<Document, 'id' | 'created_at'>

export type UpdateDocumentInput = Partial<Omit<Document, 'id' | 'created_at'>>

export const useDocumentsDataStore = defineStore('documentsData', () => {
  // State
  const documents = ref<Document[]>([])
  const currentDocument = ref<Document | undefined>(undefined)
  const loading = ref(false)
  const error = ref<string | undefined>(undefined)
  const userDocuments = ref<Document[]>([])
  const adminDocuments = ref<Document[]>([])
  const adminVersionItems = ref<Array<{
    documentId: number
    version: VersionEntry
    docTitle?: string
    ownerId?: string
  }>>([])

  // Types
  type DocumentStatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

  // Actions

  // Create a new document
  async function createDocument(documentData: CreateDocumentInput) {
    loading.value = true
    error.value = undefined

    try {
      const { data, error: supabaseError } = await supabase
        .from('documents')
        .insert([documentData])
        .select()
        .single()

      if (supabaseError) throw supabaseError

      if (data) {
        documents.value.push(data)
        return data
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create document'
      console.error('Error creating document:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Read all documents
  async function fetchDocuments() {
    loading.value = true
    error.value = undefined

    try {
      const { data, error: supabaseError } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (supabaseError) throw supabaseError

      if (data) {
        documents.value = data
        return data
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch documents'
      console.error('Error fetching documents:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Read a single document by ID
  async function fetchDocumentById(id: number) {
    loading.value = true
    error.value = undefined

    try {
      const { data, error: supabaseError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single()

      if (supabaseError) throw supabaseError

      if (data) {
        currentDocument.value = data
        return data
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch document'
      console.error('Error fetching document:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update a document
  async function updateDocument(id: number, updates: UpdateDocumentInput) {
    loading.value = true
    error.value = undefined

    try {
      const { data, error: supabaseError } = await supabase
        .from('documents')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (supabaseError) throw supabaseError

      if (data) {
        // Update in local state
        const index = documents.value.findIndex(doc => doc.id === id)
        if (index !== -1) {
          documents.value[index] = data
        }
        if (currentDocument.value?.id === id) {
          currentDocument.value = data
        }
        return data
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update document'
      console.error('Error updating document:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete a document
  async function deleteDocument(id: number) {
    loading.value = true
    error.value = undefined

    try {
      const { error: supabaseError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (supabaseError) throw supabaseError

      // Remove from local state
      documents.value = documents.value.filter(doc => doc.id !== id)
      if (currentDocument.value?.id === id) {
        currentDocument.value = undefined
      }

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete document'
      console.error('Error deleting document:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch documents by user ID
  async function fetchDocumentsByUserId(userId: string) {
    loading.value = true
    error.value = undefined

    try {
      const { data, error: supabaseError } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (supabaseError) throw supabaseError

      if (data) {
        return data
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch user documents'
      console.error('Error fetching user documents:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Convenience: Fetch documents for the currently authenticated user
  async function fetchDocumentsForCurrentUser() {
    loading.value = true
    error.value = undefined
    try {
      const authStore = useAuthUserStore()
      const uid = authStore.userData?.id
      if (!uid) {
        userDocuments.value = []
        return userDocuments.value
      }
      const data = await fetchDocumentsByUserId(uid)
      userDocuments.value = (data || []) as Document[]
      return userDocuments.value
    } catch (err) {
      // error is already set where applicable
      return []
    } finally {
      loading.value = false
    }
  }

  // UI helpers kept here for convenience/consistency
  function formatDocumentDate(dateString?: string) {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleString()
  }

  function openDocumentFile(url?: string) {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Trigger a browser download for a given public URL
  function downloadDocumentFile(url?: string, fileName?: string) {
    if (!url) return
    try {
      const link = document.createElement('a')
      link.href = url
      if (fileName) link.download = fileName
      link.rel = 'noopener'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      // Fallback to opening in a new tab
      openDocumentFile(url)
    }
  }

  // Derived lists for repository views
  const approvedDocuments = computed(() =>
    (documents.value || []).filter(d => (d.status || '').toLowerCase() === 'approved')
  )

  const approvedUserDocuments = computed(() =>
    (userDocuments.value || []).filter(d => (d.status || '').toLowerCase() === 'approved')
  )

  // Text search helper (title or status for now)
  function searchDocuments(list: Document[], query: string) {
    const q = (query || '').trim().toLowerCase()
    if (!q) return list
    return list.filter(d => {
      const title = (d.title || '').toLowerCase()
      const status = (d.status || '').toLowerCase()
      return title.includes(q) || status.includes(q)
    })
  }

  // Convenience fetch for repository: all docs + current user's docs
  async function fetchRepositoryData() {
    // Keep it simple: run sequentially; loading flag will toggle but UI remains correct
    await fetchDocuments()
    await fetchDocumentsForCurrentUser()
  }

  // ----- Versioning helpers -----
  type VersionEntry = {
    v: number
    file_url?: string
    title?: string
    contents?: string
    tags?: Record<string, unknown>
    status?: string
    notes?: string
    created_at?: string
    created_by?: string
  }

  function normalizeVersions(doc?: Document): VersionEntry[] {
    if (!doc || !doc.version) return []
    const ver = doc.version as unknown
    if (Array.isArray(ver)) return ver as VersionEntry[]
    if (typeof ver === 'object') {
      const vObj = ver as Record<string, any>
      // If no explicit numeric v, synthesize a proper first entry from document fields
      if (typeof (vObj as any).v !== 'number') {
        return [
          {
            v: (doc.current_version && doc.current_version > 0) ? doc.current_version : 1,
            file_url: doc.attach_file,
            title: doc.title,
            contents: doc.contents,
            tags: doc.tags as any,
            status: (doc.status || 'pending'),
            notes: 'Initial import',
            created_at: doc.created_at,
            created_by: doc.user_id,
          }
        ]
      }
      return [vObj as VersionEntry]
    }
    return []
  }

  function getDocumentFromState(id: number): Document | undefined {
    return documents.value.find(d => d.id === id) || (currentDocument.value?.id === id ? currentDocument.value : undefined)
  }

  async function fetchDocumentVersionsById(id: number): Promise<VersionEntry[]> {
    let doc = getDocumentFromState(id) || await fetchDocumentById(id)
    const versions = normalizeVersions(doc || undefined)
    // Seed initial version if missing but attach_file exists (migration path)
    if ((!versions || versions.length === 0) && doc && doc.attach_file) {
      await seedInitialVersionForDocument(id)
      doc = await fetchDocumentById(id)
      return normalizeVersions(doc || undefined)
    }
    return versions
  }

  async function createNewDocumentVersion(
    documentId: number,
    file?: File,
    metadata?: { title?: string; contents?: string; tags?: Record<string, unknown>; notes?: string }
  ) {
    loading.value = true
    error.value = undefined
    try {
      // Resolve current doc (from state or DB)
      const doc = (getDocumentFromState(documentId) || await fetchDocumentById(documentId)) as Document
      if (!doc) throw new Error('Document not found')

      // Compute next version number
      const nextV = (doc.current_version || 0) + 1

      // Upload file if provided
      let fileUrl: string | undefined = undefined
      if (file) {
        fileUrl = await uploadFile(file)
      }

      // Build new version entry
      const authStore = useAuthUserStore()
      const uid = authStore.userData?.id
      const nowIso = new Date().toISOString()
      const newEntry: VersionEntry = {
        v: nextV,
        file_url: fileUrl || doc.attach_file,
        title: metadata?.title ?? doc.title,
        contents: metadata?.contents ?? doc.contents,
        tags: metadata?.tags ?? (doc.tags as any),
        status: 'pending',
        notes: metadata?.notes,
        created_at: nowIso,
        created_by: uid,
      }

      const versions = normalizeVersions(doc)
      const newVersions = [...versions, newEntry]

      // Update document row to reflect the new pending version
      const updates: UpdateDocumentInput = {
        version: newVersions as unknown as Record<string, unknown>,
        current_version: nextV,
        attach_file: newEntry.file_url,
        status: 'pending',
        last_edited_by: uid,
        updated_at: nowIso,
        title: doc.title, // preserve current title unless explicitly changed later
      }

      if (metadata?.title) updates.title = metadata.title

      const updated = await updateDocument(documentId, updates)

      // Refresh convenient lists used by views
      await fetchRepositoryData()

      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create a new version'
      console.error('Error creating new document version:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create initial version entry for legacy documents that predate versioning
  async function seedInitialVersionForDocument(documentId: number) {
    const doc = (getDocumentFromState(documentId) || await fetchDocumentById(documentId)) as Document
    if (!doc) throw new Error('Document not found')
    const existing = normalizeVersions(doc)
    if (existing.length > 0) return existing

    if (!doc.attach_file) return []

    const vNum = doc.current_version && doc.current_version > 0 ? doc.current_version : 1
    const initial: VersionEntry = {
      v: vNum,
      file_url: doc.attach_file,
      title: doc.title,
      contents: doc.contents,
      tags: doc.tags as any,
      status: (doc.status || 'approved'),
      notes: 'Initial import',
      created_at: doc.created_at,
      created_by: doc.user_id,
    }

    const updates: UpdateDocumentInput = {
      version: [initial] as unknown as Record<string, unknown>,
      current_version: vNum,
      // keep status as-is; attach_file remains same
    }
    await updateDocument(documentId, updates)
    return [initial]
  }

  // Recompute document fields from versions (attach_file/status/current_version)
  async function recomputeDocumentFromVersions(documentId: number) {
    const doc = (getDocumentFromState(documentId) || await fetchDocumentById(documentId)) as Document
    if (!doc) return
    const versions = normalizeVersions(doc)
    if (!versions || versions.length === 0) return

    // Choose latest approved if any; else if any pending -> pending; else rejected
    const approvedSorted = versions
      .filter(v => (v.status || '').toLowerCase() === 'approved')
      .sort((a, b) => (b.v || 0) - (a.v || 0))
    const latestApproved = approvedSorted[0]

    let nextStatus: 'approved' | 'pending' | 'rejected' = 'rejected'
    if (latestApproved) nextStatus = 'approved'
    else if (versions.some(v => (v.status || '').toLowerCase() === 'pending')) nextStatus = 'pending'

    const updates: UpdateDocumentInput = {
      status: nextStatus,
      current_version: latestApproved ? latestApproved.v : doc.current_version,
      attach_file: latestApproved?.file_url || doc.attach_file,
      updated_at: new Date().toISOString(),
    }
    await updateDocument(documentId, updates)
  }

  // Helper: set status on the current (or latest) version entry
  async function setCurrentVersionStatus(documentId: number, status: 'approved' | 'rejected' | 'pending') {
    const doc = (getDocumentFromState(documentId) || await fetchDocumentById(documentId)) as Document
    if (!doc) return
    const versions = normalizeVersions(doc)
    if (!versions || versions.length === 0) return

    // Prefer explicitly tracked current_version; otherwise pick the highest version number
    let idx = -1
    if (doc.current_version) {
      idx = versions.findIndex(v => (v.v || 0) === doc.current_version)
    }
    if (idx === -1) {
      let maxV = -1
      versions.forEach((v, i) => {
        const vv = v.v || 0
        if (vv > maxV) {
          maxV = vv
          idx = i
        }
      })
    }
    if (idx < 0) return

    versions[idx] = { ...versions[idx], status }
    await updateDocument(documentId, {
      version: versions as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    })
  }

  // Fetch documents by status
  async function fetchDocumentsByStatus(status: string) {
    loading.value = true
    error.value = undefined

    try {
      const { data, error: supabaseError } = await supabase
        .from('documents')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (supabaseError) throw supabaseError

      if (data) {
        return data
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch documents by status'
      console.error('Error fetching documents by status:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Admin: Fetch documents for moderation based on status filter
  async function fetchAdminDocuments(filter: DocumentStatusFilter = 'pending') {
    loading.value = true
    error.value = undefined
    try {
      if (filter === 'all') {
        const data = await fetchDocuments()
        adminDocuments.value = (data || []) as Document[]
      } else {
        const data = await fetchDocumentsByStatus(filter)
        adminDocuments.value = (data || []) as Document[]
      }
      return adminDocuments.value
    } catch (err) {
      // error already set where applicable
      return []
    } finally {
      loading.value = false
    }
  }

  // Admin: Fetch version items (flattened per-version) by version status
  async function fetchAdminVersionItems(filter: DocumentStatusFilter = 'pending') {
    loading.value = true
    error.value = undefined
    try {
      // Fetch all documents; filtering after flatten to account for version-level status
      const allDocs = (await fetchDocuments()) as Document[]
      const items: Array<{ documentId: number; version: VersionEntry; docTitle?: string; ownerId?: string }> = []
      for (const d of allDocs || []) {
        let versions = normalizeVersions(d)
        // Seed initial if necessary for legacy docs
        if ((!versions || versions.length === 0) && d.attach_file) {
          versions = await seedInitialVersionForDocument(d.id)
        }
        for (const v of versions) {
          const st = (v.status || '').toLowerCase() as DocumentStatusFilter | ''
          if (filter === 'all' || st === filter) {
            items.push({ documentId: d.id, version: v, docTitle: d.title, ownerId: d.user_id })
          }
        }
      }
      // Sort newest versions first
      items.sort((a, b) => (b.version.v || 0) - (a.version.v || 0))
      adminVersionItems.value = items
      return items
    } catch (err) {
      return []
    } finally {
      loading.value = false
    }
  }

  // Admin: Approve a document and refresh list per current filter
  async function approveDocument(id: number, filter: DocumentStatusFilter = 'pending') {
    // Mark the active version as approved as well
    await setCurrentVersionStatus(id, 'approved')
    await updateDocument(id, { status: 'approved' })
    return await fetchAdminDocuments(filter)
  }

  // Admin: Reject a document and refresh list per current filter
  async function rejectDocument(id: number, filter: DocumentStatusFilter = 'pending') {
    // Mark the active version as rejected as well
    await setCurrentVersionStatus(id, 'rejected')
    await updateDocument(id, { status: 'rejected' })
    return await fetchAdminDocuments(filter)
  }

  // Admin: Approve/Reject specific version
  async function approveVersion(documentId: number, versionNumber: number, filter: DocumentStatusFilter = 'pending') {
    const doc = (getDocumentFromState(documentId) || await fetchDocumentById(documentId)) as Document
    if (!doc) return []
    const versions = normalizeVersions(doc)
    const idx = versions.findIndex(v => (v.v || 0) === versionNumber)
    if (idx < 0) return []
    versions[idx] = { ...versions[idx], status: 'approved' }
    // Update doc to point to this version
    await updateDocument(documentId, {
      version: versions as unknown as Record<string, unknown>,
      current_version: versionNumber,
      attach_file: versions[idx].file_url || doc.attach_file,
      status: 'approved',
      updated_at: new Date().toISOString(),
    })
    return await fetchAdminVersionItems(filter)
  }

  async function rejectVersion(documentId: number, versionNumber: number, filter: DocumentStatusFilter = 'pending') {
    const doc = (getDocumentFromState(documentId) || await fetchDocumentById(documentId)) as Document
    if (!doc) return []
    const versions = normalizeVersions(doc)
    const idx = versions.findIndex(v => (v.v || 0) === versionNumber)
    if (idx < 0) return []
    versions[idx] = { ...versions[idx], status: 'rejected' }
    await updateDocument(documentId, {
      version: versions as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    })
    // Recompute doc.status and attach_file from versions
    await recomputeDocumentFromVersions(documentId)
    return await fetchAdminVersionItems(filter)
  }

  // Clear current document
  function clearCurrentDocument() {
    currentDocument.value = undefined
  }

  // Clear error
  function clearError() {
    error.value = undefined
  }

  // Upload file to Supabase storage bucket
  async function uploadFile(file: File, documentId?: number) {
    loading.value = true
    error.value = undefined

    try {
      // Generate unique filename with timestamp
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`

      // Upload file to 'documents' bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(uploadData.path)

      const publicUrl = urlData.publicUrl

      // If documentId is provided, update the document with the file URL
      if (documentId) {
        await updateDocument(documentId, { attach_file: publicUrl })
      }

      return publicUrl
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to upload file'
      console.error('Error uploading file:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete file from Supabase storage bucket
  async function deleteFile(fileUrl: string) {
    loading.value = true
    error.value = undefined

    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/documents/')
      if (urlParts.length < 2) {
        throw new Error('Invalid file URL')
      }
      const filePath = urlParts[1]

      // Delete file from 'documents' bucket
      const { error: deleteError } = await supabase.storage
        .from('documents')
        .remove([filePath])

      if (deleteError) throw deleteError

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete file'
      console.error('Error deleting file:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update document with file upload
  async function createDocumentWithFile(documentData: CreateDocumentInput, file?: File) {
    try {
      // First create the document
      const document = await createDocument(documentData)

      // If file is provided, upload it and update the document
      if (file && document) {
        const fileUrl = await uploadFile(file, document.id)
        return { ...document, attach_file: fileUrl }
      }

      return document
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create document with file'
      console.error('Error creating document with file:', err)
      throw err
    }
  }

  // Update document and replace file if provided
  async function updateDocumentWithFile(id: number, updates: UpdateDocumentInput, newFile?: File) {
    try {
      const currentDoc = documents.value.find(doc => doc.id === id) || currentDocument.value

      // If new file is provided, delete old file first (if exists)
      if (newFile && currentDoc?.attach_file) {
        await deleteFile(currentDoc.attach_file)
      }

      // Upload new file if provided
      if (newFile) {
        const fileUrl = await uploadFile(newFile)
        updates.attach_file = fileUrl
      }

      // Update the document
      return await updateDocument(id, updates)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update document with file'
      console.error('Error updating document with file:', err)
      throw err
    }
  }

  // Delete document and its associated file
  async function deleteDocumentWithFile(id: number) {
    try {
      const document = documents.value.find(doc => doc.id === id) || currentDocument.value

      // Delete file from storage if exists
      if (document?.attach_file) {
        await deleteFile(document.attach_file)
      }

      // Delete the document
      return await deleteDocument(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete document with file'
      console.error('Error deleting document with file:', err)
      throw err
    }
  }

  return {
    // State
    documents,
    currentDocument,
    loading,
    error,

    // Actions
    createDocument,
    fetchDocuments,
    fetchDocumentById,
    updateDocument,
    deleteDocument,
    fetchDocumentsByUserId,
    fetchDocumentsByStatus,
  fetchDocumentsForCurrentUser,
    clearCurrentDocument,
    clearError,

    // File upload actions
    uploadFile,
    deleteFile,
    createDocumentWithFile,
    updateDocumentWithFile,
    deleteDocumentWithFile,
    // extra state + helpers
    userDocuments,
    adminDocuments,
  adminVersionItems,
    approvedDocuments,
    approvedUserDocuments,
    formatDocumentDate,
    openDocumentFile,
    downloadDocumentFile,
    searchDocuments,
    fetchRepositoryData,
  // versioning
  fetchDocumentVersionsById,
  createNewDocumentVersion,
  normalizeVersions,
    // admin helpers
    fetchAdminDocuments,
  fetchAdminVersionItems,
    approveDocument,
    rejectDocument,
  approveVersion,
  rejectVersion,
  recomputeDocumentFromVersions,
    setCurrentVersionStatus,
  }
})
