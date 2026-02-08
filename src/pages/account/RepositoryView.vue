<script setup lang="ts">
import { onMounted, watch, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toastification'
import InnerLayoutWrapper from '@/layouts/InnerLayoutWrapper.vue'
import { useDocumentsDataStore } from '@/stores/documentsData'
import HistoryDialog from '@/components/dialogs/HistoryDialog.vue'
import DocumentTitle from '@/components/common/DocumentTitle.vue'
import { useAuthUserStore } from '@/stores/authUser'
import SelectTag from '@/components/dialogs/SelectTag.vue'

const authStore = useAuthUserStore()
const docsStore = useDocumentsDataStore()
const toast = useToast()

const { loading, error, approvedDocuments, approvedUserDocuments, userDocuments } = storeToRefs(docsStore)
const { userData } = storeToRefs(authStore)

watch(
  () => userData.value?.id,
  async (id) => {
    if (id) await docsStore.fetchDocumentsForCurrentUser()
  },
  { immediate: true }
)

const viewMode = ref<'all' | 'mine'>('mine')
const searchQuery = ref('')
const selectedTags = ref<string[]>([])
const showSelectTag = ref(false)

const docTags = (doc: any): string[] => {
  const raw = doc?.tags
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter((t) => typeof t === 'string') as string[]
  if (typeof raw === 'object') {
    return Object.values(raw).filter((t) => typeof t === 'string') as string[]
  }
  return []
}

const allTagOptions = computed(() => {
  const source = viewMode.value === 'all' ? approvedDocuments.value : userDocuments.value
  const set = new Set<string>()
  source.forEach((d) => docTags(d).forEach((t) => set.add(t)))
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

const displayedDocs = computed(() => {
  const base = viewMode.value === 'all'
    ? approvedDocuments.value
    // Show all of the user's submissions (approved/pending/rejected) so they can track status
    : userDocuments.value

  const searched = docsStore.searchDocuments(base as any, searchQuery.value)

  // Only require tag selection when viewing all
  if (viewMode.value === 'all') {
    if (selectedTags.value.length === 0) return []
    return searched.filter((doc: any) => {
      const tags = docTags(doc)
      if (tags.length === 0) return false
      return selectedTags.value.some((t) => tags.includes(t))
    })
  }

  // Mine view: show everything regardless of tags
  return searched
})

onMounted(async () => {
  await docsStore.fetchRepositoryData()
})

watch(viewMode, (val) => {
  if (val === 'all' && selectedTags.value.length === 0) {
    showSelectTag.value = true
  }
})

const isMine = (doc: any) => {
  const uid = userData.value?.id
  if (!uid || !doc) return false
  const owner = doc.user_id ?? doc.userId ?? doc.owner_id ?? doc.created_by ?? doc.createdBy
  return owner === uid
}

const canNewVersion = (doc: any) => {
  const status = (doc?.status || '').toLowerCase()
  return isMine(doc) && status === 'approved'
}

const showHistory = ref(false)
const showNewVersion = ref(false)
const selectedDoc = ref<any | null>(null)
const newVersionFile = ref<File | null>(null)
const newVersionNotes = ref('')

const deleteDialog = ref(false)
const docToDelete = ref<any | null>(null)
const deletingDocId = ref<number | null>(null)
const showLogDialog = ref(false)
const logDoc = ref<any | null>(null)

const formatAccess = (timestamp?: string) => timestamp ? docsStore.formatDocumentDate(timestamp) : '—'

function openHistory(doc: any) {
  selectedDoc.value = doc
  showHistory.value = true
}

const openTagDialog = () => {
  showSelectTag.value = true
}

const handleTagsSaved = (tags: string[]) => {
  selectedTags.value = tags
  showSelectTag.value = false
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

function askDelete(doc: any) {
  if (!isMine(doc)) {
    toast.error('You can only delete documents you uploaded.')
    return
  }
  docToDelete.value = doc
  deleteDialog.value = true
}

function closeDeleteDialog() {
  deleteDialog.value = false
  docToDelete.value = null
}

function openLogDialog(doc: any) {
  logDoc.value = doc
  showLogDialog.value = true
}

async function confirmDelete() {
  if (!docToDelete.value) return
  if (!isMine(docToDelete.value)) {
    toast.error('You can only delete documents you uploaded.')
    closeDeleteDialog()
    return
  }

  try {
    deletingDocId.value = docToDelete.value.id
    await docsStore.deleteDocumentWithFile(docToDelete.value.id)
    await docsStore.fetchRepositoryData()
    toast.success('Document deleted')
  } catch (err) {
    console.error('Failed to delete document:', err)
    const message = err instanceof Error ? err.message : 'Failed to delete document'
    toast.error(message)
  } finally {
    deletingDocId.value = null
    closeDeleteDialog()
  }
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

              <v-btn
                variant="tonal"
                color="primary"
                prepend-icon="mdi-tag"
                @click="openTagDialog"
              >
                {{ selectedTags.length ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected` : 'Select tags' }}
              </v-btn>

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

        <!-- Require tag selection only when viewing all -->
        <v-row v-else-if="viewMode === 'all' && selectedTags.length === 0">
          <v-col cols="12">
            <div class="text-center py-12">
              <v-icon size="96" color="grey-lighten-1" class="mb-4">
                mdi-tag-multiple
              </v-icon>
              <h3 class="text-h5 mb-3">Select at least one tag</h3>
              <p class="text-body-1 text-grey-darken-1">
                Choose categories to view matching files.
              </p>
            </div>
          </v-col>
        </v-row>

        <!-- Empty State after selection -->
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
                    <v-tooltip text="View access log" location="bottom">
                      <template #activator="{ props }">
                        <v-btn
                          v-bind="props"
                          icon
                          variant="text"
                          size="small"
                          @click="openLogDialog(doc)"
                          aria-label="Open access log"
                        >
                          <v-icon>mdi-information-outline</v-icon>
                        </v-btn>
                      </template>
                    </v-tooltip>
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

                <DocumentTitle :title="doc.title" />
                <div class="text-caption text-grey-darken-1 mb-3">
                  {{ docsStore.formatDocumentDate(doc.created_at) }}
                </div>


                <v-card-actions class="px-0 pt-2">
                  <v-row dense class="w-100">
                    <v-col cols="12" class="d-flex ga-3 align-center flex-wrap">
                      <v-tooltip text="Open" location="bottom">
                        <template #activator="{ props }">
                          <v-btn
                            v-bind="props"
                            icon
                            class="action-icon"
                            :disabled="!doc.attach_file"
                            @click="docsStore.openDocumentWithLog(doc)"
                          >
                            <v-icon>mdi-open-in-new</v-icon>
                          </v-btn>
                        </template>
                      </v-tooltip>
                      <v-tooltip text="Download" location="bottom">
                        <template #activator="{ props }">
                          <v-btn
                            v-bind="props"
                            icon
                            class="action-icon"
                            :disabled="!doc.attach_file"
                            @click="docsStore.downloadDocumentWithLog(doc)"
                          >
                            <v-icon>mdi-download</v-icon>
                          </v-btn>
                        </template>
                      </v-tooltip>
                      <template v-if="canNewVersion(doc)">
                        <v-tooltip text="New version" location="bottom">
                          <template #activator="{ props }">
                            <v-btn
                              v-bind="props"
                              icon
                              class="action-icon"
                              @click="openNewVersion(doc)"
                            >
                              <v-icon>mdi-file-plus</v-icon>
                            </v-btn>
                          </template>
                        </v-tooltip>
                      </template>
                      <template v-if="isMine(doc)">
                        <v-tooltip text="Delete" location="bottom">
                          <template #activator="{ props }">
                            <v-btn
                              v-bind="props"
                              icon
                              class="action-icon"
                              @click="askDelete(doc)"
                              :loading="deletingDocId === doc.id"
                            >
                              <v-icon>mdi-delete</v-icon>
                            </v-btn>
                          </template>
                        </v-tooltip>
                      </template>
                    </v-col>
                  </v-row>
                </v-card-actions>
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

        <!-- Delete Confirmation Dialog -->
        <v-dialog v-model="deleteDialog" max-width="420">
          <v-card>
            <v-card-title class="text-h6">Delete Document</v-card-title>
            <v-card-text>
              Are you sure you want to delete
              "{{ docToDelete?.title || 'this document' }}"?
              This will remove the file and its metadata.
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn variant="text" @click="closeDeleteDialog" :disabled="deletingDocId !== null">Cancel</v-btn>
              <v-btn color="error" variant="elevated" @click="confirmDelete" :loading="deletingDocId !== null">
                Delete
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Access Log Dialog -->
        <v-dialog v-model="showLogDialog" max-width="480">
          <v-card>
            <v-card-title class="d-flex justify-space-between align-center">
              <span>Access Log</span>
              <v-btn icon="mdi-close" variant="text" @click="showLogDialog = false" />
            </v-card-title>
            <v-divider />
            <v-card-text>
              <div class="text-subtitle-1 mb-2">{{ logDoc?.title || 'Document' }}</div>
              <v-list density="comfortable">
                <v-list-item>
                  <v-list-item-title>Last opened</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatAccess(logDoc?.last_opened_at) }}
                    <span v-if="logDoc?.last_opened_name"> • {{ logDoc.last_opened_name }}</span>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Last downloaded</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatAccess(logDoc?.last_downloaded_at) }}
                    <span v-if="logDoc?.last_downloaded_name"> • {{ logDoc.last_downloaded_name }}</span>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn variant="text" @click="showLogDialog = false">Close</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <SelectTag
          v-model="showSelectTag"
          :options="allTagOptions"
          :selected="selectedTags"
          @save="handleTagsSaved"
        />
      </v-container>
    </template>
  </InnerLayoutWrapper>
</template>

<style scoped>
/* Keep visuals consistent with admin cards */
.v-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  width: 100%; /* Full width of the column */
  display: flex;
  flex-direction: column;
}

.v-card .v-card-text {
  flex: 1; /* Allow card text to expand */
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Distribute content evenly */
  padding: 16px !important;
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

.action-icon {
  background-color: #111 !important;
  color: #fff !important;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.action-icon:hover {
  background-color: #000 !important;
}

.action-icon .v-icon {
  color: inherit;
}

.action-icon:disabled {
  opacity: 0.35;
  box-shadow: none;
}

</style>
