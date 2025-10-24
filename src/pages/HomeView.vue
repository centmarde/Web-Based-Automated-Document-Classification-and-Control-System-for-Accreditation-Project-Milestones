
<script setup lang="ts">
import { useAuthUserStore } from '@/stores/authUser'
import { useToast } from 'vue-toastification'
import InnerLayoutWrapper from '@/layouts/InnerLayoutWrapper.vue'
import FIleSubmit from '@/components/FIleSubmit.vue'

const authStore = useAuthUserStore()
const toast = useToast()

// Reactive references from the auth store
const { userName, loading } = storeToRefs(authStore)

const handleLogout = async () => {
  try {
    const result = await authStore.signOut()

    if (result.error) {
      toast.error('Logout failed: ' + result.error.message)
    } else {
      toast.success('You have been logged out successfully')
    }
  } catch (error) {
    console.error('Logout error:', error)
    toast.error('An unexpected error occurred during logout')
  }
}
</script>

<template>
  <InnerLayoutWrapper :hide-footer="true">
    <template #content>
      <v-container fluid>
        <v-row justify="center">
          <v-col cols="12" md="12" lg="12">
            <FIleSubmit />
          </v-col>
        </v-row>
      </v-container>
    </template>
  </InnerLayoutWrapper>
</template>

