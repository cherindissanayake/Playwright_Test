/**
 * Test configuration.
 * TC-001 uses a known main product page with qualifying related products.
 */
module.exports = {
  /** Main product page URL for TC-001 (valid category, qualifying related products) */
  mainProductPageUrl:
    'https://www.ebay.com/itm/406621495050?_skw=watch+women&itmmeta=01KK9KKEG1C49W4T52AFPEYNQQ&hash=item5eac879f0a:g:YMgAAeSwuN9pXZM~&itmprp=enc%3AAQALAAAA8GfYFPkwiKCW4ZNSs2u11xBlHgwJLTssIHN5usKUNCrZqo2OFcvUHgg%2FWe3A%2B4bDLLVnsSExoxVHZO7apqWxZxf2zshzTwPGkjnlzvXGd8%2Fk3AiN2PtdjDmhQwB0HXfP3mdW473Pg0EG6yS7jPWRMUYOPKJptmdcrFoLuBDHAJJAgsuCcLD7XH%2BFHTa6EIU2mOhWZVf5co7OdlsPWd82tF43MriTJFEo8CxO1fkA%2BAsSONGgSvwmtCJsd57VyeFFnzdLriu6RLPUaArNDvfrgs6w9y8KdHxocAA8rcRejCYJpgyQ7tnZ9HpODP%2B39O04Yw%3D%3D%7Ctkp%3ABFBMtujNs5pn',
  /** Expected min/max count of related products on PDP (for future TCs) */
  relatedProductsMin: 1,
  relatedProductsMax: 6,
  /** TC-003: Acceptable price range for related products ($100 - $300) */
  acceptablePriceMin: 100,
  acceptablePriceMax: 300,
  /** TC-009: Optional. Product page URL with no related products (section not displayed). When unset, TC-009 is skipped. */
  mainProductPageUrlNoRelated: null,
  baseURL: 'https://www.ebay.com',
};
