<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useDocumentsDataStore, type Document } from '@/stores/documentsData'
import { useAuthUserStore } from '@/stores/authUser'

const props = defineProps<{
  modelValue: boolean
  document: Partial<Document> | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
}>()

const docsStore = useDocumentsDataStore()
const authStore = useAuthUserStore()

const dialogVisible = ref<boolean>(props.modelValue)
const versions = ref<any[]>([])

watch(
  () => props.modelValue,
  async (val) => {
    dialogVisible.value = val
    if (val) {
      await loadVersions()
    }
  }
)

watch(
  () => props.document?.id,
  async () => {
    if (dialogVisible.value) {
      await loadVersions()
    }
  }
)

watch(dialogVisible, (val) => emit('update:modelValue', val))

async function loadVersions() {
  if (!props.document?.id) {
    versions.value = []
    return
  }
  versions.value = await docsStore.fetchDocumentVersionsById(props.document.id)
}

function closeDialog() {
  dialogVisible.value = false
  emit('close')
}

const displayVersions = computed(() => {
  const uid = authStore.userData?.id
  const owner = props.document?.user_id
  const isOwner = !!uid && !!owner && uid === owner
  const list = versions.value || []
  const filtered = isOwner ? list : list.filter((v: any) => (v.status || '').toLowerCase() === 'approved')
  return [...filtered].sort((a: any, b: any) => (b.v || 0) - (a.v || 0))
})
</script>

<template>
  <v-dialog v-model="dialogVisible" max-width="640">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Version History</span>
        <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
      </v-card-title>
      <v-divider />
      <v-card-text>
        <div v-if="!displayVersions || displayVersions.length === 0" class="text-grey-darken-1">
          No versions found.
        </div>
        <v-list v-else density="comfortable">
          <v-list-item v-for="(v, i) in displayVersions" :key="i">
            <template #prepend>
              <v-avatar size="32" color="primary">
                <span class="text-white">{{ v.v || '?' }}</span>
              </v-avatar>
            </template>
            <v-list-item-title>
              v{{ v.v || '?' }} • {{ v.status || '—' }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ v.created_at ? new Date(v.created_at).toLocaleString() : '—' }}
              <span v-if="v.notes"> • {{ v.notes }}</span>
            </v-list-item-subtitle>
            <template #append>
              <v-btn
                size="small"
                variant="text"
                :disabled="!v.file_url"
                @click="docsStore.openDocumentFile(v.file_url)"
              >
                Open
              </v-btn>
              <v-btn
                size="small"
                variant="text"
                :disabled="!v.file_url"
                @click="docsStore.downloadDocumentFile(v.file_url, ((props.document?.title || 'document') + '_v' + (v.v || '')))"
              >
                Download
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
