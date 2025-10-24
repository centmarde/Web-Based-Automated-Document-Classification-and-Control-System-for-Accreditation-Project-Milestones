import { defineStore } from 'pinia'
import { ref } from 'vue'
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
    formatDocumentDate,
    openDocumentFile,
  }
})
