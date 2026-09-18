/**
 * India Catalog Service
 *
 * Tries multiple free, no-API-key endpoints in priority order:
 *  1. Open Food Facts — India country filter  (https://in.openfoodfacts.org)
 *  2. Open Food Facts — world (already tried by OpenFoodFactsService before this)
 *  3. Open Food Facts — direct barcode with country hint header
 *
 * This service is called as a fallback BEFORE giving up on a barcode so that
 * Indian-market products (Parle, Amul, Haldiram's, Dabur, Patanjali, etc.)
 * that may only be indexed on the India-specific OFF mirror are still found.
 */
import { Injectable, Logger } from '@nestjs/common';
import { barcodeVariants, primaryBarcode } from './barcode.util';
import { mapOpenFactsProduct } from './open-food-facts.mapper';
import { CatalogProduct, OffApiResponse } from './open-food-facts.types';

const USER_AGENT = 'VeroHealth/0.1 (https://github.com/vero; barcode-lookup; in-market)';
const TIMEOUT_MS = 10_000;

/**
 * Indian barcode prefixes (GS1 India: 890).
 * We use this to decide whether to prioritise the India mirror.
 */
export function isIndianBarcode(barcode: string): boolean {
  const digits = barcode.replace(/\D/g, '');
  return digits.startsWith('890');
}

@Injectable()
export class IndiaCatalogService {
  private readonly logger = new Logger(IndiaCatalogService.name);

  /**
   * Look up a product using India-specific sources.
   * Returns null if nothing is found — never throws.
   */
  async lookup(barcode: string): Promise<CatalogProduct | null> {
    const codes = barcodeVariants(barcode);

    // 1. Open Food Facts India mirror
    for (const code of codes) {
      const result = await this.fetchOff('https://in.openfoodfacts.org', code);
      if (result) return result;
    }

    // 2. World OFF with India country hint (catches products tagged with
    //    'countries_tags: en:india' but not yet on the IN mirror)
    for (const code of codes) {
      const result = await this.fetchOff('https://world.openfoodfacts.org', code, true);
      if (result) return result;
    }

    return null;
  }

  private async fetchOff(
    base: string,
    code: string,
    indiaHint = false,
  ): Promise<CatalogProduct | null> {
    const url = `${base}/api/v2/product/${encodeURIComponent(code)}.json`;
    try {
      const headers: Record<string, string> = {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      };
      if (indiaHint) {
        // Ask OFF to prefer India-market data
        headers['Accept-Language'] = 'en-IN,en;q=0.9,hi;q=0.8';
      }

      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) return null;

      const body = (await response.json()) as OffApiResponse;
      if (body.status !== 1 || !body.product) return null;

      return mapOpenFactsProduct(body.product, primaryBarcode(code), 'food');
    } catch (err) {
      this.logger.warn(`India catalog lookup failed for ${code} at ${base}: ${err}`);
      return null;
    }
  }
}
