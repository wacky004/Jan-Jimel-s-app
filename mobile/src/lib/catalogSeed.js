// Starting catalog — seeded from the official Pricelist 3.
// type: 'party' = individually priced party needs, 'equipment' = items used in packages.

export const PARTY_NEEDS_SEED = [
  { name: 'Monoblock w/ Cover', category: 'Chairs', price: 30 },
  { name: 'Kiddie Set', category: 'Chairs', price: 180 },
  { name: 'Tiffany Chair', category: 'Chairs', price: 80 },
  { name: 'Square Table', category: 'Tables', price: 70 },
  { name: 'Long Table', category: 'Tables', price: 200 },
  { name: 'Round Table (8 Seater)', category: 'Tables', price: 160 },
  { name: 'Round Table (10 Seater)', category: 'Tables', price: 200 },
  { name: 'Half Moon Table', category: 'Tables', price: 150 },
  { name: 'Cocktail Table', category: 'Tables', price: 200 },
  { name: 'Seat Cover', category: 'Linen & Decor', price: 15 },
  { name: 'Colored Toppings', category: 'Linen & Decor', price: 30 },
  { name: 'Ribbon', category: 'Linen & Decor', price: 10 },
  { name: 'Table Napkins', category: 'Linen & Decor', price: 10 },
  { name: 'Outdoor Tent', category: 'Tent', price: 1500 },
]

export const EQUIPMENT_SEED = [
  { name: 'Plates', category: 'Equipment' },
  { name: 'Utensils', category: 'Equipment' },
  { name: 'Chafing Dish', category: 'Equipment' },
  { name: 'Serving Tray', category: 'Equipment' },
  { name: 'Soup Bowls', category: 'Equipment' },
  { name: 'High-Ball Glass', category: 'Equipment' },
  { name: 'Wine Glass', category: 'Equipment' },
  { name: 'Pitcher', category: 'Equipment' },
]

export function seedCatalog() {
  const party = PARTY_NEEDS_SEED.map((it, i) => ({
    id: `seed-party-${i}`,
    type: 'party',
    name: it.name,
    category: it.category,
    price: it.price,
  }))
  const equipment = EQUIPMENT_SEED.map((it, i) => ({
    id: `seed-equip-${i}`,
    type: 'equipment',
    name: it.name,
    category: it.category,
    price: 0,
  }))
  return [...party, ...equipment]
}
