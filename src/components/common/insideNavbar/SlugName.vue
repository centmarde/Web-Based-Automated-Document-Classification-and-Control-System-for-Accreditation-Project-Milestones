<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useAuthUserStore } from '@/stores/authUser'
import { createDisplaySlugName, getEmailInitials } from '@/utils/helpers'

const authStore = useAuthUserStore()

// Dropdown menu state
const menu = ref(false)

// Computed properties for user data
const userEmail = computed(() => authStore.userEmail)
const displayName = computed(() => createDisplaySlugName(userEmail.value))
const userInitials = computed(() => getEmailInitials(userEmail.value))

// Handle logout
async function handleLogout() {
  try {
    menu.value = false // Close dropdown first
    await authStore.signOut()
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>

<template>
  <div class="slug-name-container">
    <!-- User Avatar/Button -->
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      location="bottom end"
      offset="8"
      transition="slide-y-transition"
    >
      <template #activator="{ props }">
        <div
          v-bind="props"
          class="user-avatar-container"
        >
          <!-- Avatar -->
          <v-avatar
            size="36"
            color="primary"
            class="cursor-pointer avatar-with-border"
          >
            <span class="text-white font-weight-medium">
              {{ userInitials }}
            </span>
          </v-avatar>
        </div>
      </template>      <!-- Dropdown Menu -->
      <v-card
        min-width="280"
        class="user-dropdown-card"
        elevation="8"
        rounded="lg"
      >
        <!-- User Info Header -->
        <v-card-item class="pb-2">
          <div class="d-flex align-center">
            <v-avatar
              size="48"
              color="primary"
              class="me-3"
            >
              <span class="text-white font-weight-bold">
                {{ userInitials }}
              </span>
            </v-avatar>

            <div class="flex-grow-1">
              <div class="text-h6 font-weight-bold text-high-emphasis">
                {{ displayName }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{ userEmail }}
              </div>
            </div>
          </div>
        </v-card-item>

        <v-divider class="mx-4" />

        <!-- Menu Actions -->
        <v-card-actions class="pa-4">
          <v-btn
            block
            variant="outlined"
            prepend-icon="mdi-logout"
            color="error"
            :loading="authStore.loading"
            @click="handleLogout"
            rounded="lg"
          >
            Logout
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<style scoped>
.slug-name-container {
  display: flex;
  align-items: center;
}

.user-avatar-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.user-avatar-container:hover .v-avatar {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3);
}

.avatar-with-border {
  border: 2px solid rgba(var(--v-theme-secondary), 1) !important;
}

.user-dropdown-card {
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  backdrop-filter: blur(8px);
  background: rgba(var(--v-theme-surface), 0.95) !important;
}

.transition-transform {
  transition: transform 0.2s ease;
}

.rotate-180 {
  transform: rotate(180deg);
}

/* Responsive adjustments */
@media (max-width: 599px) {
  .user-avatar-btn {
    padding: 6px 8px !important;
  }

  .user-dropdown-card {
    min-width: 260px;
  }
}

/* Dark mode adjustments */
.v-theme--dark .user-dropdown-card {
  background: rgba(var(--v-theme-surface-bright), 0.95) !important;
  border-color: rgba(var(--v-theme-outline), 0.2);
}

/* Focus states for accessibility */
.user-avatar-btn:focus {
  outline: 2px solid rgba(var(--v-theme-primary), 0.5);
  outline-offset: 2px;
}

/* Animation for smooth dropdown */
.v-menu > .v-overlay__content {
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
