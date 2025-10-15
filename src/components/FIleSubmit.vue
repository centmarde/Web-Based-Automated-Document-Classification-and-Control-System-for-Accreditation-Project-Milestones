<script setup lang="ts">
import { useFileSubmit } from '@/composables/fileSubmit'

// Use the composable
const {
  isDragging,
  selectedFile,
  isProcessing,
  ocrResult,
  previewUrl,
  fileType,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileInput,
  clearSelection,
  copyToClipboard,
} = useFileSubmit()
</script>

<template>
  <v-card class="file-submit-card" elevation="2">
    <v-card-title class="text-h5 font-weight-bold">
      <v-icon left>mdi-file-document-outline</v-icon>
      Document Text Extractor
    </v-card-title>

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
            <p class="text-caption text-medium-emphasis mt-2">Supports: Images (JPG, PNG, BMP), PDF, DOCX</p>
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

      <!-- Preview and Result Section -->
      <v-row v-if="selectedFile" class="mt-4">
        <!-- File Preview -->
        <v-col cols="12" :md="previewUrl ? 6 : 12">
          <v-card outlined v-if="previewUrl">
            <v-card-title class="text-subtitle-1">Image Preview</v-card-title>
            <v-card-text>
              <v-img
                :src="previewUrl"
                max-height="300"
                contain
                class="rounded"
              ></v-img>
            </v-card-text>
          </v-card>

          <!-- File Info for non-image files -->
          <v-card outlined v-else>
            <v-card-title class="text-subtitle-1">File Information</v-card-title>
            <v-card-text>
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
          <v-card outlined>
            <v-card-title class="text-subtitle-1">
              {{ fileType === 'image' ? 'OCR Result' : 'Extracted Text' }}
            </v-card-title>
            <v-card-text>
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
      <v-row v-if="selectedFile" class="mt-2">
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
  </v-card>
</template>

<style scoped lang="scss">
.file-submit-card {
  max-width: 100%;
  margin: 0 auto;
}

.dropzone {
  border: 3px dashed rgb(var(--v-theme-primary));
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  background-color: rgba(var(--v-theme-surface), 0.8);
  position: relative;
  min-height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(.dropzone-disabled) {
    border-color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.05);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.dropzone-active {
    border-color: rgb(var(--v-theme-success));
    background-color: rgba(var(--v-theme-success), 0.1);
    transform: scale(1.02);
  }

  &.dropzone-disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.file-input {
  display: none;
}

.dropzone-label {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.selected-file-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
