<script setup lang="ts">
const appConfig = useAppConfig()
</script>

<template>
  <div class="flex items-center gap-2">
    <UIcon
      :name="appConfig.branding.logo.icon"
      class="w-6 h-6 text-primary"
    />
    <span class="font-bold text-lg">{{ appConfig.branding.logo.text }}</span>
  </div>
</template>
