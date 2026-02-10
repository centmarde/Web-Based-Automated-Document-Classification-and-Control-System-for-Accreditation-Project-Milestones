<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import InnerLayoutWrapper from '@/layouts/InnerLayoutWrapper.vue'
import ConfirmDelete from '@/pages/admin/dialogs/ConfirmDelete.vue'
import { useDocumentsDataStore } from '@/stores/documentsData'
import { useAuthUserStore } from '@/stores/authUser'

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

const docsStore = useDocumentsDataStore()
const { loading, error, adminDocuments } = storeToRefs(docsStore)
const authStore = useAuthUserStore()

const filter = ref<StatusFilter>('all')
const deletingId = ref<number | null>(null)
const search = ref('')
const tagMenus = ref<Record<number, boolean>>({})
const confirmDialog = ref(false)
const docToDelete = ref<number | null>(null)

const loadDocs = async () => {
	await docsStore.fetchAdminDocuments(filter.value)
}

const loadOwners = async () => {
	if (!authStore.users.length) {
		await authStore.getAllUsers()
	}
}

onMounted(async () => {
	await Promise.all([loadDocs(), loadOwners()])
})

watch(filter, loadDocs)

const documentTags = (item: any): string[] => {
	const raw = item?.tags
	if (!raw) return []
	if (Array.isArray(raw)) return raw.filter((t) => typeof t === 'string') as string[]
	if (typeof raw === 'object') {
		return Object.values(raw).filter((t) => typeof t === 'string') as string[]
	}
	return []
}

const statusColor = (status?: string) => {
	const s = (status || '').toLowerCase()
	if (s === 'approved') return 'success'
	if (s === 'rejected') return 'error'
	return 'info'
}

const ownersMap = computed(() => {
	const map: Record<string, string> = {}
	authStore.users.forEach((u) => {
		const name = u.full_name || u.user_metadata?.full_name || u.email || u.id
		map[u.id] = name
	})
	return map
})

const ownerName = (userId?: string) => {
	if (!userId) return 'Unknown'
	return ownersMap.value[userId] || userId
}

const filteredDocuments = computed(() => {
	const q = search.value.trim().toLowerCase()
	if (!q) return adminDocuments.value

	return adminDocuments.value.filter((doc) => {
		const title = (doc.title || '').toLowerCase()
		const status = (doc.status || '').toLowerCase()
		const owner = ownerName(doc.user_id).toLowerCase()
		const tags = documentTags(doc).join(' ').toLowerCase()
		return (
			title.includes(q) ||
			status.includes(q) ||
			owner.includes(q) ||
			tags.includes(q)
		)
	})
})

const openDelete = (docId: number) => {
	docToDelete.value = docId
	confirmDialog.value = true
}

const confirmDelete = async () => {
	if (docToDelete.value == null) return
	deletingId.value = docToDelete.value
	try {
		await docsStore.deleteDocumentWithFile(docToDelete.value)
		await docsStore.fetchAdminDocuments(filter.value)
		confirmDialog.value = false
	} finally {
		deletingId.value = null
		docToDelete.value = null
	}
}
</script>

<template>
	<InnerLayoutWrapper :hide-footer="true">
		<template #content>
			<v-container fluid class="pa-6">
				<!-- Header -->
				<v-row class="mb-6">
					<v-col cols="12" class="d-flex align-center justify-space-between">
						<div>
							<h1 class="text-h4 font-weight-bold mb-2">Admin Repository</h1>
							<p class="text-body-1 text-grey-darken-1">
								Browse all documents, inspect details, and delete files if needed
							</p>
						</div>
						<div class="d-flex ga-2 align-center flex-wrap control-bar">
							<v-text-field
								v-model="search"
								prepend-inner-icon="mdi-magnify"
								label="Search documents"
								density="comfortable"
								hide-details
								clearable
								variant="outlined"
								class="search-input control-input"
							/>
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
								hide-details
								variant="outlined"
								style="max-width: 200px"
								class="control-input"
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
				<v-row v-else-if="filteredDocuments.length === 0">
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
						v-for="doc in filteredDocuments"
						:key="doc.id"
						cols="12"
						sm="6"
						md="4"
						lg="3"
						class="d-flex"
					>
						<v-card class="mx-auto doc-card" elevation="2">
							<v-card-text class="pa-4 card-body">
								<div class="d-flex align-center justify-space-between mb-3">
									<div class="d-flex align-center ga-2">
										<v-avatar size="40" color="primary">
											<v-icon color="white">mdi-file-document</v-icon>
										</v-avatar>
										<v-btn
											:disabled="!doc.attach_file"
											color="primary"
											variant="text"
											prepend-icon="mdi-open-in-new"
											size="small"
											@click="docsStore.openDocumentFile(doc.attach_file)"
										>
											Open
										</v-btn>
									</div>
									<v-chip
										v-if="doc.status"
										size="small"
										:color="statusColor(doc.status)"
										variant="tonal"
									>
										{{ doc.status || 'pending' }}
									</v-chip>
								</div>

								<h3 class="text-h6 font-weight-medium mb-1 d-flex align-center ga-2">
									<span>{{ doc.title || 'Untitled Document' }}</span>
									<v-chip size="small" variant="outlined">ID: {{ doc.id }}</v-chip>
								</h3>
								<div class="text-caption text-grey-darken-1 mb-3">
									{{ doc.created_at ? new Date(doc.created_at).toLocaleString() : '—' }}
								</div>

								<div class="mb-3">
									<v-menu
										v-model="tagMenus[doc.id]"
										transition="scale-transition"
										location="bottom"
										open-on-click
										content-class="tags-menu"
									>
										<template #activator="{ props }">
											<v-btn
												size="small"
												variant="tonal"
												color="primary"
												prepend-icon="mdi-tag-multiple"
												v-bind="props"
											>
												Tags ({{ documentTags(doc).length || 0 }})
											</v-btn>
										</template>

										<div class="d-flex flex-wrap ga-2 pa-2 tags-menu-content">
											<v-chip
												v-for="tag in documentTags(doc)"
												:key="tag"
												size="small"
												color="primary"
												variant="tonal"
												prepend-icon="mdi-tag"
											>
												{{ tag }}
											</v-chip>
											<v-chip
												v-if="!documentTags(doc).length"
												size="small"
												variant="outlined"
												color="grey"
												prepend-icon="mdi-tag-outline"
											>
												No tags
											</v-chip>
										</div>
									</v-menu>
								</div>

								<div class="text-body-2 text-grey-darken-1 owner-block">
									<div class="d-flex justify-space-between">
										<span>Owner</span>
										<strong>{{ ownerName(doc.user_id) }}</strong>
									</div>
									<div class="d-flex justify-space-between">
										<span>Last Edited</span>
										<strong>{{ doc.updated_at ? new Date(doc.updated_at).toLocaleString() : '—' }}</strong>
									</div>
								</div>

								<v-card-actions class="px-0 py-0 mt-2 actions-tight">
									<div class="d-flex justify-space-between align-center w-100">
										<v-btn
											color="primary"
											variant="elevated"
											prepend-icon="mdi-file-eye"
											size="small"
											:disabled="!doc.attach_file"
											@click="docsStore.openDocumentFile(doc.attach_file)">
											View File
										</v-btn>
										<v-btn
											color="error"
											variant="elevated"
											prepend-icon="mdi-delete"
											size="small"
											:loading="deletingId === doc.id"
											@click="openDelete(doc.id)">
											Delete
										</v-btn>
									</div>
								</v-card-actions>
							</v-card-text>
						</v-card>
					</v-col>
				</v-row>

				<ConfirmDelete
					v-model="confirmDialog"
					title="Delete Document"
					:message="'Are you sure you want to delete this document and its file? This action cannot be undone.'"
					:loading="deletingId !== null"
					@confirm="confirmDelete"
				/>
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

.control-bar {
	gap: 12px;
}

.search-input {
	min-width: 260px;
	width: 320px;
	max-width: 100%;
}

.control-input :deep(.v-field) {
	min-height: 48px;
}

.control-input :deep(.v-field__input) {
	min-height: 48px;
	align-items: center;
}

.doc-card {
	height: 100%;
	display: flex;
}

.card-body {
	display: flex;
	flex-direction: column;
	height: 100%;
}

.tags-menu-content {
	max-width: 320px;
	background: rgba(var(--v-theme-surface), 0.95);
	border-radius: 8px;
	box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
}

.tags-menu :deep(.v-overlay__content) {
	border-radius: 10px;
	background: rgba(var(--v-theme-surface), 0.98);
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
	padding: 4px;
}

.owner-block {
	margin-top: auto;
	margin-bottom: 12px;
}
</style>
