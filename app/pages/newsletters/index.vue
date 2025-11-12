<script setup lang="ts">
// Query all newsletters, sorted by date (newest first)
const { data: newsletters } = await useAsyncData('newsletters', () =>
  queryCollection('newsletters')
    .order('date', 'DESC')
    .all()
);

useHead({
  title: 'Newsletter Archive - Vue.js Weekly',
  meta: [
    { name: 'description', content: 'Browse all past Vue.js Weekly newsletters' }
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
  <UContainer class="py-12">
    <div class="max-w-4xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">
          Newsletter Archive
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Browse all past newsletters
        </p>
      </div>

      <div v-if="newsletters && newsletters.length > 0" class="space-y-4">
        <UCard
          v-for="newsletter in newsletters"
          :key="newsletter.id"
          :to="newsletter.path"
          class="hover:shadow-lg transition-shadow p-6"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h2 class="text-xl font-semibold mb-2">
                {{ newsletter.title }}
              </h2>

              <time
                :datetime="newsletter.date"
                class="text-sm text-gray-500 dark:text-gray-400"
              >
                {{ formatDate(newsletter.date) }}
              </time>

              <p
                v-if="newsletter.description"
                class="mt-2 text-gray-600 dark:text-gray-300"
              >
                {{ newsletter.description }}
              </p>
            </div>

            <UIcon
              name="i-heroicons-arrow-right"
              class="text-gray-400 ml-4 flex-shrink-0"
            />
          </div>
        </UCard>
      </div>

      <UCard v-else class="p-6">
        <p class="text-gray-600 dark:text-gray-400">
          No newsletters published yet. Check back soon!
        </p>
      </UCard>
    </div>
  </UContainer>
</template>
