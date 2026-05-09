<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useLandingController } from "@/controller/landingController";
import OuterLayoutWrapper from "@/layouts/OuterLayoutWrapper.vue";

const { data, loading, error, fetchLandingData } = useLandingController();

onMounted(async () => {
  await fetchLandingData();
});

function scrollToFeatures() {
  const element = document.querySelector("#features");
  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

function openGithub() {
  window.open("https://github.com", "_blank", "noopener,noreferrer");
}

function openDocumentation() {
  window.open("https://vuetifyjs.com/", "_blank", "noopener,noreferrer");
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Background image style
const backgroundImageStyle = computed(() => {
  if (!data.value?.backgroundImage) return {};

  const { src, overlay } = data.value.backgroundImage;
  let style = `background-image: url('${src}'); background-size: cover; background-position: center; background-repeat: no-repeat;`;

  if (overlay?.enabled) {
    style += ` background-blend-mode: overlay; background-color: ${overlay.color};`;
  }

  return style;
});
</script>

<template>
  <OuterLayoutWrapper>
    <template #content>
      <div class="landing-view">
        <!-- Loading State -->
        <v-container
          v-if="loading"
          class="d-flex justify-center align-center"
          style="min-height: 50vh"
        >
          <v-progress-circular color="primary" indeterminate size="64" />
        </v-container>

        <!-- Error State -->
        <v-container
          v-else-if="error"
          class="d-flex justify-center align-center"
          style="min-height: 50vh"
        >
          <v-alert
            color="error"
            icon="mdi-alert-circle"
            type="error"
            variant="tonal"
          >
            <v-alert-title>Failed to load content</v-alert-title>
            {{ error }}
          </v-alert>
        </v-container>

        <!-- Content -->
        <div v-else-if="data" class="landing-content">
          <!-- Hero Section -->
          <section class="hero-section">
            <v-container>
              <v-row align="center" class="min-height-screen" justify="center">
                <!-- Image Column -->
                <v-col cols="12" lg="5" md="6" class="d-flex justify-center">
                  <v-img
                    src="/assets/Logo.png"
                    alt="Document Classification System"
                    max-width="400"
                    class="hero-image"
                    cover
                  />
                </v-col>

                <!-- Content Column -->
                <v-col cols="12" lg="7" md="6">
                  <div class="text-center text-md-start">
                    <h1 class="text-h4 text-md-h3 font-weight-bold mb-2">
                      {{ data.title }}
                    </h1>

                    <h2 class="text-h6 text-md-h5 text-grey-darken-1 mb-3">
                      {{ data.subtitle }}
                    </h2>

                    <p class="text-body-1 text-grey-darken-2 mb-4">
                      {{ data.description }}
                    </p>

                    <div
                      class="d-flex flex-column flex-sm-row gap-2 justify-center justify-md-start"
                    >
                      <v-btn
                        class="text-none mx-4 mx-md-0 me-md-4"
                        color="primary"
                        size="default"
                        variant="elevated"
                        @click="scrollToFeatures"
                      >
                        <v-icon
                          class="me-1"
                          icon="mdi-rocket-launch"
                          size="small"
                        />
                        Explore Features
                      </v-btn>

                      <v-btn
                        class="text-none"
                        color="primary"
                        size="default"
                        variant="outlined"
                        @click="openGithub"
                      >
                        <v-icon class="me-1" icon="mdi-github" size="small" />
                        View Source
                      </v-btn>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </section>

          <!-- Features Section -->
          <section
            id="features"
            class="features-section py-16"
            :style="backgroundImageStyle"
          >
            <v-container>
              <div class="text-center mb-12">
                <h2 class="text-h3 font-weight-bold mb-4 text-grey-darken-1">
                  Key Features
                </h2>
                <p class="text-h6 text-grey-darken-1">
                  Everything you need for modern academic writing
                </p>
              </div>

              <v-row>
                <v-col
                  v-for="(feature, index) in data.features"
                  :key="index"
                  cols="12"
                  lg="3"
                  md="6"
                >
                  <v-card class="h-100" elevation="2" hover>
                    <v-card-text class="text-center pa-6">
                      <v-avatar class="mb-4" color="primary" size="64">
                        <v-icon
                          color="on-primary"
                          :icon="feature.icon"
                          size="32"
                        />
                      </v-avatar>

                      <h3 class="text-h5 font-weight-bold mb-3">
                        {{ feature.title }}
                      </h3>

                      <p class="text-body-1 text-grey-darken-1">
                        {{ feature.description }}
                      </p>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-container>
          </section>

          <!-- About Section -->
          <!-- <section id="about" class="about-section py-16 bg-grey-lighten-4">
            <v-container>
              <v-row align="center" justify="center">
                <v-col cols="12" lg="8" md="10">
                  <div class="text-center">
                    <h2 class="text-h3 font-weight-bold mb-6">
                      About This Template
                    </h2>

                    <div class="pa-8" elevation="4">
                      <v-row align="center">
                        <v-col cols="12" md="8">
                          <h3 class="text-h4 font-weight-bold mb-4">
                            Version {{ data.version }}
                          </h3>
                          <p class="text-h6 text-grey-darken-1 mb-4">
                            Created by {{ data.author }}
                          </p>
                          <p class="text-body-1 text-grey-darken-2">
                            Last updated: {{ formatDate(data.lastUpdated) }}
                          </p>
                        </v-col>

                        <v-col cols="12" md="4">
                          <v-btn
                            block
                            class="text-none"
                            color="primary"
                            size="large"
                            variant="elevated"
                            @click="openDocumentation"
                          >
                            <v-icon class="me-2" icon="mdi-book-open" />
                            Documentation
                          </v-btn>
                        </v-col>
                      </v-row>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </section> -->
        </div>
      </div>
    </template>
  </OuterLayoutWrapper>
</template>

<style scoped>
.min-height-screen {
  min-height: calc(100vh - 64px);
}

.features-section {
  background: white;
  position: relative;
}

.features-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: inherit;
  background-size: inherit;
  background-position: inherit;
  background-repeat: inherit;
  z-index: -1;
}

.features-section .v-container {
  position: relative;
  z-index: 2;
}

.features-section::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  z-index: 1;
}

.about-section {
  background: #fafafa;
}

.gap-4 {
  gap: 1rem;
}

.landing-view {
  min-height: 100vh;
}

.landing-content {
  min-height: 100vh;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .hero-image {
    max-width: 300px;
    margin-bottom: 2rem;
  }
}

@media (max-width: 600px) {
  .hero-image {
    max-width: 250px;
  }
}
</style>
