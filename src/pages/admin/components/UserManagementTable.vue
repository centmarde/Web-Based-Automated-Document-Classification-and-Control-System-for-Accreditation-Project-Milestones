<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthUserStore } from '@/stores/authUser'
import { useUserRolesStore } from '@/stores/roles'
import { supabase } from '@/lib/supabase'
import { useToast } from 'vue-toastification'
import DeleteUserDialog from '@/pages/admin/components/dialogs/DeleteUserDialog.vue'
import EditUserDialog from '@/pages/admin/components/dialogs/EditUserDialog.vue'
import UserDetailsDialog from '@/pages/admin/components/dialogs/UserDetailsDialog.vue'

import {
  formatDate,
  getErrorMessage,
  getRoleTitle,
  getRoleColor
} from '@/utils/helpers'

interface User {
  id: string
  email?: string
  created_at?: string
  user_metadata?: Record<string, any>
  app_metadata?: Record<string, any>
  full_name?: string
  student_number?: string
  organization_id?: number
  role_id?: number
  student_id?: number
}

// Composables
const authStore = useAuthUserStore()
const rolesStore = useUserRolesStore()
const toast = useToast()

// Reactive data
const loading = ref(false)
const search = ref('')
const userDialog = ref(false)
const editDialog = ref(false)
const selectedUser = ref<User | null>(null)
const editingUser = ref<User | null>(null)
const studentEventStatusMap = ref<Record<string, any[]>>({}) // userId -> events array
const deleteDialog = ref(false)
const userToDelete = ref<User | null>(null)



// Table headers
const headers = [
  { title: 'Full Name', key: 'full_name', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Role', key: 'role_id', sortable: true },
  { title: 'Created At', key: 'created_at', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

// Methods
const fetchUsers = async () => {
  loading.value = true
  try {
    const result = await authStore.getAllUsers()

    if (result.error) {
      toast.error('Failed to fetch users: ' + getErrorMessage(result.error))
      console.error('Error fetching users:', result.error)
      return
    }

    // Users are now stored in authStore.users reactively
    if (result.users) {
      // toast.success(`Loaded ${result.users.length} users`)
    }
  } catch (error) {
    toast.error('An unexpected error occurred while fetching users')
    console.error('Unexpected error:', error)
  } finally {
    loading.value = false
  }
}
const viewUser = (user: User) => {
  selectedUser.value = user
  userDialog.value = true
}
const editUser = (user: User) => {
  editingUser.value = user
  editDialog.value = true
}

const deleteUser = (user: User) => {
  userToDelete.value = user
  deleteDialog.value = true
}

// Event handlers
const onUserUpdated = (updatedUser: User) => {
  // The store already updates the users array automatically
  console.log('User updated:', updatedUser)
}

const onUserDeleted = (deletedUserId: string) => {
  // The store already removes the user from the users array automatically
  console.log('User deleted:', deletedUserId)
}


// Lifecycle
onMounted(async () => {
  await rolesStore.fetchRoles()
  await fetchUsers()
})
</script>

<template>
  <v-card class="mt-5">
    <v-card-title class="d-flex justify-space-between align-center">
      <div>
        <h3>User Management</h3>
        <p class="text-subtitle-1 text-grey">Manage all system users</p>
      </div>
     <!--  <v-btn
        color="primary"
        prepend-icon="mdi-refresh"
        @click="refreshData"
        :loading="loading"
      >
        Refresh
      </v-btn> -->
    </v-card-title>



    <v-card-text>
      <v-data-table
        :headers="headers"
        :items="authStore.users"
        :loading="loading"
        class="elevation-1"
        item-key="id"
        :search="search"
        show-current-page
      >
        <template v-slot:top>
          <v-row class="ma-2">
            <v-col cols="12" md="4">
              <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                label="Search users..."
                single-line
                hide-details
                clearable
              />
            </v-col>
          </v-row>
        </template>

        <template v-slot:item.role_id="{ item }">
          <v-chip
            :color="getRoleColor(item.role_id)"
            variant="tonal"
            size="small"
          >
            {{ getRoleTitle(item.role_id, rolesStore.roles) }}
          </v-chip>
        </template>



        <template v-slot:item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-eye"
            variant="text"
            size="small"
            @click="viewUser(item)"
          >
          </v-btn>
          <v-btn
            icon="mdi-pencil"
            variant="text"
            size="small"
            @click="editUser(item)"
            color="primary"
          >
          </v-btn>
          <v-btn
            icon="mdi-delete"
            variant="text"
            size="small"
            @click="deleteUser(item)"
            color="error"
          >
          </v-btn>
        </template>

        <template v-slot:no-data>
          <div class="text-center pa-4">
            <v-icon size="64" color="grey">mdi-account-off</v-icon>
            <p class="text-h6 mt-4">No users found</p>
            <p class="text-body-2 text-grey">There are no users in the system yet.</p>
          </div>
        </template>

        <template v-slot:loading>
          <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
        </template>
      </v-data-table>
    </v-card-text>

    <!-- User Details Dialog -->
    <UserDetailsDialog
      v-model="userDialog"
      :user="selectedUser"
    />

    <!-- Edit User Dialog -->
    <EditUserDialog
      v-model="editDialog"
      :user="editingUser"
      @user-updated="onUserUpdated"
    />

    <!-- Delete User Dialog -->
    <DeleteUserDialog
      v-model="deleteDialog"
      :user="userToDelete"
      @user-deleted="onUserDeleted"
    />
  </v-card>
</template>

<style scoped>
.v-card-title h3 {
  margin-bottom: 4px;
}
</style>
