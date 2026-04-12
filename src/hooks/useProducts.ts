import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getItem, setItem } from '@/lib/storage'

export interface Product {
  id: string
  name: string
  price: number
  emoji: string | null
  image: string | null
  quantity: number | null
  stock_status: string
  category_id: string | null
  vat_rate: number
  campaign_price: number | null
  campaign_from: string | null
  campaign_to: string | null
  show_on_kiosk: boolean
  sort_weight: number | null
  badge_label: string | null
  badge_color: string | null
}

export interface Category {
  id: string
  name: string
  emoji: string | null
  color: string | null
  sort_order: number | null
}

const PRODUCTS_KEY = 'corevo:products'
const CATEGORIES_KEY = 'corevo:categories'

function getActivePrice(product: Product): number {
  if (
    product.campaign_price !== null &&
    product.campaign_from &&
    product.campaign_to
  ) {
    const now = new Date()
    const from = new Date(product.campaign_from)
    const to = new Date(product.campaign_to)
    if (now >= from && now <= to) {
      return product.campaign_price
    }
  }
  return product.price
}

export function useProducts(tenantId: string | undefined) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    if (!tenantId) return

    try {
      // Load cache first for instant render
      const cachedProducts = await getItem<Product[]>(PRODUCTS_KEY)
      const cachedCategories = await getItem<Category[]>(CATEGORIES_KEY)
      if (cachedProducts) setProducts(cachedProducts)
      if (cachedCategories) setCategories(cachedCategories)

      // Fetch fresh data
      const [prodResult, catResult] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('show_on_kiosk', true)
          .neq('stock_status', 'dold')
          .order('sort_weight', { ascending: true, nullsFirst: false })
          .order('name'),
        supabase
          .from('categories')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('show_on_kiosk', true)
          .order('sort_order', { ascending: true, nullsFirst: false })
          .order('name'),
      ])

      if (prodResult.error) throw new Error(prodResult.error.message)
      if (catResult.error) throw new Error(catResult.error.message)

      const freshProducts = prodResult.data ?? []
      const freshCategories = catResult.data ?? []

      setProducts(freshProducts)
      setCategories(freshCategories)
      setError(null)

      // Cache for offline
      await setItem(PRODUCTS_KEY, freshProducts)
      await setItem(CATEGORIES_KEY, freshCategories)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kunde inte hämta produkter'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Group products by category
  const productsByCategory = categories.map((cat) => ({
    category: cat,
    products: products
      .filter((p) => p.category_id === cat.id)
      .map((p) => ({ ...p, activePrice: getActivePrice(p) })),
  }))

  // Uncategorized products
  const uncategorized = products
    .filter((p) => !p.category_id)
    .map((p) => ({ ...p, activePrice: getActivePrice(p) }))

  return {
    products,
    categories,
    productsByCategory,
    uncategorized,
    isLoading,
    error,
    refresh: fetchProducts,
    getActivePrice,
  }
}
