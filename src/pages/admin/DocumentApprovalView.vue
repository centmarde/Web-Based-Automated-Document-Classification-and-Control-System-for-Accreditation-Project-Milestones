<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { storeToRefs } from "pinia";
import InnerLayoutWrapper from "@/layouts/InnerLayoutWrapper.vue";
import { useDocumentsDataStore } from "@/stores/documentsData";
import { useAuthUserStore } from "@/stores/authUser";
import ApprovalConfirmDialog from "@/pages/admin/dialogs/ApprovalConfirmDialog.vue";

const docsStore = useDocumentsDataStore();
const { loading, error, adminVersionItems } = storeToRefs(docsStore);
const authStore = useAuthUserStore();

const tagMenus = ref<Record<string, boolean>>({});
const confirmDialogOpen = ref(false);
const confirmAction = ref<"approve" | "reject" | null>(null);
const confirmItem = ref<any | null>(null);
const ownersMap = computed(() => {
  const map: Record<string, string> = {};
  authStore.users.forEach((u) => {
    const name = u.full_name || u.user_metadata?.full_name || u.email || u.id;
    map[u.id] = name;
  });
  return map;
});

const ownerName = (userId?: string) => {
  if (!userId) return "Unknown";
  return ownersMap.value[userId] || userId;
};

const statusColor = (status?: string) => {
  const s = (status || "").toLowerCase();
  if (s === "approved") return "success";
  if (s === "rejected") return "error";
  return "info";
};

const openConfirmDialog = (action: "approve" | "reject", item: any) => {
  confirmAction.value = action;
  confirmItem.value = item;
  confirmDialogOpen.value = true;
};

const handleConfirm = async () => {
  if (!confirmAction.value || !confirmItem.value) return;

  const documentId = confirmItem.value.documentId;
  const version = confirmItem.value.version?.v || 0;

  if (confirmAction.value === "approve") {
    await docsStore.approveVersion(documentId, version, filter.value);
  } else {
    await docsStore.rejectVersion(documentId, version, filter.value);
  }

  confirmDialogOpen.value = false;
  confirmAction.value = null;
  confirmItem.value = null;
};

const confirmTitle = computed(() =>
  confirmAction.value === "approve"
    ? "Approve Document Version"
    : "Reject Document Version",
);

const confirmMessage = computed(() => {
  const title = confirmItem.value?.docTitle || "this document";
  const version = confirmItem.value?.version?.v ?? "?";
  if (confirmAction.value === "approve") {
    return `Are you sure you want to approve "${title}" (v${version})?`;
  }
  return `Are you sure you want to reject "${title}" (v${version})? This action can be reversed by approving a newer version.`;
});

const versionTags = (item: any): string[] => {
  const raw = item?.version?.tags;
  if (!raw) return [];
  if (Array.isArray(raw))
    return raw.filter((t) => typeof t === "string") as string[];
  if (typeof raw === "object") {
    return Object.values(raw).filter((t) => typeof t === "string") as string[];
  }
  return [];
};

// UI filter state (applies to version status)
const filter = ref<"all" | "pending" | "approved" | "rejected">("pending");

const loadDocs = async () => {
  await docsStore.fetchAdminVersionItems(filter.value);
};

const loadOwners = async () => {
  if (!authStore.users.length) {
    await authStore.getAllUsers();
  }
};

onMounted(async () => {
  await Promise.all([loadDocs(), loadOwners()]);
});
watch(filter, loadDocs);

const itemKey = (item: any) => `${item.documentId}-${item.version?.v ?? 0}`;
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
                Review and approve or reject specific document versions
              </p>
            </div>
            <div class="d-flex ga-2">
              <v-select
                v-model="filter"
                :items="[
                  { title: 'All', value: 'all' },
                  { title: 'Pending', value: 'pending' },
                  { title: 'Approved', value: 'approved' },
                  { title: 'Rejected', value: 'rejected' },
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
        <v-row v-else-if="adminVersionItems.length === 0">
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

        <!-- Versions Grid -->
        <v-row v-else>
          <v-col
            v-for="item in adminVersionItems"
            :key="itemKey(item)"
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
                      :disabled="!item.version?.file_url"
                      color="primary"
                      variant="text"
                      prepend-icon="mdi-open-in-new"
                      size="small"
                      @click="
                        docsStore.openDocumentFile(item.version?.file_url)
                      "
                    >
                      Open
                    </v-btn>
                  </div>
                  <v-chip
                    v-if="item.version?.status"
                    size="small"
                    :color="statusColor(item.version?.status)"
                    variant="tonal"
                  >
                    {{ item.version?.status || "pending" }}
                  </v-chip>
                </div>

                <h3
                  class="text-h6 font-weight-medium mb-1 d-flex align-center ga-2"
                >
                  <span>{{ item.docTitle || "Untitled Document" }}</span>
                  <v-chip size="small" variant="outlined"
                    >v{{ item.version?.v ?? "?" }}</v-chip
                  >
                </h3>
                <div class="text-caption text-grey-darken-1 mb-3">
                  {{
                    item.version?.created_at
                      ? new Date(item.version.created_at).toLocaleString()
                      : "—"
                  }}
                </div>

                <div class="mb-3">
                  <v-menu
                    v-model="tagMenus[itemKey(item)]"
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
                        Tags ({{ versionTags(item).length || 0 }})
                      </v-btn>
                    </template>

                    <div class="d-flex flex-wrap ga-2 pa-2 tags-menu-content">
                      <v-chip
                        v-for="tag in versionTags(item)"
                        :key="tag"
                        size="small"
                        color="primary"
                        variant="tonal"
                        prepend-icon="mdi-tag"
                      >
                        {{ tag }}
                      </v-chip>
                      <v-chip
                        v-if="!versionTags(item).length"
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
                    <strong>{{ ownerName(item.ownerId) }}</strong>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span>Version Created</span>
                    <strong>{{
                      item.version?.created_at
                        ? new Date(item.version.created_at).toLocaleString()
                        : "—"
                    }}</strong>
                  </div>
                </div>

                <v-card-actions class="px-0 py-0 mt-2 actions-tight">
                  <div class="d-flex justify-space-between align-center w-100">
                    <v-btn
                      color="success"
                      variant="elevated"
                      prepend-icon="mdi-check"
                      size="small"
                      :disabled="
                        (item.version?.status || '').toLowerCase() !== 'pending'
                      "
                      @click="openConfirmDialog('approve', item)"
                    >
                      Approve
                    </v-btn>
                    <v-btn
                      color="error"
                      variant="elevated"
                      prepend-icon="mdi-close"
                      size="small"
                      :disabled="
                        (item.version?.status || '').toLowerCase() !== 'pending'
                      "
                      @click="openConfirmDialog('reject', item)"
                    >
                      Reject
                    </v-btn>
                  </div>
                </v-card-actions>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>

      <ApprovalConfirmDialog
        v-model="confirmDialogOpen"
        :action="confirmAction || 'approve'"
        :title="confirmTitle"
        :message="confirmMessage"
        :loading="loading"
        @confirm="handleConfirm"
      />
    </template>
  </InnerLayoutWrapper>
</template>

<style scoped>
.v-card {
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
}
.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
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
