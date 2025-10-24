<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import InnerLayoutWrapper from '@/layouts/InnerLayoutWrapper.vue'
import { useDocumentsDataStore } from '@/stores/documentsData'

const docsStore = useDocumentsDataStore()
const { loading, error, adminDocuments } = storeToRefs(docsStore)

// UI filter state
const filter = ref<'all' | 'pending' | 'approved' | 'rejected'>('pending')

const loadDocs = async () => {
  await docsStore.fetchAdminDocuments(filter.value)
}

onMounted(loadDocs)
watch(filter, loadDocs)
</script>

<template>
  <InnerLayoutWrapper :hide-footer="true">
    <template #content>
      <v-container fluid class="pa-6">
        <!-- Header -->
        <v-row class="mb-6">
          <v-col cols="12" class="d-flex align-center justify-space-between">
            <div>
              <h1 class="text-h4 font-weight-bold mb-2">Document Approvals</h1>
              <p class="text-body-1 text-grey-darken-1">
                Review and approve or reject user-submitted documents
              </p>
            </div>
            <div class="d-flex ga-2">
              <v-select
                v-model="filter"
                :items="[
                  { title: 'All', value: 'all' },
                  { title: 'Pending', value: 'pending' },
                  { title: 'Approved', value: 'approved' },
                  { title: 'Rejected', value: 'rejected' }
                ]"
                label="Filter"
                density="comfortable"
                style="max-width: 200px"
              />
              <v-btn
                variant="outlined"
                prepend-icon="mdi-refresh"
                @click="loadDocs"
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
            <v-alert type="error" variant="tonal" closable class="mb-4">
              {{ error }}
            </v-alert>
          </v-col>
        </v-row>

        <!-- Loading State -->
        <v-row v-if="loading">
          <v-col v-for="i in 8" :key="i" cols="12" sm="6" md="4" lg="3">
            <v-skeleton-loader type="image, article" elevation="2" />
          </v-col>
        </v-row>

        <!-- Empty State -->
        <v-row v-else-if="adminDocuments.length === 0">
          <v-col cols="12">
            <div class="text-center py-12">
              <v-icon size="96" color="grey-lighten-1" class="mb-4">
                mdi-file-document-off-outline
              </v-icon>
              <h3 class="text-h5 mb-3">No documents found</h3>
              <p class="text-body-1 text-grey-darken-1">
                Try changing the filter or check back later
              </p>
            </div>
          </v-col>
        </v-row>

        <!-- Documents Grid -->
        <v-row v-else>
          <v-col
            v-for="doc in adminDocuments"
            :key="doc.id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <v-card class="mx-auto" elevation="2">
              <v-card-text class="pa-4">
                <div class="d-flex align-center justify-space-between mb-3">
                  <v-avatar size="40" color="primary">
                    <v-icon color="white">mdi-file-document</v-icon>
                  </v-avatar>
                  <v-chip
                    v-if="doc.status"
                    size="small"
                    :color="doc.status === 'approved' ? 'success' : doc.status === 'rejected' ? 'error' : 'info'"
                    variant="tonal"
                  >
                    {{ doc.status || 'pending' }}
                  </v-chip>
                </div>

                <h3 class="text-h6 font-weight-medium mb-1">
                  {{ doc.title || 'Untitled Document' }}
                </h3>
                <div class="text-caption text-grey-darken-1 mb-3">
                  {{ doc.created_at ? new Date(doc.created_at).toLocaleString() : '—' }}
                </div>

                <div class="d-flex ga-2 mt-2">
                  <v-btn
                    :disabled="!doc.attach_file"
                    color="primary"
                    variant="text"
                    prepend-icon="mdi-open-in-new"
                    @click="docsStore.openDocumentFile(doc.attach_file)"
                  >
                    Open
                  </v-btn>
                  <v-spacer />
                  <v-btn
                    color="success"
                    variant="elevated"
                    prepend-icon="mdi-check"
                    @click="docsStore.approveDocument(doc.id, filter)"
                  >
                    Approve
                  </v-btn>
                  <v-btn
                    color="error"
                    variant="outlined"
                    prepend-icon="mdi-close"
                    @click="docsStore.rejectDocument(doc.id, filter)"
                  >
                    Reject
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </InnerLayoutWrapper>
</template>

<style scoped>
.v-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}
</style>
