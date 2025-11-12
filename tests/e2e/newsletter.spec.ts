import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Newsletter Platform E2E Tests', () => {
  test('homepage loads and displays correct content', async ({ page }) => {
    await page.goto(BASE_URL)

    // Check main title
    await expect(page.locator('h1')).toContainText('Vue.js Weekly Newsletter')

    // Check description
    await expect(page.getByText('Stay up-to-date with the latest Vue.js news')).toBeVisible()

    // Check CTA buttons exist
    await expect(page.getByRole('link', { name: 'View Archive' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'RSS Feed' })).toBeVisible()

    // Check about section
    await expect(page.getByText('About This Newsletter')).toBeVisible()
  })

  test('newsletter archive page displays newsletters', async ({ page }) => {
    await page.goto(`${BASE_URL}/newsletters`)

    // Check page title
    await expect(page.locator('h1')).toContainText('Newsletter Archive')

    // Check if newsletters are listed (we have 3 migrated)
    const cards = page.locator('.hover\\:shadow-lg')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)

    // Check first newsletter has required elements
    const firstCard = cards.first()
    await expect(firstCard.locator('h2')).toBeVisible()
    await expect(firstCard.locator('time')).toBeVisible()
  })

  test('clicking newsletter opens detail page', async ({ page }) => {
    await page.goto(`${BASE_URL}/newsletters`)

    // Wait for newsletters to load
    await page.waitForSelector('.hover\\:shadow-lg', { timeout: 5000 })

    // Click first newsletter
    const firstCard = page.locator('.hover\\:shadow-lg').first()
    await firstCard.click()

    // Check we're on detail page
    await expect(page.locator('article')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back to Archive' })).toBeVisible()

    // Check newsletter content is rendered
    await expect(page.locator('.prose')).toBeVisible()
  })

  test('back button returns to archive', async ({ page }) => {
    // Navigate to a newsletter detail page
    await page.goto(`${BASE_URL}/newsletters`)
    await page.waitForSelector('.hover\\:shadow-lg', { timeout: 5000 })
    await page.locator('.hover\\:shadow-lg').first().click()

    // Click back button
    await page.getByRole('link', { name: 'Back to Archive' }).click()

    // Verify we're back on archive page
    await expect(page.locator('h1')).toContainText('Newsletter Archive')
    await expect(page.url()).toContain('/newsletters')
    await expect(page.url()).not.toContain('/newsletters/2025')
  })

  test('RSS feed is accessible', async ({ page }) => {
    // Load newsletter config to verify dynamic content
    const configResponse = await page.goto(`${BASE_URL}/api/config`)
    expect(configResponse?.status()).toBe(200)
    const config = await configResponse?.json()
    const newsletterTitle = config?.title || 'Newsletter'

    const response = await page.goto(`${BASE_URL}/rss.xml`)

    // Check response is successful
    expect(response?.status()).toBe(200)

    // Check content type
    const contentType = response?.headers()['content-type']
    expect(contentType).toContain('application/rss+xml')

    // Check RSS content contains expected elements
    const content = await response?.text()
    expect(content).toContain('<?xml')
    expect(content).toContain('<rss')
    expect(content).toContain(newsletterTitle)
  })

  test('navigation between pages works', async ({ page }) => {
    // Start at homepage
    await page.goto(BASE_URL)

    // Navigate to archive
    await page.getByRole('link', { name: 'View Archive' }).click()
    await expect(page.locator('h1')).toContainText('Newsletter Archive')

    // Open a newsletter
    await page.waitForSelector('.hover\\:shadow-lg', { timeout: 5000 })
    await page.locator('.hover\\:shadow-lg').first().click()
    await expect(page.locator('article')).toBeVisible()

    // Use footer link to go back to archive
    await page.getByRole('link', { name: 'View All Newsletters' }).click()
    await expect(page.locator('h1')).toContainText('Newsletter Archive')
  })
})
