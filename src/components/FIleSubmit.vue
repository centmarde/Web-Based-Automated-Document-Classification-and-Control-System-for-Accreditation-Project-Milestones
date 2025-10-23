<script setup lang="ts">
import { ref } from 'vue'
import { useFileSubmit } from '@/composables/fileSubmit'
import './css/fileSubmit.css'

// File input ref
const fileInputRef = ref<HTMLInputElement | null>(null)

// Use the composable
const {
  isDragging,
  selectedFile,
  isProcessing,
  ocrResult,
  previewUrl,
  fileType,
  showSubmitDialog,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileInput,
  clearSelection,
  copyToClipboard,
  openSubmitDialog,
  closeSubmitDialog,
} = useFileSubmit()

// Toggle state for showing results
const showResults = ref(false)

// Full-size image viewer dialog
const showFullSizeDialog = ref(false)

// Thank you dialog state
const showThankYouDialog = ref(false)

// Toggle results visibility
const toggleResults = () => {
  showResults.value = !showResults.value
}

// Open full-size image viewer
const openFullSizeViewer = () => {
  showFullSizeDialog.value = true
}

// Handle successful submission - reset everything
const handleSubmitSuccess = () => {
  clearSelection()
  showResults.value = false
  showFullSizeDialog.value = false

  // Reset the file input element
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }

  // Show thank you dialog after clearing
  showThankYouDialog.value = true
}
</script>

<template>
  <v-card class="file-submit-card" elevation="2">


    <v-card-text>
      <!-- Dropzone Area -->
      <div
        class="dropzone"
        :class="{ 'dropzone-active': isDragging, 'dropzone-disabled': isProcessing }"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <input
          ref="fileInputRef"
          type="file"
          id="file-input"
          class="file-input"
          accept="image/*,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          @change="handleFileInput"
          :disabled="isProcessing"
        />

        <label for="file-input" class="dropzone-label">
          <v-icon size="64" color="primary" class="mb-4">
            {{ isProcessing ? 'mdi-loading mdi-spin' : 'mdi-cloud-upload-outline' }}
          </v-icon>

          <div v-if="!selectedFile">
            <p class="text-h6 mb-2">Drop your file here</p>
            <p class="text-body-2 text-medium-emphasis">or click to browse</p>

            <!-- Supported File Type Icons -->
            <div class="file-types-icons mt-4">
              <v-tooltip text="Images (JPG, PNG, BMP)" location="bottom">
                <template v-slot:activator="{ props }">
                  <div v-bind="props" class="file-type-icon">
                    <img
                      src="@/assets/logos/image.png"
                      alt="Image files"
                      @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
                    />
                    <v-icon size="40" color="blue" class="fallback-icon">mdi-image</v-icon>
                  </div>
                </template>
              </v-tooltip>

              <v-tooltip text="PDF Documents" location="bottom">
                <template v-slot:activator="{ props }">
                  <div v-bind="props" class="file-type-icon">
                    <img
                      src="@/assets/logos/pdf.png"
                      alt="PDF files"
                      @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
                    />
                    <v-icon size="40" color="red" class="fallback-icon">mdi-file-pdf-box</v-icon>
                  </div>
                </template>
              </v-tooltip>

              <v-tooltip text="Word Documents (DOCX)" location="bottom">
                <template v-slot:activator="{ props }">
                  <div v-bind="props" class="file-type-icon">
                    <img
                      src="@/assets/logos/docx.png"
                      alt="Word documents"
                      @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
                    />
                    <v-icon size="40" color="blue-darken-2" class="fallback-icon">mdi-file-word-box</v-icon>
                  </div>
                </template>
              </v-tooltip>
            </div>

            <p class="text-caption text-medium-emphasis mt-3">Supports: Images, PDF, DOCX</p>
          </div>

          <div v-else class="selected-file-info">
            <v-icon size="32" color="success" class="mb-2">mdi-check-circle</v-icon>
            <p class="text-body-1 font-weight-medium">{{ selectedFile.name }}</p>
            <p class="text-caption text-medium-emphasis">
              {{ (selectedFile.size / 1024).toFixed(2) }} KB
            </p>
          </div>
        </label>
      </div>

      <!-- Processing Indicator -->
      <v-progress-linear
        v-if="isProcessing"
        indeterminate
        color="primary"
        class="mt-4"
      ></v-progress-linear>

      <!-- Toggle Results Button and Submit File Button -->
      <div v-if="selectedFile && !isProcessing" class="mt-4 text-center d-flex justify-center gap-3">
        <v-btn
          color="primary"
          variant="tonal"
          @click="toggleResults"
          size="large"
					class="mx-2"
        >
          <v-icon left>{{ showResults ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
          {{ showResults ? 'Hide Results' : 'Show Results' }}
        </v-btn>

        <v-btn
          color="success"
          variant="elevated"
          @click="openSubmitDialog"
          size="large"
        >
          <v-icon left>mdi-file-upload</v-icon>
          Submit File
        </v-btn>
      </div>

      <!-- Preview and Result Section -->
      <v-row v-if="selectedFile && showResults" class="mt-4">
        <!-- File Preview -->
        <v-col cols="12" :md="previewUrl ? 6 : 12">
          <v-card elevation="8" v-if="previewUrl" class="preview-card">
            <v-card-title class="text-subtitle-1 d-flex justify-space-between align-center">
              Image Preview
              <v-btn
                icon
                size="small"
                variant="text"
                @click="openFullSizeViewer"
              >
                <v-icon>mdi-fullscreen</v-icon>
              </v-btn>
            </v-card-title>
            <v-card-text class="preview-card-content">
              <v-img
                :src="previewUrl"
                max-height="300"
                contain
                class="rounded cursor-pointer"
                @click="openFullSizeViewer"
              ></v-img>
            </v-card-text>
          </v-card>

          <!-- File Info for non-image files -->
          <v-card elevation="8" v-else class="preview-card">
            <v-card-title class="text-subtitle-1">File Information</v-card-title>
            <v-card-text class="preview-card-content">
              <v-list>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon>
                      {{ fileType === 'pdf' ? 'mdi-file-pdf-box' : 'mdi-file-word-box' }}
                    </v-icon>
                  </template>
                  <v-list-item-title>{{ selectedFile.name }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ (selectedFile.size / 1024).toFixed(2) }} KB • {{ fileType?.toUpperCase() }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Extracted Text Result -->
        <v-col cols="12" :md="previewUrl ? 6 : 12">
          <v-card elevation="8" class="preview-card">
            <v-card-title class="text-subtitle-1">
              {{ fileType === 'image' ? 'OCR Result' : 'Extracted Text' }}
            </v-card-title>
            <v-card-text class="preview-card-content">
              <v-textarea
                v-model="ocrResult"
                readonly
                rows="10"
                variant="outlined"
                placeholder="OCR text will appear here..."
                :loading="isProcessing"
              ></v-textarea>

              <v-btn
                v-if="ocrResult"
                color="primary"
                variant="outlined"
                size="small"
                @click="copyToClipboard"
              >
                <v-icon left size="small">mdi-content-copy</v-icon>
                Copy Text
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Action Buttons -->
      <v-row v-if="selectedFile && showResults" class="mt-2">
        <v-col>
          <v-btn
            color="error"
            variant="outlined"
            @click="clearSelection"
            :disabled="isProcessing"
          >
            <v-icon left>mdi-close</v-icon>
            Clear
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>

    <!-- Full-Size Image Viewer Dialog -->
    <v-dialog
      v-model="showFullSizeDialog"
      max-width="90vw"
      max-height="90vh"
    >
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>Full Size Image</span>
          <v-btn
            icon
            variant="text"
            @click="showFullSizeDialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-0">
          <v-img
            v-if="previewUrl"
            :src="previewUrl"
            max-height="80vh"
            contain
          ></v-img>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="showFullSizeDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Submit Dialog -->
    <SubmitDialog
      v-model="showSubmitDialog"
      :ocr-result="ocrResult"
      :selected-file="selectedFile"
      @close="closeSubmitDialog"
      @success="handleSubmitSuccess"
    />

    <!-- Thank You Dialog -->
    <ThankYouDialog
      v-model="showThankYouDialog"
    />
  </v-card>
</template>

