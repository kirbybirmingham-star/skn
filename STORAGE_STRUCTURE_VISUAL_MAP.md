# 📂 Live Storage Structure - Visual Reference

**Last Updated**: December 31, 2025  
**Data Source**: Live Supabase storage inspection  
**Report**: [storage-structure-report.json](storage-structure-report.json)

---

## 🎯 Complete Bucket Visualization

### Bucket 1: `product-images` (1.61 MB) ⚠️ UNORGANIZED

```
product-images/
├── img_0ab2cce78f3a411c.jpg      (55 KB)
├── img_135f9a30a7674bab.jpg      (26 KB)
├── img_496b174385a447de.jpg      (36 KB)
├── img_4a15a465fead4136.jpg      (135 KB)
├── img_81a7f3ba03da408d.jpg      (931 KB) 🔴 Largest
├── img_a9955506e5d84312.webp     (31 KB)
├── img_acb2fab1afc04c0c.jpg      (307 KB)
└── img_b37fc69de1cc4da6.jpg      (130 KB)

Issues:
  ❌ No folder organization
  ❌ Files in root
  ❌ Duplicates exist elsewhere
  ⚠️ Should consolidate to skn-bridge-assets
```

---

### Bucket 2: `skn-bridge-assets` (5.81 MB) ✅ WELL-ORGANIZED

```
skn-bridge-assets/
│
├── products/                                    (72 files, 4.3 MB)
│   ├── crafts/                                 (12 files, 1.6 MB)
│   │   ├── beaded-necklace.jpg                (300 KB)
│   │   ├── caribbean-bead-necklace.jpg        (712 B) 🔴 Stub
│   │   ├── caribbean-dreamcatcher.jpg         (711 B) 🔴 Stub
│   │   ├── ceramic-bowl-handmade.jpg          (149 KB)
│   │   ├── handwoven-palm-basket.jpg          (710 B) 🔴 Stub
│   │   ├── recycled-glass-wind-chimes.jpg     (715 B) 🔴 Stub
│   │   ├── straw-mat-floor.jpg                (280 KB)
│   │   ├── traditional-calabash-bowl.jpg      (714 B) 🔴 Stub
│   │   ├── wooden-carving-fish.jpg            (31 KB)
│   │   ├── woven-basket-colored.jpg           (177 KB)
│   │   ├── woven-basket-natural.webp          (277 KB)
│   │   └── woven-seagrass-placemats.jpg       (713 B) 🔴 Stub
│   │
│   ├── electronics/                            (10 files, 1.2 MB)
│   │   ├── bluetooth-speaker-portable.jpg     (720 B) 🔴 Stub
│   │   ├── bluetooth-speaker.jpg              (55 KB)
│   │   ├── earbuds-wireless.jpg               (287 KB)
│   │   ├── fitness-tracker.jpg                (25 KB)
│   │   ├── headphones.jpg                     (135 KB)
│   │   ├── phone-case-caribbean.jpg           (714 B) 🔴 Stub
│   │   ├── phone-stand-adjustable.jpg         (31 KB)
│   │   ├── power-bank-solar.jpg               (174 KB)
│   │   ├── power-bank.jpg                     (307 KB)
│   │   └── usb-cable-tropical.jpg             (154 KB)
│   │
│   ├── fashion/                                (19 files, 1.2 MB)
│   │   ├── - caribbean-sundress-blue.jpg      (133 KB)
│   │   ├── - caribbean-sundress-yellow.jpg    (76 KB)
│   │   ├── beach-sandals-brown.jpg            (312 KB)
│   │   ├── beach-sandals-colorful.jpg         (712 B) 🔴 Stub
│   │   ├── caribbean-print-maxi-dress.jpg     (716 B) 🔴 Stub
│   │   ├── caribbean-sundress-yellow.jpg      (715 B) 🔴 Stub
│   │   ├── cotton-tshirt-local.jpg            (59 KB)
│   │   ├── cotton-tshirt-tourist.jpg          (77 KB)
│   │   ├── embroidered-beach-cover-up.jpg     (716 B) 🔴 Stub
│   │   ├── island-linen-shirt.jpg             (708 B) 🔴 Stub
│   │   ├── mens-linen-shirt-blue.jpg          (82 KB)
│   │   ├── mens-linen-shirt-white.jpg         (60 KB)
│   │   ├── palm-leaf-print-hat.jpg            (709 B) 🔴 Stub
│   │   ├── sarong-beach-wrap.jpg              (78 KB)
│   │   ├── straw-hat-colored.jpg              (707 B) 🔴 Stub
│   │   ├── straw-hat-natural.jpg              (466 KB)
│   │   ├── traditional-madras-headwrap.jpg    (717 B) 🔴 Stub
│   │   ├── vibrant-caribbean-sundress.jpg     (716 B) 🔴 Stub
│   │   └── womens-wrap-skirt.jpg              (51 KB)
│   │
│   ├── food/                                   (4 files, 2 KB)
│   │   ├── artisan-bread-loaf.jpg             (705 B) 🔴 Stub
│   │   ├── gourmet-pasta-sauce.jpg            (706 B) 🔴 Stub
│   │   ├── organic-coffee-beans.jpg           (707 B) 🔴 Stub
│   │   └── organic-honey.jpg                  (700 B) 🔴 Stub
│   │
│   ├── produce/                                (15 files, 1.5 MB)
│   │   ├── authentic-jerk-seasoning.jpg       (714 B) 🔴 Stub
│   │   ├── breadfruit-whole.jpg               (52 KB)
│   │   ├── callaloo-bunch.jpg                 (239 KB)
│   │   ├── coconut-young.jpg                  (425 KB)
│   │   ├── coffee.jpg                         (35 KB)
│   │   ├── dried-mango-slices.jpg             (708 B) 🔴 Stub
│   │   ├── fresh-caribbean-mangoes.jpg        (713 B) 🔴 Stub
│   │   ├── fresh-plantains.jpg                (705 B) 🔴 Stub
│   │   ├── fresh-scotch-bonnet-peppers.jpg    (717 B) 🔴 Stub
│   │   ├── fresh-starfruit-carambola.jpg      (715 B) 🔴 Stub
│   │   ├── ginger-root.jpg                    (29 KB)
│   │   ├── hot-pepper-scotch-bonnet.jpg       (53 KB)
│   │   ├── island-curry-powder-blend.jpg      (115 KB)
│   │   ├── mango-fresh.jpg                    (26 KB)
│   │   ├── pineapple-whole.jpg                (412 KB)
│   │   └── sweet-potato-local.jpg             (73 KB)
│   │
│   └── smoothies/                              (10 files, 148 KB)
│       ├── coconut-banana-bliss.jpg           (712 B) 🔴 Stub
│       ├── coconut-water-bottle.jpg           (22 KB)
│       ├── guava-paradise-bowl.jpg            (711 B) 🔴 Stub
│       ├── mango-passion-smoothie.jpg         (714 B) 🔴 Stub
│       ├── mango-smoothie-glass.jpg           (35 KB)
│       ├── pineapple-ginger-cooler.jpg        (715 B) 🔴 Stub
│       ├── pineapple-smoothie-bottle.jpg      (13 KB)
│       ├── soursop-passion-fruit-blend.jpg    (719 B) 🔴 Stub
│       ├── tamarind-ginger-tea.jpg            (711 B) 🔴 Stub
│       └── tropical-fruit-juice.jpg           (23 KB)
│
├── vendors/                                    (8 files, 1.4 MB)
│   ├── avatars/                                (2 files, 95 KB)
│   │   ├── vendor-avatar-1.jpg                (51 KB)
│   │   └── vendor-avatar-2.jpg                (44 KB)
│   │
│   └── banners/                                (6 files, 505 KB)
│       ├── store-banner-crafts.jpg            (35 KB)
│       ├── store-banner-electronics.jpg       (112 KB)
│       ├── store-banner-fashion.jpg           (140 KB)
│       ├── store-banner-general.jpg           (63 KB)
│       ├── store-banner-produce.jpg           (100 KB)
│       └── store-banner-smoothies.jpg         (55 KB)
│
└── users/                                      (1 file, 0 B)
    └── .emptyFolderPlaceholder                (0 B) 🔴 REMOVE
```

---

### Bucket 3: `avatar` (238 KB) ⚠️ REDUNDANT

```
avatar/
├── 0d5c7bcc-10b2-4e45-8ab9-37ed6f00136a-1763185240731.jpg     (130 KB)
├── 0d5c7bcc-10b2-4e45-8ab9-37ed6f00136a-1763191480571.jpg     (83 KB)
└── 0d5c7bcc-10b2-4e45-8ab9-37ed6f00136a-1763191940610.webp    (25 KB)

Issues:
  ❌ Only 3 files - unnecessary bucket
  ❌ Should be in skn-bridge-assets/users/avatars/
  ⚠️ Timestamp-based naming (version history?)
  ⚠️ All same user ID (0d5c7bcc...)

Action: MIGRATE TO skn-bridge-assets
```

---

### Bucket 4: `listings-images` (2.76 MB) 🔴 CRITICAL ISSUES

```
listings-images/
│
├── products/                                   (3 files)
│   ├── Untitled folder/                       🔴 INCOMPLETE!
│   │   └── .emptyFolderPlaceholder            (0 B)
│   │
│   └── island-curry-powder-blend/             (2 files, 127 KB)
│       ├── main.jpg                           (115 KB)
│       └── thumbnails/
│           └── thumb.jpg                      (12 KB)
│
├── vendors/                                    (36+ files, 2.6 MB)
│   │
│   ├── 0f134cb6-9ee5-4e4d-ba50-528cb55d3ca3/ (1 vendor)
│   │   └── products/
│   │       └── bluetooth-speaker/
│   │           └── main.jpg                   (71 KB)
│   │
│   ├── 485aacb6-4418-4467-bbbe-064311b847e6/ (1 vendor - smoothies)
│   │   └── products/
│   │       ├── coconut-banana-bliss/
│   │       │   └── main.jpg                   (712 B) 🔴 Stub
│   │       ├── guava-paradise-bowl/
│   │       │   └── main.jpg                   (711 B) 🔴 Stub
│   │       ├── mango-passion-smoothie/
│   │       │   └── main.jpg                   (714 B) 🔴 Stub
│   │       ├── pineapple-ginger-cooler/
│   │       │   └── main.jpg                   (715 B) 🔴 Stub
│   │       ├── soursop-passion-fruit-blend/
│   │       │   └── main.jpg                   (719 B) 🔴 Stub
│   │       └── tamarind-ginger-tea/
│   │           └── main.jpg                   (711 B) 🔴 Stub
│   │
│   ├── 72db3dcb-8384-49df-ae3a-ad4106371917/ (1 vendor - produce)
│   │   └── products/
│   │       ├── authentic-jerk-seasoning/
│   │       │   └── main.jpg                   (304 KB) 🔴 DUPLICATE
│   │       ├── dried-mango-slices/
│   │       │   └── main.jpg                   (708 B) 🔴 Stub
│   │       ├── fresh-caribbean-mangoes/
│   │       │   └── main.jpg                   (713 B) 🔴 Stub
│   │       ├── fresh-plantains/
│   │       │   └── main.jpg                   (705 B) 🔴 Stub
│   │       ├── fresh-scotch-bonnet-peppers/
│   │       │   └── main.jpg                   (717 B) 🔴 Stub
│   │       ├── fresh-starfruit-carambola/
│   │       │   └── main.jpg                   (715 B) 🔴 Stub
│   │       └── island-curry-powder-blend/
│   │           └── main.jpg                   (115 KB) 🔴 DUPLICATE
│   │
│   ├── 73edbd84-62ff-4fcc-be15-8e45f8a6d966/ (1 vendor - crafts)
│   │   └── products/ (6 files)
│   │       ├── caribbean-bead-necklace/
│   │       ├── caribbean-dreamcatcher/
│   │       ├── handwoven-palm-basket/
│   │       ├── recycled-glass-wind-chimes/
│   │       ├── traditional-calabash-bowl/
│   │       └── woven-seagrass-placemats/
│   │
│   ├── 834883fd-b714-42b6-8480-a52956faf3de/ (1 vendor)
│   │   └── products/
│   │       └── smart-fitness-tracker/
│   │           └── main.jpg                   (25 KB)
│   │
│   ├── a1bc8ec0-7de9-420b-82a5-e03766550def/ (1 vendor)
│   │   └── products/ (3 files)
│   │       ├── artisan-bread-loaf/
│   │       │   └── main.jpg                   (130 KB) 🔴 DUPLICATE
│   │       ├── portable-power-bank/
│   │       │   └── main.jpg                   (307 KB)
│   │       └── premium-wireless-headphones/
│   │           └── main.jpg                   (135 KB)
│   │
│   ├── bb36fe4c-6489-46df-98e7-e0917367d6d1/ (1 vendor - fashion)
│   │   └── products/ (6 files)
│   │       ├── caribbean-print-maxi-dress/
│   │       ├── embroidered-beach-cover-up/
│   │       ├── island-linen-shirt/
│   │       ├── palm-leaf-print-hat/
│   │       ├── traditional-madras-headwrap/
│   │       └── vibrant-caribbean-sundress/
│   │
│   └── undefined/ 🔴🔴🔴 CRITICAL BUG!
│       └── products/ (5 files, 1.4 MB)
│           ├── gourmet-pasta-sauce/
│           │   └── main.jpg                   (931 KB) 🔴 LARGEST!
│           ├── organic-coffee-beans/
│           │   └── main.jpg                   (35 KB)
│           ├── organic-honey/
│           │   └── main.jpg                   (130 KB)
│           ├── portable-power-bank/
│           │   └── main.jpg                   (307 KB)
│           └── premium-wireless-headphones/
│               └── main.jpg                   (135 KB)
│
└── bread.webp                                  (31 KB) 🔴 ORPHANED
```

**Critical Issues**:
- 🔴 "undefined" vendor folder with 1.4 MB (931 KB single file!)
- 🔴 "Untitled folder" incomplete upload
- 🔴 "bread.webp" orphaned in root
- ⚠️ Massive duplication with skn-bridge-assets
- ⚠️ 57 empty folder templates

---

## 🔴 Duplicate Map

### Same File in Multiple Buckets

| File | bucket 1 | bucket 2 | Size Each | Total Duplicate |
|------|----------|----------|-----------|-----------------|
| gourmet-pasta-sauce.jpg | skn-bridge-assets/products/food | listings-images/undefined/products | 706 B + 931 KB | 931 KB |
| authentic-jerk-seasoning.jpg | skn-bridge-assets/products/produce | listings-images/.../authentic-jerk-seasoning | 714 B + 304 KB | 304 KB |
| island-curry-powder-blend.jpg | skn-bridge-assets/products/produce | listings-images/products + listings-images/.../island | Multiple | 230 KB |
| artisan-bread-loaf.jpg | skn-bridge-assets/products/food | listings-images/undefined/products | 705 B + 130 KB | 130 KB |
| **ESTIMATED TOTAL WASTE** | | | | **~1.6 MB** |

---

## 🎯 File Type Distribution

### By Type
| Format | Count | Size | % of Total |
|--------|-------|------|-----------|
| JPEG (.jpg) | 121 | 9.8 MB | 94% |
| WebP (.webp) | 3 | 352 KB | 3% |
| Placeholder | 8 | 5.7 KB | <1% |

### Largest Files
1. 🔴 gourmet-pasta-sauce.jpg - 931 KB
2. 🔴 straw-hat-natural.jpg - 466 KB
3. ⚠️ coconut-young.jpg - 425 KB
4. ⚠️ pineapple-whole.jpg - 412 KB
5. ✅ power-bank.jpg - 307 KB

---

## 📊 Folder Organization Score

| Bucket | Organization | Scalability | Clarity | Issues | Score |
|--------|--------------|-------------|---------|--------|-------|
| product-images | ❌ None | ❌ Poor | ❌ Unclear | Many | 1/10 |
| skn-bridge-assets | ✅ Good | ✅ Good | ✅ Clear | Minor | 8/10 |
| avatar | ⚠️ Minimal | ❌ Poor | ⚠️ Ok | Few | 4/10 |
| listings-images | ❌ Mixed | ⚠️ Fair | ❌ Unclear | Many | 3/10 |

---

## 🎯 Optimization Targets

### Must Remove
- ✅ `product-images` bucket (1.61 MB)
- ✅ `avatar` bucket (238 KB)
- ✅ Duplicate files in listings-images (~1.6 MB)
- ✅ Empty placeholder files (8 files)
- ✅ "Untitled folder" 
- ✅ "undefined" vendor folder (1.4 MB alone!)

### Should Clean
- ⚠️ Stub files (700B-720B) - test data (~50 files)
- ⚠️ Orphaned files (bread.webp in root)

### Consolidate To
- ✅ `skn-bridge-assets` as primary bucket
- ✅ Keep `listings-images` for legacy compatibility (empty out files)

---

## 💾 Storage Calculation

```
Current Usage:
  product-images:    1.61 MB
  skn-bridge-assets: 5.81 MB
  avatar:            238 KB
  listings-images:   2.76 MB
  ─────────────────────────
  TOTAL:            10.41 MB

After Consolidation:
  skn-bridge-assets: 10.00 MB (all + product-images + avatar)
  listings-images:   0.10 MB (legacy only, archived)
  ─────────────────────────
  TOTAL:             10.10 MB

With Duplicate Removal:
  skn-bridge-assets: 8.40 MB (10.00 - 1.6 duplicates)
  listings-images:   0.10 MB
  ─────────────────────────
  TOTAL:             8.50 MB

Savings: 1.91 MB (18% reduction)
```

---

## ✅ Next Steps

1. **Review Structure**: Compare with [STORAGE_OPTIMIZATION_ANALYSIS.md](STORAGE_OPTIMIZATION_ANALYSIS.md)
2. **Create Backup**: Save snapshots of all buckets
3. **Fix Critical Issues**: Remove "undefined" folder immediately
4. **Clean Duplicates**: Remove files from listings-images
5. **Migrate Buckets**: Move avatar and product-images contents
6. **Test**: Verify all URLs work after migration
7. **Archive**: Keep old buckets for 1 week before deletion

