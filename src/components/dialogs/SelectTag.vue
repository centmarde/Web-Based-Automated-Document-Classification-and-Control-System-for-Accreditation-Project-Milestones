<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
	modelValue: boolean
	options: string[]
	selected: string[]
}>()

const emit = defineEmits<{
	'update:modelValue': [value: boolean]
	save: [tags: string[]]
}>()

const open = ref(props.modelValue)
const localSelection = ref<string[]>([...props.selected])

watch(
	() => props.modelValue,
	(val) => {
		open.value = val
		if (val) {
			localSelection.value = [...props.selected]
		}
	},
	{ immediate: true }
)

watch(open, (val) => emit('update:modelValue', val))

const save = () => {
	emit('save', [...localSelection.value])
	open.value = false
}

const clear = () => {
	localSelection.value = []
}
</script>

<template>
	<v-dialog
		v-model="open"
		max-width="520"
		persistent
	>
		<v-card>
			<v-card-title class="d-flex justify-space-between align-center">
				<span class="text-h6">Select Tags</span>
				<v-btn icon variant="text" @click="open = false">
					<v-icon>mdi-close</v-icon>
				</v-btn>
			</v-card-title>
			<v-divider />
			<v-card-text>
				<v-autocomplete
					v-model="localSelection"
					:items="options"
					multiple
					chips
					closable-chips
					clearable
					label="Choose tags"
					density="comfortable"
					prepend-inner-icon="mdi-tag"
				/>
				<div class="text-caption text-medium-emphasis mt-2">
					Select one or more tags to filter the repository.
				</div>
			</v-card-text>
			<v-card-actions class="px-4 pb-4">
				<v-btn variant="text" @click="clear">Clear</v-btn>
				<v-spacer />
				<v-btn variant="text" @click="open = false">Cancel</v-btn>
				<v-btn color="primary" @click="save">Apply</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
