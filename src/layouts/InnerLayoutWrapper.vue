<script lang="ts" setup>
import { onMounted } from 'vue'
import { useLandingController } from '@/controller/landingController'
import Sidebar1 from '@/components/common/sideBar/Sidebar.vue'

const props = defineProps()

const { data, fetchLandingData } = useLandingController()

onMounted(async () => {
  await fetchLandingData()
})
</script>

<template>
  <v-app class="app-with-background">
    <!-- Background overlay -->
    <div class="background-overlay"></div>

    <!-- Left Sidebar - Takes full left side -->
    <Sidebar1 />

    <!-- Dynamic Navbar Selection - Positioned to the right of sidebar -->
    <InsideNavbar1
      v-if="data?.ui?.navbarComponent === '1'"
      :config="data?.ui"
      class="navbar-with-sidebar"
    />

    <InsideNavbar2
      v-else-if="data?.ui?.navbarComponent === '2'"
      :config="data?.ui"
      class="navbar-with-sidebar"
    />

    <InsideNavbar3
      v-else-if="data?.ui?.navbarComponent === '3'"
      :config="data?.ui"
      class="navbar-with-sidebar"
    />

    <InsideNavbar4
      v-else-if="data?.ui?.navbarComponent === '4'"
      :config="data?.ui"
      class="navbar-with-sidebar"
    />

    <v-main class="main-with-sidebar">
      <div class="content-wrapper">
        <slot name="content">
          <router-view />
        </slot>
      </div>
    </v-main>

    <OuterFooter
      v-if="data?.ui?.footerComponent === '1'"
      :config="data?.ui"
    />
    <OuterFooter2
      v-else-if="data?.ui?.footerComponent === '2'"
      :config="data?.ui"
    />
  </v-app>
</template>



<style scoped>
/* App with background */
.app-with-background {
  position: relative;
  background-image: url('/images/bg.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  min-height: 100vh;
}

/* Background overlay for better readability */
.background-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.959);
  opacity: 0.9;
  z-index: 0;
  pointer-events: none;
}

/* Navbar positioning - push to the right of sidebar */
.navbar-with-sidebar {
  margin-left: 280px; /* Match sidebar width */
  width: calc(100% - 280px); /* Adjust width to account for sidebar */
  position: relative;
  z-index: 10;
}

/* Main content positioning */
.main-with-sidebar {
  padding-left: 280px; /* Match sidebar width */
  padding-top: 64px; /* Account for navbar height */
  position: relative;
  z-index: 5;
  min-height: calc(100vh - 64px);
}

/* Content wrapper for better background handling */
.content-wrapper {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  margin: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Responsive behavior for small screens */
@media (max-width: 960px) {
  .navbar-with-sidebar {
    margin-left: 0;
    width: 100%;
  }

  .main-with-sidebar {
    padding-left: 0;
    padding-top: 64px; /* Keep top padding for mobile navbar */
  }

  .content-wrapper {
    margin: 8px;
    padding: 16px;
  }

  .app-with-background {
    background-attachment: scroll; /* Better performance on mobile */
  }
}

/* Ensure proper spacing and layout */
.v-app {
  position: relative;
}
</style>
