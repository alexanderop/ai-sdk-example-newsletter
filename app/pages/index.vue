<script setup lang="ts">
useHead({
  title: 'Vue.js Weekly Newsletter',
  meta: [
    { name: 'description', content: 'Weekly Vue.js news and community updates' }
  ],
  link: [
    {
      rel: 'alternate',
      type: 'application/rss+xml',
      title: 'RSS Feed',
      href: '/rss.xml'
    }
  ]
});
</script>

<template>
  <UContainer class="py-12">
    <div class="max-w-3xl mx-auto text-center">
      <h1 class="text-4xl font-bold mb-4">
        Vue.js Weekly Newsletter
      </h1>

      <p class="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Stay up-to-date with the latest Vue.js news, articles, and community updates.
      </p>

      <div class="flex gap-4 justify-center mb-12">
        <UButton
          to="/newsletters"
          size="lg"
          color="primary"
        >
          View Archive
        </UButton>

        <UButton
          to="/rss.xml"
          size="lg"
          variant="outline"
          color="neutral"
          icon="i-heroicons-rss"
        >
          RSS Feed
        </UButton>
      </div>

      <div class="prose dark:prose-invert mx-auto text-left">
        <h2>About This Newsletter</h2>
        <p>
          This newsletter curates the best Vue.js content from across the web,
          including blog posts, GitHub repositories, community discussions, and more.
          Published weekly, it helps you stay current with the Vue.js ecosystem.
        </p>

        <h2>Stay Connected</h2>
        <p>
          Subscribe via RSS to never miss an issue. All newsletters are archived
          and available for browsing anytime.
        </p>
      </div>
    </div>
  </UContainer>
</template>
