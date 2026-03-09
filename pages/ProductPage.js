const { expect } = require('@playwright/test');

/**
 * Product detail page with Related / Best seller section.
 * Uses text and structure (e.g. "Related", "Best") to find section; counts links to /itm/.
 */
class ProductPage {
  constructor(page) {
    this.page = page;
    // Match eBay PDP: "Similar Items", "More to explore", "Best Sellers", "Related searches"
    this.relatedHeading = page.getByRole('heading', { name: /similar|related|best sell|recommend|more to explore|more item/i });
    this.anyRelatedText = page.locator('text=/similar item|related|best sell|recommend|more to explore|more item/i').first();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('load').catch(() => {});
    // Avoid networkidle on eBay (too many requests); give a short moment for above-the-fold content
    await this.page.waitForTimeout(2000);
  }

  /** Assert that a related/best-seller section or heading is present */
  async expectRelatedSectionVisible() {
    await expect(this.relatedHeading.or(this.anyRelatedText).first()).toBeVisible({ timeout: 15000 });
  }

  /** Assert that the related products section is not displayed (TC-009: no qualifying related products) */
  async expectRelatedSectionNotVisible() {
    await expect(this.relatedHeading.or(this.anyRelatedText).first()).not.toBeVisible({ timeout: 5000 });
  }

  /** Scroll to the related products section (TC-001 step 2). Waits for section then scrolls it into view. */
  async scrollToRelatedProductsSection() {
    const section = this.relatedHeading.or(this.anyRelatedText);
    await section.first().waitFor({ state: 'visible', timeout: 25000 });
    await section.first().scrollIntoViewIfNeeded();
  }

  /**
   * Get the main product's category from the PDP breadcrumb (e.g. "Wristwatches").
   * Uses the last category link in the breadcrumb (href contains /b/).
   */
  async getMainProductCategory() {
    const breadcrumb = this.page.getByRole('navigation', { name: 'breadcrumb' });
    await breadcrumb.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    const categoryLinks = breadcrumb.locator('a[href*="/b/"]');
    const count = await categoryLinks.count();
    if (count === 0) return null;
    const lastCategoryLink = categoryLinks.nth(count - 1);
    return await lastCategoryLink.textContent();
  }

  /**
   * Get hrefs of related product links (/itm/) in the "Similar Items" section, excluding current item.
   */
  async getRelatedProductItemUrls() {
    await this.scrollToRelatedProductsSection();
    const currentItemId = this.page.url().match(/\/itm\/(\d+)/);
    const currentId = currentItemId ? currentItemId[1] : null;
    // Section that has "Similar Items" (or similar) heading and contains /itm/ links
    const similarSection = this.page.locator('section, [class*="carousel"], [class*="similar"], [class*="recs"]')
      .filter({ has: this.page.getByRole('heading', { name: /similar item/i }) })
      .filter({ has: this.page.locator('a[href*="/itm/"]') })
      .first();
    await similarSection.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    const links = similarSection.locator('a[href*="/itm/"]');
    const hrefs = [];
    const n = await links.count();
    for (let i = 0; i < n; i++) {
      const href = await links.nth(i).getAttribute('href');
      if (href && (!currentId || !href.includes(`/itm/${currentId}`))) {
        const fullUrl = href.startsWith('http') ? href : new URL(href, this.page.url()).href;
        hrefs.push(fullUrl);
      }
    }
    return hrefs;
  }

  /**
   * Click the first related product link in the Similar Items section (TC-014).
   * Clicks the first link that is not the current page's item so we navigate to a related product PDP.
   */
  async clickFirstRelatedProduct() {
    await this.scrollToRelatedProductsSection();
    const currentItemId = this.page.url().match(/\/itm\/(\d+)/)?.[1];
    const similarSection = this.page.locator('section, [class*="carousel"], [class*="similar"], [class*="recs"]')
      .filter({ has: this.page.getByRole('heading', { name: /similar item/i }) })
      .filter({ has: this.page.locator('a[href*="/itm/"]') })
      .first();
    await similarSection.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    const links = similarSection.locator('a[href*="/itm/"]');
    const n = await links.count();
    for (let i = 0; i < n; i++) {
      const href = await links.nth(i).getAttribute('href');
      if (!href) continue;
      const match = href.match(/\/itm\/(\d+)/);
      if (match && match[1] !== currentItemId) {
        await links.nth(i).click({ force: true });
        return;
      }
    }
    throw new Error('No related product link found (excluding current item)');
  }
  /**
   * Click the "See all" link in the Similar Items section (TC-015).
   * Navigates to a page listing all related products.
   */
  async clickSeeAllLink() {
    await this.scrollToRelatedProductsSection();
    const similarSection = this.page.locator('section, [class*="carousel"], [class*="similar"], [class*="recs"]')
      .filter({ has: this.page.getByRole('heading', { name: /similar item/i }) })
      .first();
    await similarSection.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    const seeAllLink = similarSection.getByRole('link', { name: /see all/i }).first();
    const href = await seeAllLink.getAttribute('href');
    await seeAllLink.click();
    return href ? (href.startsWith('http') ? href : new URL(href, this.page.url()).href) : null;
  }

  /**
   * Verify each related product card in the Similar Items section has image, title, and price (TC-016).
   * Returns array of { hasImage, hasTitle, hasPrice } for each card (excluding current item).
   */
  async getRelatedCardsDetails() {
    await this.scrollToRelatedProductsSection();
    const currentItemId = this.page.url().match(/\/itm\/(\d+)/)?.[1];
    const similarSection = this.page.locator('section, [class*="carousel"], [class*="similar"], [class*="recs"]')
      .filter({ has: this.page.getByRole('heading', { name: /similar item/i }) })
      .filter({ has: this.page.locator('a[href*="/itm/"]') })
      .first();
    await similarSection.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    return await similarSection.locator('a[href*="/itm/"]').evaluateAll((anchors, currentId) => {
      return anchors.map((a) => {
        const href = a.getAttribute('href') || '';
        const match = href.match(/\/itm\/(\d+)/);
        if (match && currentId && match[1] === currentId) return null;
        const card = a.closest('li, [class*="item"], [class*="card"], [class*="tile"], [class*="cell"], div') || a.parentElement?.parentElement || a.parentElement;
        if (!card) return { hasImage: false, hasTitle: false, hasPrice: false };
        const hasImage = !!card.querySelector('img');
        const titleText = (a.textContent || a.getAttribute('aria-label') || '').trim();
        const hasTitle = titleText.length > 0;
        const cardText = (card.textContent || '');
        const hasPrice = /\$\s*\d+(?:,\d{3})*(?:\.\d{2})?|\$\d+(?:\.\d{2})?/.test(cardText);
        return { hasImage, hasTitle, hasPrice };
      }).filter(Boolean);
    }, currentItemId);
  }

  static parsePrice(text) {
    if (!text || typeof text !== 'string') return null;
    const match = text.replace(/,/g, '').match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
    return match ? parseFloat(match[1]) : null;
  }

  /**
   * Get prices of related products displayed in the Similar Items section (one price per product card).
   * Uses the first $ amount in each card's text to get the main price (ignores "previous price").
   */
  async getRelatedProductPrices() {
    await this.scrollToRelatedProductsSection();
    const similarSection = this.page.locator('section, [class*="carousel"], [class*="similar"], [class*="recs"]')
      .filter({ has: this.page.getByRole('heading', { name: /similar item/i }) })
      .filter({ has: this.page.locator('a[href*="/itm/"]') })
      .first();
    await similarSection.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

    const priceStrings = await similarSection.locator('a[href*="/itm/"]').evaluateAll((anchors) => {
      return anchors.map((a) => {
        const card = a.closest('li, [class*="item"], [class*="card"], [class*="tile"], [class*="cell"], [class*="recs"], div') || a.parentElement?.parentElement || a.parentElement;
        if (!card) return null;
        const text = card.textContent || '';
        const match = text.match(/\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)/);
        return match ? match[0] : null;
      });
    });
    const prices = [];
    for (const t of priceStrings) {
      const p = ProductPage.parsePrice(t);
      if (p != null && p > 0) prices.push(p);
    }
    return prices;
  }
}

module.exports = { ProductPage };
