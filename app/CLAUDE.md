# Nuxt Application Guidelines

This file provides guidance specific to the Nuxt 4 web application in `/app`.

## Purpose

This is a standard Nuxt 4 application using Nuxt UI components. The app serves as a web interface for the newsletter generator project.

## Architecture

### Directory Structure

```
/app
├── components/      # Vue components
├── pages/          # File-based routing pages
├── assets/         # CSS, images, fonts
├── app.config.ts   # App-level configuration
└── app.vue         # Root app component
```

### Key Technologies

- **Nuxt 4** - Vue meta-framework with SSR/SSG
- **Nuxt UI** - Pre-built UI components
- **Vue 3** - Composition API preferred
- **TypeScript** - Full type safety

## Component Guidelines

### Component Structure

**Prefer Composition API with `<script setup>`:**

```vue
<script setup lang="ts">
// Imports
import { ref, computed } from 'vue'

// Props with TypeScript
interface Props {
  title: string
  count?: number
}
const props = withDefaults(defineProps<Props>(), {
  count: 0
})

// Emits
interface Emits {
  (e: 'update', value: string): void
}
const emit = defineEmits<Emits>()

// State
const state = ref<string>('')

// Computed
const displayText = computed(() => `${props.title}: ${state.value}`)

// Methods
function handleClick(): void {
  emit('update', state.value)
}
</script>

<template>
  <div>
    <h1>{{ displayText }}</h1>
    <button @click="handleClick">Update</button>
  </div>
</template>

<style scoped>
/* Component-specific styles */
</style>
```

### Component Naming

**Files:** PascalCase.vue
```
UserProfile.vue    ✅
user-profile.vue   ❌
```

**Template refs:** Use PascalCase for components, kebab-case in templates
```vue
<script setup lang="ts">
import UserProfile from '~/components/UserProfile.vue'
</script>

<template>
  <UserProfile />  <!-- PascalCase in template -->
</template>
```

### Component Organization

**Single Responsibility:**
- Each component should do one thing well
- Split complex components into smaller pieces
- Use composables for shared logic

**File Structure:**
```
/components
├── layout/
│   ├── Header.vue
│   └── Footer.vue
├── ui/              # Reusable UI components
│   ├── Button.vue
│   └── Card.vue
└── features/        # Feature-specific components
    └── Newsletter/
        ├── NewsletterList.vue
        └── NewsletterItem.vue
```

## Composables

### When to Create Composables

Create composables for:
- Shared stateful logic
- Reusable data fetching
- Complex computed values used across components
- Integration with browser APIs

### Composable Structure

**File naming:** `use` prefix, camelCase
```
useNewsletters.ts  ✅
newsletters.ts     ❌
```

**Example composable:**
```typescript
// composables/useNewsletters.ts
import { ref, computed } from 'vue'

export function useNewsletters() {
  const newsletters = ref<Newsletter[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const sortedNewsletters = computed(() =>
    newsletters.value.sort((a, b) => b.date.localeCompare(a.date))
  )

  async function fetchNewsletters(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch('/api/newsletters')
      newsletters.value = data
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  return {
    newsletters: sortedNewsletters,
    loading: readonly(loading),
    error: readonly(error),
    fetchNewsletters
  }
}
```

## Pages and Routing

### File-Based Routing

Nuxt uses file-based routing from `/app/pages`:

```
/pages
├── index.vue           → /
├── about.vue           → /about
├── newsletters/
│   ├── index.vue       → /newsletters
│   └── [id].vue        → /newsletters/:id
```

### Page Component Structure

```vue
<script setup lang="ts">
// SEO meta tags
definePageMeta({
  title: 'Newsletter Archive',
  description: 'Browse our Vue.js newsletter archive'
})

// Page-specific logic
const route = useRoute()
const { data } = await useFetch(`/api/newsletters/${route.params.id}`)
</script>

<template>
  <div>
    <h1>{{ data?.title }}</h1>
    <!-- Page content -->
  </div>
</template>
```

## State Management

### Local State

Use `ref()` and `reactive()` for component-local state:

```typescript
const count = ref(0)              // Primitives
const user = reactive({           // Objects
  name: 'John',
  email: 'john@example.com'
})
```

### Shared State

For state shared across pages/components:

**Option 1: Composables with shared refs**
```typescript
// composables/useAuth.ts
const currentUser = ref<User | null>(null) // Shared across all imports

export function useAuth() {
  return { currentUser }
}
```

**Option 2: Pinia (if needed)**
- Use Pinia for complex application state
- Define typed stores in `/stores`

## Styling

### Style Approach

**Prefer Scoped Styles:**
```vue
<style scoped>
.button {
  /* Only affects this component */
}
</style>
```

**Global Styles:**
```
/app/assets/css/
├── main.css         # Global styles
└── variables.css    # CSS variables
```

### Nuxt UI Components

**Use Nuxt UI components when available:**
```vue
<template>
  <!-- Use built-in components -->
  <UButton @click="handleClick">Click Me</UButton>
  <UCard>
    <template #header>
      <h3>Card Title</h3>
    </template>
    <p>Card content</p>
  </UCard>
</template>
```

**Refer to Nuxt UI docs:** https://ui.nuxt.com/

## Type Safety

### Props and Emits

**Always type props and emits:**

```vue
<script setup lang="ts">
// Props interface
interface Props {
  title: string
  items: string[]
  optional?: boolean
}
const props = defineProps<Props>()

// Emits interface
interface Emits {
  (e: 'select', item: string): void
  (e: 'close'): void
}
const emit = defineEmits<Emits>()
</script>
```

### Composable Return Types

**Explicitly type composable returns:**

```typescript
interface UseNewslettersReturn {
  newsletters: ComputedRef<Newsletter[]>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<Error | null>>
  fetchNewsletters: () => Promise<void>
}

export function useNewsletters(): UseNewslettersReturn {
  // Implementation
}
```

## Data Fetching

### Use Nuxt's Data Fetching Utilities

**`useFetch` for API calls:**
```typescript
const { data, pending, error, refresh } = await useFetch('/api/newsletters')
```

**`useAsyncData` for custom logic:**
```typescript
const { data } = await useAsyncData('newsletters', async () => {
  // Custom fetching logic
  return fetchNewsletters()
})
```

### Error Handling

```typescript
const { data, error } = await useFetch('/api/newsletters')

if (error.value) {
  console.error('Failed to fetch newsletters:', error.value)
  // Show error UI
}
```

## Testing

### Component Tests

Write tests for components in `tests/components/`:

```typescript
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import UserProfile from '~/app/components/UserProfile.vue'

describe('UserProfile', () => {
  it('renders user name', () => {
    const wrapper = mount(UserProfile, {
      props: { name: 'John Doe' }
    })
    expect(wrapper.text()).toContain('John Doe')
  })
})
```

### Composable Tests

Test composables in `tests/composables/`:

```typescript
import { describe, it, expect } from 'vitest'
import { useNewsletters } from '~/app/composables/useNewsletters'

describe('useNewsletters', () => {
  it('fetches newsletters', async () => {
    const { newsletters, fetchNewsletters } = useNewsletters()
    await fetchNewsletters()
    expect(newsletters.value).toHaveLength(10)
  })
})
```

## Common Patterns

### Loading States

```vue
<script setup lang="ts">
const { data, pending } = await useFetch('/api/newsletters')
</script>

<template>
  <div>
    <div v-if="pending">Loading...</div>
    <div v-else-if="data">
      <!-- Show data -->
    </div>
  </div>
</template>
```

### Error Boundaries

```vue
<script setup lang="ts">
const { data, error } = await useFetch('/api/newsletters')
</script>

<template>
  <div>
    <div v-if="error" class="error">
      Failed to load: {{ error.message }}
    </div>
    <div v-else>
      <!-- Normal content -->
    </div>
  </div>
</template>
```

## Best Practices

### Component Design

✅ **DO:**
- Keep components small and focused
- Use TypeScript for all props and emits
- Prefer Composition API over Options API
- Extract reusable logic to composables
- Use Nuxt UI components when available

❌ **DON'T:**
- Create components with hundreds of lines
- Use `any` types
- Mix Options API and Composition API
- Duplicate logic across components
- Reinvent UI components that exist in Nuxt UI

### Performance

✅ **DO:**
- Use `v-once` for static content
- Use `v-memo` for expensive renders
- Lazy load components with `defineAsyncComponent`
- Use `useFetch` for automatic caching

❌ **DON'T:**
- Fetch data in `onMounted` (use `useFetch` instead)
- Put heavy computation in templates
- Create unnecessary watchers
- Skip lazy loading for route components

### Accessibility

✅ **DO:**
- Use semantic HTML elements
- Add proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers

❌ **DON'T:**
- Use `<div>` for buttons (use `<button>`)
- Skip alt text on images
- Rely only on color for information
- Ignore focus management

## Common Tasks

### Adding a New Page

1. Create file in `/app/pages/` (e.g., `about.vue`)
2. Add `definePageMeta()` for SEO
3. Implement page logic with Composition API
4. Test navigation to the page

### Creating a New Component

1. Create component file in `/app/components/` with PascalCase name
2. Define props interface with TypeScript
3. Define emits interface if needed
4. Implement component logic
5. Add scoped styles
6. Write component tests

### Adding a Composable

1. Create file in `/app/composables/` with `use` prefix
2. Define clear return type interface
3. Export composable function
4. Write unit tests
5. Use in components
