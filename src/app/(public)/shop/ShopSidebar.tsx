"use client";
import { useRef, useState } from "react";

interface SubCategory { id: number; name: string; }
interface Category { id: number; name: string; subcategories?: SubCategory[]; }

interface Props {
  categories: Category[];
  activeCategories: string[];
  activeSubcategories: string[];
  onSale: boolean;
  priceMax: number;
  sortBy: string;
}

export default function ShopSidebar({
  categories,
  activeCategories,
  activeSubcategories,
  onSale,
  priceMax,
  sortBy,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [priceDisplay, setPriceDisplay] = useState(priceMax);

  const isAllActive = !activeCategories.length && !activeSubcategories.length && !onSale;

  const submit = () => formRef.current?.submit();

  const toggleSidebar = (show: boolean) => {
    setSidebarOpen(show);
    document.body.style.overflow = show ? "hidden" : "";
  };

  return (
    <>
      {/* Mobile filter button */}
      <button className="mobile-filter-btn" id="filterBtn" onClick={() => toggleSidebar(true)}>
        <img
          src="https://api.iconify.design/lucide:sliders-horizontal.svg?color=%23ffffff"
          style={{ width: 18 }}
          alt="filter"
        />
        Filters
      </button>

      {/* Overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen ? " active" : ""}`}
        id="sidebarOverlay"
        onClick={() => toggleSidebar(false)}
      />

      {/* Sidebar */}
      <aside className={`shop-sidebar${sidebarOpen ? " active" : ""}`} id="shopSidebar">
        <div className="sidebar-header">
          <h3>Filters</h3>
          <button id="closeSidebar" onClick={() => toggleSidebar(false)}>&times;</button>
        </div>

        <form action="/shop" method="GET" id="filterForm" ref={formRef}>
          {/* Categories */}
          <div className="filter-group">
            <h3>Categories</h3>
            <div className="filter-options">
              {/* All Products */}
              <label className="all-prod-label">
                <input
                  type="checkbox"
                  id="allProducts"
                  defaultChecked={isAllActive}
                  onChange={(e) => {
                    if (e.target.checked) {
                      // Uncheck all others, submit
                      formRef.current
                        ?.querySelectorAll<HTMLInputElement>('input[name="category"], input[name="subcategory"], input[name="on_sale"]')
                        .forEach((cb) => (cb.checked = false));
                      toggleSidebar(false);
                      submit();
                    }
                  }}
                />
                All Products
              </label>

              {/* On Sale */}
              <div style={{ marginBottom: 20 }}>
                <label className="category-parent" style={{ color: "var(--gold)", fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    name="on_sale"
                    value="1"
                    defaultChecked={onSale}
                    onChange={() => {
                      const allCb = formRef.current?.querySelector<HTMLInputElement>("#allProducts");
                      if (allCb) allCb.checked = false;
                      toggleSidebar(false);
                      submit();
                    }}
                  />
                  <span className="category-name">
                    <i className="fas fa-tag" /> On Sale
                  </span>
                </label>
              </div>

              {/* Category list */}
              {categories.map((cat) => (
                <div className="filter-category-item" key={cat.id}>
                  <label className="category-parent">
                    <input
                      type="checkbox"
                      name="category"
                      value={cat.name}
                      defaultChecked={activeCategories.includes(cat.name)}
                      onChange={() => {
                        const allCb = formRef.current?.querySelector<HTMLInputElement>("#allProducts");
                        if (allCb) allCb.checked = false;
                        toggleSidebar(false);
                        submit();
                      }}
                    />
                    <span className="category-name">{cat.name}</span>
                  </label>

                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <div className="subcategory-group">
                      {cat.subcategories.map((sub) => (
                        <label className="subcategory-item" key={sub.id}>
                          <input
                            type="checkbox"
                            name="subcategory"
                            value={sub.name}
                            defaultChecked={activeSubcategories.includes(sub.name)}
                            onChange={() => {
                              const allCb = formRef.current?.querySelector<HTMLInputElement>("#allProducts");
                              if (allCb) allCb.checked = false;
                              toggleSidebar(false);
                              submit();
                            }}
                          />
                          <span className="subcategory-name">{sub.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="filter-group">
            <h3>Price Range</h3>
            <div className="price-slider">
              <input
                type="range"
                name="price_max"
                id="priceRangeInput"
                min={0}
                max={10000}
                step={500}
                defaultValue={priceMax}
                onInput={(e) => setPriceDisplay(parseInt((e.target as HTMLInputElement).value))}
                onChange={() => {
                  const allCb = formRef.current?.querySelector<HTMLInputElement>("#allProducts");
                  if (allCb) allCb.checked = false;
                  submit();
                }}
              />
              <div className="price-labels">
                <span>₹0</span>
                <span id="priceRangeValue" style={{ fontWeight: 700, color: "var(--crimson)" }}>
                  Max: ₹{priceDisplay.toLocaleString("en-IN")}
                </span>
                <span>₹10,000+</span>
              </div>
            </div>
          </div>

          {/* Sort By */}
          <div className="filter-group">
            <h3>Sort By</h3>
            <select
              name="sort_by"
              id="sortByInput"
              defaultValue={sortBy}
              onChange={submit}
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="popularity">Popularity</option>
            </select>
          </div>

          <button type="submit" className="apply-filters-btn">Apply Filters</button>
        </form>
      </aside>
    </>
  );
}
