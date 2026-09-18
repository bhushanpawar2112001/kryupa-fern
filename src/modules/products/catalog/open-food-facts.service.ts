import { Injectable, Logger } from '@nestjs/common';
import { barcodeVariants, primaryBarcode } from './barcode.util';
import { mapOpenFactsProduct } from './open-food-facts.mapper';
import { CatalogKind, CatalogProduct, OffApiResponse } from './open-food-facts.types';

const USER_AGENT = 'VeroHealth/0.1 (https://github.com/vero; barcode-lookup)';
const TIMEOUT_MS = 10_000;

const ENDPOINTS: { kind: CatalogKind; base: string }[] = [
  { kind: 'food', base: 'https://world.openfoodfacts.org' },
  { kind: 'beauty', base: 'https://world.openbeautyfacts.org' },
];

@Injectable()
export class OpenFoodFactsService {
  private readonly logger = new Logger(OpenFoodFactsService.name);

  async lookup(barcode: string): Promise<CatalogProduct | null> {
    const codes = barcodeVariants(barcode);
    for (const { kind, base } of ENDPOINTS) {
      for (const code of codes) {
        const catalog = await this.fetchProduct(base, code, kind);
        if (catalog) return catalog;
      }
    }
    return null;
  }

  private async fetchProduct(
    base: string,
    code: string,
    kind: CatalogKind,
  ): Promise<CatalogProduct | null> {
    const url = `${base}/api/v2/product/${encodeURIComponent(code)}.json`;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) return null;
      const body = (await response.json()) as OffApiResponse;
      if (body.status !== 1 || !body.product) return null;
      return mapOpenFactsProduct(body.product, primaryBarcode(code), kind);
    } catch (err) {
      this.logger.warn(`Open Facts lookup failed for ${code} at ${base}: ${err}`);
      return null;
    }
  }
}
