<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: 'Delete Document' },
  message: { type: String, default: 'Are you sure you want to delete this document and its file? This action cannot be undone.' },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const open = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const close = () => {
  emit('update:modelValue', false)
  emit('cancel')
}

const confirm = () => {
  emit('confirm')
}
</script>

<template>
  <v-dialog v-model="open" max-width="420">
    <v-card>
      <v-card-title class="text-h6 font-weight-bold">
        {{ title }}
      </v-card-title>
      <v-card-text class="text-body-2">
        {{ message }}
      </v-card-text>
      <v-card-actions class="justify-end ga-2 pb-4 px-4">
        <v-btn variant="text" @click="close" :disabled="loading">
          Cancel
        </v-btn>
        <v-btn color="error" variant="elevated" prepend-icon="mdi-delete" @click="confirm" :loading="loading">
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>