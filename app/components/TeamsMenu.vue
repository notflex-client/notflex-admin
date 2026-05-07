<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <UButton
    color="neutral"
    variant="ghost"
    block
    :square="collapsed"
    class="py-2"
    :ui="{ leadingIcon: 'text-primary' }"
  >
    <template #leading>
      <svg
        width="20"
        height="20"
        viewBox="0 0 111 152"
        fill="none"
        aria-hidden="true"
      >
        <path d="M0 0h28.5l54 139.5V0H111v152H83L28.5 12V152H0V0Z" fill="#E50914" />
      </svg>
    </template>
    <span v-if="!collapsed" class="font-bold tracking-widest text-sm">NOTFLEX</span>
  </UButton>
</template>
