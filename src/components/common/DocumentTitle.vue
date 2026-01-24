<template>
  <v-tooltip :text="title || 'Untitled Document'" location="top">
    <template #activator="{ props }">
      <h3
        v-bind="props"
        class="text-h6 font-weight-medium mb-1 document-title"
      >
        {{ title || 'Untitled Document' }}
      </h3>
    </template>
  </v-tooltip>
</template>

<script setup lang="ts">
interface Props {
  title?: string
}

const props = defineProps<Props>()
</script>

<style scoped>
.document-title {
  line-height: 1.2 !important;
  height: 2.4em; /* Fixed height for 2 lines */
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  cursor: default;
}

.document-title:hover {
  cursor: help;
}
</style>
