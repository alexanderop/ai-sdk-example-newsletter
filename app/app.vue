<script setup>
const appConfig = useAppConfig()

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

useSeoMeta({
  title: appConfig.site.name,
  description: appConfig.site.description,
  ogTitle: appConfig.site.name,
  ogDescription: appConfig.site.description,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink to="/">
          <AppLogo class="w-auto h-6 shrink-0" />
        </NuxtLink>
      </template>

      <template #center>
        <UHeaderLinks :links="appConfig.navigation.header" />
      </template>

      <template #right>
        <UColorModeButton />

        <UButton
          :to="appConfig.social.github"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator :icon="appConfig.branding.separator.icon" />

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          {{ appConfig.footer.text }}{{ appConfig.footer.showYear ? ` • © ${new Date().getFullYear()}` : '' }}
        </p>
      </template>

      <template #right>
        <UButton
          :to="appConfig.social.github"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UFooter>
  </UApp>
</template>
