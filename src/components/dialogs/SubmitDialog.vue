<script setup lang="ts">
import { ref, watch } from 'vue'
import { analyzeDocument, type DocumentAnalysis } from '@/utils/fetchLLM'
import { useDocumentsDataStore } from '@/stores/documentsData'
import { useToast } from 'vue-toastification'
import { useAuthUserStore } from '@/stores/authUser'

const props = defineProps<{
  modelValue: boolean
  ocrResult: string
  selectedFile: File | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
  'success': []
}>()

const toast = useToast()
const documentsStore = useDocumentsDataStore()
const authUserStore = useAuthUserStore()

// Local state
const isAnalyzing = ref(false)
const isSaving = ref(false)
const documentType = ref('')
const title = ref('')
const tags = ref<string[]>([])
const additionalInfo = ref('')
const collaboratorInputs = ref<{ id: number, email: string }[]>([])
let collaboratorIdCounter = 0

// Computed for dialog visibility
const dialogVisible = ref(props.modelValue)

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
  dialogVisible.value = newVal
  if (newVal) {
    analyzeOCRText()
  }
})

// Watch for internal changes
watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal)
})

// Add collaborator input field
const addCollaboratorInput = () => {
  collaboratorInputs.value.push({ id: collaboratorIdCounter++, email: '' })
}

// Remove collaborator input field
const removeCollaboratorInput = (id: number) => {
  const index = collaboratorInputs.value.findIndex(input => input.id === id)
  if (index !== -1) {
    collaboratorInputs.value.splice(index, 1)
  }
}

// Analyze OCR text using LLM
const analyzeOCRText = async () => {
  if (!props.ocrResult) {
    toast.error('No text to analyze')
    return
  }

  isAnalyzing.value = true

  try {
    const analysis: DocumentAnalysis = await analyzeDocument(props.ocrResult)

    documentType.value = analysis.documentType
    title.value = analysis.title
    tags.value = analysis.tags

    toast.success('Document analyzed successfully!')
  } catch (error) {
    console.error('Error analyzing document:', error)
    toast.error('Failed to analyze document')

    // Set default values on error
    documentType.value = 'Unknown'
    title.value = 'Untitled Document'
    tags.value = []
  } finally {
    isAnalyzing.value = false
  }
}

// Submit document
const submitDocument = async () => {
  if (!title.value || !documentType.value) {
    toast.error('Title and document type are required')
    return
  }

  isSaving.value = true

  try {
    const userId = authUserStore.userData?.id

    if (!userId) {
      toast.error('User not authenticated')
      isSaving.value = false
      return
    }

    // Prepare tags object (convert array to object if needed)
    const tagsObject: Record<string, unknown> = {}
    tags.value.forEach((tag, index) => {
      tagsObject[`tag_${index}`] = tag
    })

    // Prepare collaborators object - collect and validate emails
    const collaboratorsObject: Record<string, unknown> = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    let validCollaboratorIndex = 0
    for (const input of collaboratorInputs.value) {
      const email = input.email.trim()
      if (email) {
        if (!emailRegex.test(email)) {
          toast.error(`Invalid email address: ${email}`)
          isSaving.value = false
          return
        }
        collaboratorsObject[`collaborator_${validCollaboratorIndex}`] = email
        validCollaboratorIndex++
      }
    }

    // Create document data
    const documentData = {
      user_id: userId,
      title: title.value,
      contents: props.ocrResult,
      status: 'pending',
      tags: tagsObject,
      collaborators: collaboratorsObject,
      current_version: 1,
      version: { v1: props.ocrResult },
      last_edited_by: userId,
      updated_at: new Date().toISOString(),
    }

    // If there's a file, upload it with the document
    if (props.selectedFile) {
      await documentsStore.createDocumentWithFile(documentData, props.selectedFile)
    } else {
      await documentsStore.createDocument(documentData)
    }

    toast.success('Document submitted successfully!')

    // Emit success event to parent
    emit('success')

    // Reset form
    resetForm()
    closeDialog()
  } catch (error) {
    console.error('Error submitting document:', error)
    toast.error('Failed to submit document')
  } finally {
    isSaving.value = false
  }
}

// Reset form
const resetForm = () => {
  documentType.value = ''
  title.value = ''
  tags.value = []
  additionalInfo.value = ''
  collaboratorInputs.value = []
  collaboratorIdCounter = 0
}

// Close dialog
const closeDialog = () => {
  dialogVisible.value = false
  emit('close')
}
</script>

<template>
  <v-dialog
    v-model="dialogVisible"
    max-width="700px"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center bg-primary">
        <span class="text-h5">Submit Document</span>
        <v-btn
          icon
          variant="text"
          @click="closeDialog"
          :disabled="isAnalyzing || isSaving"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pt-6">
        <!-- Analysis Loading State -->
        <div v-if="isAnalyzing" class="text-center py-8">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
          ></v-progress-circular>
          <p class="mt-4 text-body-1">Analyzing document with AI...</p>
        </div>

        <!-- Form Content -->
        <div v-else>
          <!-- Document Type (Read-only) -->
          <v-text-field
            v-model="documentType"
            label="Document Type"
            variant="outlined"
            readonly
            prepend-inner-icon="mdi-file-document"
            class="mb-4"
            hint="Automatically detected by AI"
            persistent-hint
          ></v-text-field>

          <!-- Title (Read-only) -->
          <v-text-field
            v-model="title"
            label="Title"
            variant="outlined"
            readonly
            prepend-inner-icon="mdi-format-title"
            class="mb-4"
            hint="Automatically generated by AI"
            persistent-hint
          ></v-text-field>

          <!-- Tags (Read-only) -->
          <div class="mb-4">
            <label class="text-subtitle-2 mb-2 d-block">Tags (AI Generated)</label>
            <div class="d-flex flex-wrap gap-2">
              <v-chip
                v-for="(tag, index) in tags"
                :key="index"
                color="primary"
                variant="outlined"
                size="small"
              >
                <v-icon start size="small">mdi-tag</v-icon>
                {{ tag }}
              </v-chip>
              <v-chip
                v-if="tags.length === 0"
                color="grey"
                variant="outlined"
                size="small"
              >
                No tags detected
              </v-chip>
            </div>
          </div>

          <!-- Additional Information (Editable) -->
          <v-textarea
            v-model="additionalInfo"
            label="Additional Information (Optional)"
            variant="outlined"
            rows="4"
            prepend-inner-icon="mdi-text"
            placeholder="Add any additional notes or information about this document..."
            hint="You can add custom notes here"
            persistent-hint
          ></v-textarea>

          <!-- Collaborators Section -->
          <div class="mt-4">
            <div class="d-flex justify-space-between align-center mb-2">
              <label class="text-subtitle-2">Collaborators (Optional)</label>
              <v-btn
                color="primary"
                variant="outlined"
                size="small"
                @click="addCollaboratorInput"
              >
                <v-icon size="small">mdi-plus</v-icon>
                Add Input
              </v-btn>
            </div>

            <!-- Collaborator Input Fields -->
            <div v-if="collaboratorInputs.length > 0" class="collaborators-inputs">
              <div
                v-for="input in collaboratorInputs"
                :key="input.id"
                class="d-flex gap-2 mb-2"
              >
                <v-text-field
                  v-model="input.email"
                  label="Collaborator Email"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-account"
                  placeholder="Enter email address"
                  hide-details
                ></v-text-field>
                <v-btn
                  color="error"
                  variant="text"
                  icon
                  size="small"
                  @click="removeCollaboratorInput(input.id)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </div>
            <div v-else class="text-caption text-medium-emphasis">
              Click "Add Input" to add collaborators
            </div>
          </div>

          <!-- File Info -->
          <v-alert
            v-if="selectedFile"
            type="info"
            variant="tonal"
            class="mt-4"
          >
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-file-outline</v-icon>
              <div>
                <div class="font-weight-medium">{{ selectedFile.name }}</div>
                <div class="text-caption">
                  {{ (selectedFile.size / 1024).toFixed(2) }} KB
                </div>
              </div>
            </div>
          </v-alert>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="px-6 py-4">
        <v-btn
          variant="text"
          @click="closeDialog"
          :disabled="isAnalyzing || isSaving"
        >
          Cancel
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          v-if="selectedFile"
          color="primary"
          variant="elevated"
          @click="submitDocument"
          :loading="isSaving"
          :disabled="isAnalyzing || !title || !documentType"
        >
          <v-icon left>mdi-check</v-icon>
          Submit Document
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.gap-2 {
  gap: 0.5rem;
}

.gap-3 {
  gap: 0.75rem;
}
</style>
