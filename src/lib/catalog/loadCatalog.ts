import type { Catalog } from '@/types/exercise'

// The JSON is generated and schema-validated by `npm run catalog:build`,
// so it is not parsed again at runtime. Loaded lazily to keep it out of the main bundle.
export async function loadCatalog(): Promise<Catalog> {
  const mod = await import('@/data/exercise-catalog/catalog.json')
  return mod.default as unknown as Catalog
}
