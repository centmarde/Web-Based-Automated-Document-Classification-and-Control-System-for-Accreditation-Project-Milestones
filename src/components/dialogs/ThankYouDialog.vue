<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTheme } from '@/composables/useTheme'

const props = defineProps<{
  modelValue: boolean
}>()

const { getCurrentTheme } = useTheme()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// Computed for dialog visibility
const dialogVisible = ref(props.modelValue)

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
  dialogVisible.value = newVal
  if (newVal) {
    generateRandomMessage()
  }
})

// Watch for internal changes
watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal)
})

// Random environmental impact data
const carbonSaved = ref(0)
const selectedMessage = ref('')

const environmentalMessages = [
  {
    template: (carbon: number) => `You saved approximately ${carbon}g of CO₂ by going paperless! That's equivalent to driving ${(carbon / 120).toFixed(1)} km less in a car.`,
    icon: 'mdi-car',
    color: 'green'
  },
  {
    template: (carbon: number) => `By digitizing this document, you prevented ${carbon}g of CO₂ emissions! That's like saving ${(carbon / 8.89).toFixed(1)} liters of water used in paper production.`,
    icon: 'mdi-water',
    color: 'blue'
  },
  {
    template: (carbon: number) => `Great job! You saved ${carbon}g of carbon emissions. This helps reduce air pollution and keeps our environment cleaner!`,
    icon: 'mdi-leaf',
    color: 'green'
  },
  {
    template: (carbon: number) => `You've saved ${carbon}g of CO₂ emissions! That's equivalent to planting ${(carbon / 21000).toFixed(2)} trees worth of carbon absorption.`,
    icon: 'mdi-tree',
    color: 'green-darken-2'
  },
  {
    template: (carbon: number) => `By going digital, you saved ${carbon}g of CO₂! This reduces harmful smoke and greenhouse gases from transportation and paper mills.`,
    icon: 'mdi-cloud-off-outline',
    color: 'light-blue'
  },
  {
    template: (carbon: number) => `You prevented ${carbon}g of carbon emissions! That's like reducing vehicle exhaust fumes from ${(carbon / 250).toFixed(1)} km of driving.`,
    icon: 'mdi-smoke',
    color: 'grey-darken-1'
  },
  {
    template: (carbon: number) => `Awesome! You saved ${carbon}g of CO₂. This helps combat climate change and protects our planet for future generations!`,
    icon: 'mdi-earth',
    color: 'blue'
  },
  {
    template: (carbon: number) => `You've avoided ${carbon}g of carbon emissions! That's equivalent to saving enough energy to power a laptop for ${(carbon / 4.3).toFixed(0)} hours.`,
    icon: 'mdi-lightning-bolt',
    color: 'amber'
  }
]

const currentMessageData = ref(environmentalMessages[0])

const generateRandomMessage = () => {
  // Generate random carbon saved between 50g to 500g
  carbonSaved.value = Math.floor(Math.random() * (500 - 50 + 1)) + 50

  // Select random message template
  const randomIndex = Math.floor(Math.random() * environmentalMessages.length)
  currentMessageData.value = environmentalMessages[randomIndex]

  // Generate the message
  selectedMessage.value = currentMessageData.value.template(carbonSaved.value)
}

const closeDialog = () => {
  dialogVisible.value = false
}

// Get current theme for dynamic styling
const isDarkMode = computed(() => getCurrentTheme() === 'dark')
</script>

<template>
  <v-dialog
    v-model="dialogVisible"
    max-width="600px"
    persistent
  >
    <v-card elevation="8">
      <!-- Header with themed background -->
      <v-sheet
        color="primary"
        class="text-center py-6"
      >
        <v-avatar
          color="success"
          size="100"
          class="mb-4"
        >
          <v-icon
            size="60"
          >
            mdi-leaf
          </v-icon>
        </v-avatar>
        <v-card-title class="text-h4 font-weight-bold d-block">
          Thank You! 🎉
        </v-card-title>
        <v-card-subtitle class="mt-2">
          You're making a positive impact on our environment
        </v-card-subtitle>
      </v-sheet>

      <v-divider></v-divider>

      <v-card-text class="pa-6">
        <!-- Environmental Impact Message -->
        <v-alert
          :color="currentMessageData.color"
          variant="tonal"
          class="mb-4"
          border="start"
          prominent
        >
          <template v-slot:prepend>
            <v-icon
              :icon="currentMessageData.icon"
              size="large"
            ></v-icon>
          </template>
          <v-alert-title class="text-h6 font-weight-bold mb-2">
            Environmental Impact
          </v-alert-title>
          <div class="text-body-1">{{ selectedMessage }}</div>
        </v-alert>

        <!-- Additional Benefits -->
        <v-card
          variant="tonal"

          class="mb-4"
        >
          <v-card-text class="pa-4">
            <v-card-title class="text-h6 font-weight-medium pa-0 mb-3">
              Additional Benefits:
            </v-card-title>
            <v-list density="compact" bg-color="transparent">
              <v-list-item
                v-for="(benefit, index) in [
                  { icon: 'mdi-clock-fast', text: 'Faster document processing and retrieval' },
                  { icon: 'mdi-shield-check', text: 'Secure digital storage and backup' },
                  { icon: 'mdi-account-multiple', text: 'Easy collaboration with team members' },
                  { icon: 'mdi-file-search', text: 'Quick search and organization' }
                ]"
                :key="index"
                class="px-0"
              >
                <template v-slot:prepend>
                  <v-icon :icon="benefit.icon" color="primary" size="small"></v-icon>
                </template>
                <v-list-item-title class="text-body-2">
                  {{ benefit.text }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Fun Fact -->
        <v-alert
          variant="outlined"
          color="info"
          density="compact"
        >
          <template v-slot:prepend>
            <v-icon color="info">mdi-information</v-icon>
          </template>
          <div class="text-body-2">
            <strong>Did you know?</strong> Going paperless saves trees, reduces waste, and minimizes the carbon footprint from paper production and transportation!
          </div>
        </v-alert>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="px-6 py-4 justify-center">
        <v-btn
          color="primary"
          variant="elevated"
          size="large"
          @click="closeDialog"
          min-width="150"
          prepend-icon="mdi-check"
        >
          Continue
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
