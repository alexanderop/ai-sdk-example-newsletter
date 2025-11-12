import { test, expect } from '@playwright/test'

test.describe('Newsletter Archive Page', () => {
  test('should navigate to newsletter detail page when clicking on a newsletter card', async ({ page }) => {
    // Navigate to the archive page
    await page.goto('/newsletters')

    // Wait for newsletters to load
    await page.waitForSelector('h1:has-text("Newsletter Archive")')

    // Find all newsletter cards
    const newsletterCards = page.locator('[data-testid="newsletter-card"]')

    // Check if there are any newsletters
    const count = await newsletterCards.count()
    expect(count).toBeGreaterThan(0)

    // Get the first newsletter's title for verification
    const firstNewsletterTitle = await newsletterCards.first().locator('h2').textContent()
    expect(firstNewsletterTitle).toBeTruthy()

    // Click on the first newsletter card
    await newsletterCards.first().click()

    // Wait for navigation to complete
    await page.waitForLoadState('networkidle')

    // Verify we're on a newsletter detail page
    // The URL should now be /newsletters/{slug}
    expect(page.url()).toMatch(/\/newsletters\/.+/)

    // Verify the newsletter title appears on the detail page
    const detailPageTitle = await page.locator('h1').textContent()
    expect(detailPageTitle).toContain(firstNewsletterTitle as string)
  })

  test('should show hover effect on newsletter cards', async ({ page }) => {
    await page.goto('/newsletters')
    await page.waitForSelector('h1:has-text("Newsletter Archive")')

    const firstCard = page.locator('[data-testid="newsletter-card"]').first()

    // Hover over the card and check if hover styles are applied
    await firstCard.hover()

    // Check if the card has cursor pointer (indicates it's clickable)
    const cursor = await firstCard.evaluate(el => window.getComputedStyle(el).cursor)
    expect(cursor).toBe('pointer')
  })

  test('should display only one H1 title on newsletter detail page', async ({ page }) => {
    await page.goto('/newsletters')
    await page.waitForSelector('h1:has-text("Newsletter Archive")')

    // Click on the first newsletter
    const firstCard = page.locator('[data-testid="newsletter-card"]').first()
    await firstCard.click()
    await page.waitForLoadState('networkidle')

    // Count H1 elements on the detail page
    const h1Count = await page.locator('h1').count()

    // There should be exactly one H1 (the title in the header)
    expect(h1Count).toBe(1)
  })
})
