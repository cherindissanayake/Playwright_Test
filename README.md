# Playwright Test – eBay Related / Best Seller Products

Automation for the assessment: related products section on eBay product page.

**Note:** eBay may change page structure and content regularly. Layout or selector changes can cause tests to fail; selectors and expectations may need updating.

## Prerequisites

- **Node.js** 18+ and npm

## No Test Data Provided

The assessment did not supply test data. A fixed main product page URL in `config/testConfig.js` is used (PDP with a related-style section such as “More to explore” / “Best Sellers” / “Related”). Selectors may need tuning if eBay’s DOM changes.

## Setup

```bash
cd d:\Playwright_Test
npm install
npx playwright install
```

## Run Tests

```bash
npm test
```

By default, tests run **headless** (no browser window). To see the browser or use a UI:

| What you want | Command |
|---------------|---------|
| Run all tests (no browser) | `npm test` |
| See browser while tests run | `npm run test:headed` |
| Interactive UI – pick tests, pick browser, watch runs | `npm run test:ui` |
| Open last HTML report | `npm run report` |

### Where to find errors when a test fails

- **Terminal**: The failure message and stack trace are printed in the same terminal where you ran `npm test` (e.g. "Error: expect(locator).toBeVisible() failed" and the file:line).
- **HTML report**: Run `npm run report` after a failed run to open the last report in the browser; it shows which test failed, the error, and links to screenshot/video/trace.
- **Artifacts**: After a failure, check the `test-results/` folder for the failing test’s folder; inside you’ll find `test-failed-1.png` (screenshot), `video.webm` (recording), and `error-context.md` (page snapshot).

## Configuration

- **Main product page**: `config/testConfig.js` → `mainProductPageUrl` (eBay PDP with qualifying related products).
- **TC-009 (no related products)**: `mainProductPageUrlNoRelated` — optional; when set, TC-009 runs. When unset, TC-009 is skipped.
- **Related count & price**: `relatedProductsMin` / `relatedProductsMax`, `acceptablePriceMin` / `acceptablePriceMax` in `config/testConfig.js`.

## Project Layout

- `tests/` – `related-products.spec.js` (TC-001, TC-002, TC-003, TC-006, TC-008, TC-009, TC-014, TC-015, TC-016).
- `pages/` – `ProductPage.js` (related section, scroll, visibility, links, prices, cards).
- `config/testConfig.js` – Main product URL, related-product count bounds, price range, optional no-related URL.

## Test Cases Covered

- **TC-001**: Verify related products section is displayed for a valid main product (open given PDP, scroll to section, assert section is displayed).
- **TC-002**: Verify only products from the same category are displayed. No hardcoded test data: the test gets the main product’s category from the PDP breadcrumb, gets related product links from the “Similar Items” section, opens the first related product, and asserts its breadcrumb category matches the main product’s (spot-check of one related item).
- **TC-003**: Verify products outside the acceptable price range are not displayed (negative). Acceptable range is $100–$300 in config. The test gets related product prices from the Similar Items section and asserts each is within that range.
- **TC-006**: Verify maximum of six related products are displayed (boundary). With test data we would use a product that has **more than six** qualifying related products and assert that only six are shown. Since the eBay PDP used here (no dedicated test data) displays only four related products in the Similar Items section, the test asserts **count ≤ 6** (boundary: at most six) rather than exactly six.
- **TC-008**: Verify behavior when fewer than six related products exist (positive). With test data we would use a product with **fewer than six** qualifying related products and assert only those are displayed (no padding). The test counts displayed related products and asserts the count is between 1 and 6 (only available related products are shown).
- **TC-009**: Verify behavior when no related products exist (negative). The test opens a product page that has **no** qualifying related products and asserts the Related Products section is **not** displayed. **Due to test data unavailability** (we do not have a known product page with zero related products), this test is **skipped** by default. To run it, set `mainProductPageUrlNoRelated` in `config/testConfig.js` to a PDP URL where no related products are shown; the test will then assert the related section is not visible.
- **TC-014**: Verify clicking a related product navigates to its product page (positive). The test opens the main product page, clicks the first related product in the Similar Items section, and asserts the user is navigated to that product’s details page (URL contains `/itm/<id>` and the id is different from the main product).
- **TC-015**: Verify “See all” link navigation (positive). The test opens the main product page, clicks the “See all” link in the Similar Items section, and asserts the user is navigated to a page listing all related products (URL contains `/recs?` or search listing).
- **TC-016**: Verify required product details are displayed for each related product (positive). The test opens the main product page, inspects each related product card in the Similar Items section, and asserts each card shows an image, a title, and a price.

## GitHub

1. Create a new repository on GitHub.
2. In this folder: `git init`, add files, commit, add remote, push.
3. Share the repository link for the assessment.

## Assumptions

- No login required for these checks.
- eBay’s PDP includes a visible related/Best-seller-style section; selectors may need tuning if the site layout changes.
- Tests use publicly accessible eBay product pages for demonstration only (no dedicated test environment or mock was provided). Selectors and data may vary in a controlled QA environment.
