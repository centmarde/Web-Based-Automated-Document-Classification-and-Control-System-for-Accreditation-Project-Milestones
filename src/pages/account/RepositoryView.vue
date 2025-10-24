<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import InnerLayoutWrapper from '@/layouts/InnerLayoutWrapper.vue'
import { useDocumentsDataStore } from '@/stores/documentsData'
import { useAuthUserStore } from '@/stores/authUser'

const authStore = useAuthUserStore()
const docsStore = useDocumentsDataStore()

const { loading, error, userDocuments } = storeToRefs(docsStore)
const { userData } = storeToRefs(authStore)

const fetchUserDocs = async () => {
  await docsStore.fetchDocumentsForCurrentUser()
}

watch(
  () => userData.value?.id,
  (id) => {
    if (id) fetchUserDocs()
  },
  { immediate: true }
)

onMounted(fetchUserDocs)
</script>

<template>
  <InnerLayoutWrapper :hide-footer="true">
    <template #content>
      <v-container fluid class="pa-6">
        <!-- Header -->
        <v-row class="mb-6">
          <v-col cols="12" class="d-flex align-center justify-space-between">
            <div>
              <h1 class="text-h4 font-weight-bold mb-2">My Repository</h1>
              <p class="text-body-1 text-grey-darken-1">
                All documents you have submitted
              </p>
            </div>
            <div class="d-flex ga-2">
              <v-btn
                variant="outlined"
                prepend-icon="mdi-refresh"
                @click="fetchUserDocs"
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
        <v-row v-else-if="userDocuments.length === 0">
          <v-col cols="12">
            <div class="text-center py-12">
              <v-icon size="96" color="grey-lighten-1" class="mb-4">
                mdi-file-outline
              </v-icon>
              <h3 class="text-h5 mb-3">No documents yet</h3>
              <p class="text-body-1 text-grey-darken-1">
                Uploaded documents will appear here
              </p>
            </div>
          </v-col>
        </v-row>

        <!-- Documents Grid -->
        <v-row v-else>
          <v-col
            v-for="doc in userDocuments"
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
                    {{ doc.status }}
                  </v-chip>
                </div>

                <h3 class="text-h6 font-weight-medium mb-1">
                  {{ doc.title || 'Untitled Document' }}
                </h3>
                <div class="text-caption text-grey-darken-1 mb-3">
                  {{ docsStore.formatDocumentDate(doc.created_at) }}
                </div>

                <div class="d-flex ga-2 mt-2">
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
                    v-if="doc.attach_file"
                    color="primary"
                    variant="text"
                    icon
                    @click="docsStore.openDocumentFile(doc.attach_file)"
                    :aria-label="'Open ' + (doc.title || 'document')"
                  >
                    <v-icon>mdi-link</v-icon>
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
/* Keep visuals consistent with admin cards */
.v-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}
</style>
