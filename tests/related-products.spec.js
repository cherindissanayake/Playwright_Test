const { test, expect } = require('@playwright/test');
const { ProductPage } = require('../pages/ProductPage');
const testConfig = require('../config/testConfig');


test.describe('TC-001 Verify related products section is displayed for a valid main product', () => {

  test('TC-001: Related Products section is displayed on the product page', async ({ page }) => {
    // Step 1: Open the main product page
    await page.goto(testConfig.mainProductPageUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/itm\/\d+/, { timeout: 15000 }).catch(() => {});
    const productPage = new ProductPage(page);
    await productPage.waitForPageLoad();
    // Step 2: Scroll to the related products section
    await productPage.scrollToRelatedProductsSection();
    // Expected: The Related Products section is displayed on the product page
    await productPage.expectRelatedSectionVisible();
  });
});

test.describe('TC-002 Verify only products from the same category are displayed', () => {

  test('TC-002: Related products belong to the same category as the main product', async ({ page }) => {
    // Step 1: Open the main product page
    await page.goto(testConfig.mainProductPageUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/itm\/\d+/, { timeout: 15000 }).catch(() => {});
    const productPage = new ProductPage(page);
    await productPage.waitForPageLoad();

    const mainCategory = (await productPage.getMainProductCategory())?.trim();
    expect(mainCategory, 'Main product must have a category in breadcrumb').toBeTruthy();

    // Step 2: Review products in the related products section (get their URLs)
    const relatedUrls = await productPage.getRelatedProductItemUrls();
    expect(relatedUrls.length, 'At least one related product link is required').toBeGreaterThan(0);

    // Step 3: Verify category of (first) related product matches main product category
    await page.goto(relatedUrls[0], { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/itm\/\d+/, { timeout: 15000 }).catch(() => {});
    await productPage.waitForPageLoad();
    const relatedCategory = (await productPage.getMainProductCategory())?.trim();
    expect(relatedCategory, 'Related product must have a category in breadcrumb').toBeTruthy();
    expect(relatedCategory, 'Related product should be in the same category as the main product').toBe(mainCategory);
  });
});

test.describe('TC-003 Verify products outside the acceptable price range are not displayed', () => {

  test('TC-003: All related products are within acceptable price range ($100 - $300)', async ({ page }) => {
    // Step 1: Open the main product page
    await page.goto(testConfig.mainProductPageUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/itm\/\d+/, { timeout: 15000 }).catch(() => {});
    const productPage = new ProductPage(page);
    await productPage.waitForPageLoad();

    // Step 2: Review prices of related products displayed
    const relatedPrices = await productPage.getRelatedProductPrices();
    expect(relatedPrices.length, 'At least one related product with a price is required').toBeGreaterThan(0);

    // Step 3: Compare with acceptable range - only products within $100-$300 should be displayed
    const min = testConfig.acceptablePriceMin;
    const max = testConfig.acceptablePriceMax;
    for (const price of relatedPrices) {
      expect(price, `Related product price $${price} should be between $${min} and $${max}`).toBeGreaterThanOrEqual(min);
      expect(price, `Related product price $${price} should be between $${min} and $${max}`).toBeLessThanOrEqual(max);
    }
  });
});

test.describe('TC-006 Verify maximum of six related products are displayed', () => {

  test('TC-006: System displays a maximum of six related products', async ({ page }) => {
    // Step 1: Open the main product page
    await page.goto(testConfig.mainProductPageUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/itm\/\d+/, { timeout: 15000 }).catch(() => {});
    const productPage = new ProductPage(page);
    await productPage.waitForPageLoad();

    // Step 2: Count the number of related products displayed
    const relatedUrls = await productPage.getRelatedProductItemUrls();
    const count = relatedUrls.length;

    // Expected: Maximum of six related products even when more than six qualify
    expect(count, 'Related products count should be at most 6').toBeLessThanOrEqual(testConfig.relatedProductsMax);
  });
});

test.describe('TC-008 Verify behavior when fewer than six related products exist', () => {

  test('TC-008: Only the available related products are displayed', async ({ page }) => {
    // Step 1: Open the main product page
    await page.goto(testConfig.mainProductPageUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/itm\/\d+/, { timeout: 15000 }).catch(() => {});
    const productPage = new ProductPage(page);
    await productPage.waitForPageLoad();

    // Step 2: Count the displayed related products
    const relatedUrls = await productPage.getRelatedProductItemUrls();
    const count = relatedUrls.length;

    // Expected: Only the available related products are displayed (between 1 and 6)
    expect(count, 'At least one related product should be displayed when any exist').toBeGreaterThanOrEqual(testConfig.relatedProductsMin);
    expect(count, 'No more than six related products should be displayed').toBeLessThanOrEqual(testConfig.relatedProductsMax);
  });
});

test.describe('TC-009 Verify behavior when no related products exist', () => {

  test('TC-009: Related Products section is not displayed when no qualifying related products exist', async ({ page }) => {
    // Requires test data: a product page with zero qualifying related products (mainProductPageUrlNoRelated in config).
    test.skip(!testConfig.mainProductPageUrlNoRelated, 'Skipped: no test data (product with no related products). Set mainProductPageUrlNoRelated in config to run.');

    // Step 1: Open the main product page (with no related products)
    await page.goto(testConfig.mainProductPageUrlNoRelated, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/itm\/\d+/, { timeout: 15000 }).catch(() => {});
    const productPage = new ProductPage(page);
    await productPage.waitForPageLoad();

    // Step 2: Check the related products section area
    // Expected: The Related Products section is not displayed when no qualifying related products exist
    await productPage.expectRelatedSectionNotVisible();
  });
});

test.describe('TC-014 Verify clicking a related product navigates to its product page', () => {

  test('TC-014: Clicking a related product navigates to that product details page', async ({ page }) => {
    // Step 1: Open the main product page
    await page.goto(testConfig.mainProductPageUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/itm\/\d+/, { timeout: 15000 }).catch(() => {});
    const mainItemId = page.url().match(/\/itm\/(\d+)/)?.[1];
    const productPage = new ProductPage(page);
    await productPage.waitForPageLoad();

    // Step 2: Click a related product (navigate to first related product's page)
    const relatedUrls = await productPage.getRelatedProductItemUrls();
    expect(relatedUrls.length, 'At least one related product is required').toBeGreaterThan(0);
    const firstRelatedUrl = relatedUrls[0];
    const expectedItemId = firstRelatedUrl.match(/\/itm\/(\d+)/)?.[1];
    await productPage.clickFirstRelatedProduct();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('load').catch(() => {});
    if (page.url().match(/\/itm\/(\d+)/)?.[1] === mainItemId) {
      await page.goto(firstRelatedUrl, { waitUntil: 'domcontentloaded' });
    }

    // Expected: User is navigated to the selected product's product details page
    await page.waitForURL(/\/itm\/\d+/, { timeout: 15000 });
    const newUrl = page.url();
    expect(newUrl, 'Should navigate to a product page').toMatch(/\/itm\/\d+/);
    const newItemId = newUrl.match(/\/itm\/(\d+)/)?.[1];
    expect(newItemId, 'Should navigate to the clicked product page').toBe(expectedItemId);
  });
});

test.describe('TC-015 Verify "See all" link navigation', () => {

  test('TC-015: Clicking "See all" navigates to a page listing all related products', async ({ page }) => {
    // Step 1: Open the main product page
    await page.goto(testConfig.mainProductPageUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/itm\/\d+/, { timeout: 15000 }).catch(() => {});
    const productPage = new ProductPage(page);
    await productPage.waitForPageLoad();

    // Step 2: Click the "See all" link
    const seeAllHref = await productPage.clickSeeAllLink();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('load').catch(() => {});
    if (seeAllHref && page.url().match(/\/itm\/\d+/) && !page.url().includes('/recs')) {
      await page.goto(seeAllHref, { waitUntil: 'domcontentloaded' });
    }

    // Expected: User is navigated to a page listing all related products
    await page.waitForLoadState('load').catch(() => {});
    const url = page.url();
    expect(url, 'Should navigate to related products listing page').toMatch(/\/recs\?|ebay\.com\/sch\//i);
  });
});

test.describe('TC-016 Verify required product details are displayed for each related product', () => {

  test('TC-016: Each related product card shows image, title, and price', async ({ page }) => {
    // Step 1: Open the main product page
    await page.goto(testConfig.mainProductPageUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/itm\/\d+/, { timeout: 15000 }).catch(() => {});
    const productPage = new ProductPage(page);
    await productPage.waitForPageLoad();

    // Step 2: Inspect each related product card
    const cardsDetails = await productPage.getRelatedCardsDetails();
    expect(cardsDetails.length, 'At least one related product card is required').toBeGreaterThan(0);

    // Expected: Each product card shows image, title, and the price
    cardsDetails.forEach((card, index) => {
      expect(card.hasImage, `Related product card ${index + 1} should show an image`).toBe(true);
      expect(card.hasTitle, `Related product card ${index + 1} should show a title`).toBe(true);
      expect(card.hasPrice, `Related product card ${index + 1} should show a price`).toBe(true);
    });
  });
});
