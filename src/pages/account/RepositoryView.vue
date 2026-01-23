<script setup lang="ts">
import { onMounted, watch, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import InnerLayoutWrapper from '@/layouts/InnerLayoutWrapper.vue'
import { useDocumentsDataStore } from '@/stores/documentsData'
import HistoryDialog from '@/components/dialogs/HistoryDialog.vue'
import { useAuthUserStore } from '@/stores/authUser'

const authStore = useAuthUserStore()
const docsStore = useDocumentsDataStore()

const { loading, error, userDocuments, documents, approvedDocuments, approvedUserDocuments } = storeToRefs(docsStore)
const { userData } = storeToRefs(authStore)

watch(
  () => userData.value?.id,
  async (id) => {
    if (id) await docsStore.fetchDocumentsForCurrentUser()
  },
  { immediate: true }
)

// View mode and search (default to user's documents)
const viewMode = ref<'all' | 'mine'>('mine')
const searchQuery = ref('')

const displayedDocs = computed(() => {
  const base = viewMode.value === 'all' ? approvedDocuments.value : approvedUserDocuments.value
  return docsStore.searchDocuments(base as any, searchQuery.value)
})

onMounted(async () => {
  await docsStore.fetchRepositoryData()
})

// Identify current user's documents
const isMine = (doc: any) => {
  const uid = userData.value?.id
  if (!uid || !doc) return false
  const owner = doc.user_id ?? doc.userId ?? doc.owner_id ?? doc.created_by ?? doc.createdBy
  return owner === uid
}

// Versioning UI state and handlers
const showHistory = ref(false)
const showNewVersion = ref(false)
const selectedDoc = ref<any | null>(null)
const newVersionFile = ref<File | null>(null)
const newVersionNotes = ref('')

function openHistory(doc: any) {
  selectedDoc.value = doc
  showHistory.value = true
}

function openNewVersion(doc: any) {
  selectedDoc.value = doc
  newVersionFile.value = null
  newVersionNotes.value = ''
  showNewVersion.value = true
}

async function submitNewVersion() {
  if (!selectedDoc.value || !newVersionFile.value) return
  await docsStore.createNewDocumentVersion(selectedDoc.value.id, newVersionFile.value, { notes: newVersionNotes.value })
  showNewVersion.value = false
  selectedDoc.value = null
}

// History versions and filtering are now encapsulated in HistoryDialog
</script>

<template>
  <InnerLayoutWrapper :hide-footer="true">
    <template #content>
      <v-container fluid class="pa-6">
        <!-- Header -->
        <v-row class="mb-6">
          <v-col cols="12" class="d-flex align-center justify-space-between flex-wrap ga-3">
            <div>
              <h1 class="text-h4 font-weight-bold mb-2">File Repository</h1>
              <p class="text-body-1 text-grey-darken-1">
                Browse all uploaded documents or your submissions
              </p>
            </div>
            <div class="d-flex ga-2 align-center flex-wrap">
              <v-btn-toggle v-model="viewMode" mandatory density="comfortable" class="mr-2">
                <v-btn value="mine" variant="tonal" prepend-icon="mdi-account">Mine</v-btn>
                <v-btn value="all" variant="tonal" prepend-icon="mdi-earth">All</v-btn>
              </v-btn-toggle>

              <v-text-field
                v-model="searchQuery"
                placeholder="Search documents..."
                density="comfortable"
                hide-details
                clearable
                prepend-inner-icon="mdi-magnify"
                style="min-width: 260px"
              />

              <v-btn
                variant="outlined"
                prepend-icon="mdi-refresh"
                @click="() => docsStore.fetchRepositoryData()"
                :loading="loading"
              >
                Refresh
              </v-btn>
            </div>
          </v-col>
        </v-row>

        <!-- Error Alert -->
        <v-row v-if="error">
          <v-col cols="12">
            <v-alert
              type="error"
              variant="tonal"
              closable
              class="mb-4"
            >
              {{ error }}
            </v-alert>
          </v-col>
        </v-row>

        <!-- Loading State -->
        <v-row v-if="loading">
          <v-col v-for="i in 6" :key="i" cols="12" sm="6" md="4" lg="3">
            <v-skeleton-loader type="image, article" elevation="2" />
          </v-col>
        </v-row>

        <!-- Empty State -->
        <v-row v-else-if="displayedDocs.length === 0">
          <v-col cols="12">
            <div class="text-center py-12">
              <v-icon size="96" color="grey-lighten-1" class="mb-4">
                mdi-file-outline
              </v-icon>
              <h3 class="text-h5 mb-3">No documents yet</h3>
              <p class="text-body-1 text-grey-darken-1">
                Try adjusting your search or view filters
              </p>
            </div>
          </v-col>
        </v-row>

        <!-- Documents Grid -->
        <v-row v-else>
          <v-col
            v-for="doc in displayedDocs"
            :key="doc.id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <v-card class="mx-auto" :class="{ 'mine-card': isMine(doc) }" elevation="2">
              <v-card-text class="pa-4">
                <div class="d-flex align-center justify-space-between mb-3">
                  <v-avatar size="40" color="primary">
                    <v-icon color="white">mdi-file-document</v-icon>
                  </v-avatar>
                  <div class="d-flex align-center ga-1">
                    <v-chip
                      v-if="doc.status"
                      size="small"
                      :color="doc.status === 'approved' ? 'success' : doc.status === 'rejected' ? 'error' : 'info'"
                      variant="tonal"
                    >
                      {{ doc.status }}
                    </v-chip>
                    <v-tooltip text="History" location="bottom">
                      <template #activator="{ props }">
                        <v-btn
                          v-bind="props"
                          icon
                          variant="text"
                          size="small"
                          @click="openHistory(doc)"
                          aria-label="Open history"
                        >
                          <v-icon>mdi-history</v-icon>
                        </v-btn>
                      </template>
                    </v-tooltip>
                  </div>
                </div>

                <h3 class="text-h6 font-weight-medium mb-1">
                  {{ doc.title || 'Untitled Document' }}
                </h3>
                <div class="text-caption text-grey-darken-1 mb-3">
                  {{ docsStore.formatDocumentDate(doc.created_at) }}
                </div>

                <div class="d-flex ga-2 mt-2 align-center flex-wrap">
                  <v-btn
                    :disabled="!doc.attach_file"
                    color="primary"
                    variant="elevated"
                    prepend-icon="mdi-open-in-new"
                    @click="docsStore.openDocumentFile(doc.attach_file)"
                  >
                    Open
                  </v-btn>
                  <v-btn
                    :disabled="!doc.attach_file"
                    color="primary"
                    variant="outlined"
                    prepend-icon="mdi-download"
                    @click="docsStore.downloadDocumentFile(doc.attach_file, (doc.title || 'document'))"
                  >
                    Download
                  </v-btn>
                  <template v-if="isMine(doc)">
                    <v-btn
                      size="small"
                      color="success"
                      variant="tonal"
                      prepend-icon="mdi-file-plus"
                      @click="openNewVersion(doc)"
                    >
                      New Version
                    </v-btn>
                  </template>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- History Dialog extracted into a reusable component -->
        <HistoryDialog v-model="showHistory" :document="selectedDoc" />

        <!-- New Version Dialog -->
        <v-dialog v-model="showNewVersion" max-width="560">
          <v-card>
            <v-card-title class="d-flex justify-space-between align-center">
              <span>Upload New Version</span>
              <v-btn icon="mdi-close" variant="text" @click="showNewVersion = false" />
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-file-input
                v-model="newVersionFile"
                label="Select file"
                prepend-icon="mdi-file-upload"
                show-size
                accept=".pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx,.txt,.csv"
                :rules="[(v)=> !!v || 'File is required']"
              />
              <v-textarea
                v-model="newVersionNotes"
                label="Notes (optional)"
                rows="3"
                auto-grow
                class="mt-2"
              />
            </v-card-text>
            <v-card-actions class="px-4 pb-4">
              <v-spacer />
              <v-btn variant="text" @click="showNewVersion = false">Cancel</v-btn>
              <v-btn color="primary" :disabled="!newVersionFile" @click="submitNewVersion">Upload</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </template>
  </InnerLayoutWrapper>
</template>

<style scoped>
/* Keep visuals consistent with admin cards */
.v-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

/* Visual identity for current user's documents */
.mine-card {
  border: 2px solid var(--v-theme-primary);
  background-color: color-mix(in srgb, var(--v-theme-primary) 10%, transparent);
}
</style>
