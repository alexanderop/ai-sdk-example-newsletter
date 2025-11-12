<script setup lang="ts">
const route = useRoute();

// Query single newsletter by route path
const { data: newsletter } = await useAsyncData(route.path, () =>
  queryCollection('newsletters')
    .path(route.path)
    .first()
);

// Handle 404
if (!newsletter.value) {
  throw createError({
    statusCode: 404,
    message: 'Newsletter not found'
  });
}

// SEO meta tags
useHead({
  title: `${newsletter.value.title} - Vue.js Weekly`,
  meta: [
    { name: 'description', content: newsletter.value.description || newsletter.value.title },
    { property: 'og:title', content: newsletter.value.title },
    { property: 'og:type', content: 'article' },
    { property: 'article:published_time', content: newsletter.value.date }
  ]
});

// Format date helper
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
</script>

<template>
  <UContainer v-if="newsletter" class="py-12">
    <article class="max-w-4xl mx-auto">
      <!-- Back button -->
      <UButton
        to="/newsletters"
        variant="ghost"
        color="gray"
        icon="i-heroicons-arrow-left"
        class="mb-6"
      >
        Back to Archive
      </UButton>

      <!-- Newsletter header -->
      <header class="mb-8">
        <h1 class="text-3xl font-bold mb-3">
          {{ newsletter.title }}
        </h1>

        <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <time :datetime="newsletter.date">
            {{ formatDate(newsletter.date) }}
          </time>

          <span v-if="newsletter.author">
            by {{ newsletter.author }}
          </span>
        </div>
      </header>

      <!-- Newsletter content -->
      <div class="prose dark:prose-invert max-w-none">
        <ContentRenderer :value="newsletter" />
      </div>

      <!-- Footer navigation -->
      <div class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
        <UButton
          to="/newsletters"
          variant="soft"
          color="primary"
        >
          View All Newsletters
        </UButton>
      </div>
    </article>
  </UContainer>
</template>
