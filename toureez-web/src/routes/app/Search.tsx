import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { searchPackages, packageCoverImage, packageLocationLabel, packagePrice, packageVendorName } from '../../lib/api/packages';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui';
import { Config } from '../../constants/config';

const RIBBONS = ['ribbon-best-price', 'ribbon-top-rated', 'ribbon-local-exclusive'] as const;
const RIBBON_LABELS = ['Best Price', 'Top Rated', 'Local Exclusive'];
const RATING_BUCKETS = [5, 4, 3, 2] as const;
const DURATIONS = ['Any', '0-1 Day', '2-3 Days', '4-7 Days', '7+ Days'] as const;
const DIFFICULTIES = ['Easy', 'Moderate', 'Challenging'] as const;

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [destination, setDestination] = useState(params.get('destination') ?? '');
  const [category, setCategory] = useState(params.get('category') ?? '');
  const [minPrice, setMinPrice] = useState(1000);
  const [maxPrice, setMaxPrice] = useState(15000);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [duration, setDuration] = useState<typeof DURATIONS[number]>('Any');
  const [difficulty, setDifficulty] = useState<typeof DIFFICULTIES[number] | null>('Moderate');
  const [sort, setSort] = useState<'best_match' | 'price_asc' | 'price_desc' | 'rating' | 'newest'>('best_match');
  const [page, setPage] = useState(1);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const query = useQuery({
    queryKey: ['packages', 'search', destination, category, minPrice, maxPrice, minRating, sort, page],
    queryFn: () =>
      searchPackages({
        destination: destination || undefined,
        category: category || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        minRating: minRating ?? undefined,
        sort,
        page,
        pageSize: Config.packagesPageSize,
      }),
  });

  function applyFilters() {
    setPage(1);
    setParams({ destination, category });
  }

  function clearFilters() {
    setDestination('');
    setCategory('');
    setMinPrice(1000);
    setMaxPrice(15000);
    setMinRating(null);
    setDuration('Any');
    setDifficulty(null);
  }

  function toggleCompare(id: string) {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < Config.maxCompareItems ? [...prev, id] : prev
    );
  }

  const items = query.data?.data?.items ?? [];
  const maxReviewCount = Math.max(1, ...items.map((p) => p.review_count ?? 0));

  return (
    <div className="site-content" style={{ paddingBottom: compareIds.length > 0 ? 96 : 64 }}>
      <h1>Search Packages</h1>

      <div className="search-bar-row">
        <span className="search-bar-pill">📍 {destination || 'Anywhere'} ✏️</span>
        <span className="search-bar-pill">🧭 {category || 'All Experiences'}</span>
        <span className="search-bar-pill">📅 Any Date</span>
        <span className="search-bar-pill">👥 2 Travellers</span>
        <button className="btn btn-primary" onClick={applyFilters}>Modify Search</button>
      </div>

      <div className="search-layout">
        <aside className="filters-panel">
          <div className="filters-panel-head">
            <strong>Filters</strong>
            <button onClick={clearFilters}>Clear All</button>
          </div>

          <h3>Destination</h3>
          <input placeholder="City or region" value={destination} onChange={(e) => setDestination(e.target.value)} />

          <h3>Category</h3>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%' }}>
            <option value="">All categories</option>
            {Config.packageCategories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <h3>Price Range</h3>
          <input
            type="range"
            min={500}
            max={50000}
            step={500}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            style={{ width: '100%', padding: 0 }}
          />
          <div className="filter-price-avg">₹{minPrice.toLocaleString()} – ₹{maxPrice.toLocaleString()}+</div>

          <h3>Minimum Rating</h3>
          {RATING_BUCKETS.map((r) => (
            <div key={r} className="filter-rating-bar" onClick={() => setMinRating(minRating === r ? null : r)}>
              <input type="checkbox" readOnly checked={minRating === r} />
              <span>{r.toFixed(1)}+ ★</span>
              <div className="filter-rating-bar-track">
                <div className="filter-rating-bar-fill" style={{ width: `${(r / 5) * 100}%` }} />
              </div>
            </div>
          ))}

          <h3>Duration</h3>
          <div className="filter-btn-group">
            {DURATIONS.map((d) => (
              <button key={d} className={`filter-btn ${duration === d ? 'active' : ''}`} onClick={() => setDuration(d)}>{d}</button>
            ))}
          </div>

          <h3>Difficulty Level</h3>
          <div className="filter-btn-group">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                className={`filter-btn ${difficulty === d ? 'active' : ''}`}
                onClick={() => setDifficulty(difficulty === d ? null : d)}
              >
                {d}
              </button>
            ))}
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={applyFilters}>Apply Filters</button>
        </aside>

        <div>
          <div className="results-toolbar">
            <span className="results-count">{query.data?.data?.total ?? 0} results</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
              <option value="best_match">Recommended</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Rating</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {query.isLoading && <LoadingState />}
          {query.isError && <ErrorState message="Failed to load packages" onRetry={() => query.refetch()} />}
          {items.length === 0 && !query.isLoading && <EmptyState message="No packages match your filters." />}

          <div className="results-list">
            {items.map((pkg, i) => {
              const trustScore = Math.min(99, Math.round(((pkg.review_count ?? 0) / maxReviewCount) * 30 + 65));
              return (
                <div className="trip-card" key={pkg.id}>
                  <Link to={`/app/package/${pkg.id}`}>
                    <div className="trip-card-img">
                      <span className={`ribbon ${RIBBONS[i % RIBBONS.length]}`}>{RIBBON_LABELS[i % RIBBON_LABELS.length]}</span>
                      <span className="trip-card-save">♡</span>
                      {packageCoverImage(pkg) ? (
                        <img src={packageCoverImage(pkg)!} alt={pkg.title} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#FFE8D9,#FFD2B0)' }} />
                      )}
                    </div>
                    <div className="trip-card-body">
                      <div className="trip-card-category-row">
                        <span className="category-tag">{typeof pkg.category === 'string' ? pkg.category : pkg.category?.label ?? pkg.category?.name}</span>
                        <span className="trust-badge">Trust {trustScore}</span>
                      </div>
                      <span className="trip-card-title">{pkg.title}</span>
                      <span className="trip-card-meta">📍 {packageLocationLabel(pkg)}</span>
                      <span className="trip-card-meta">By {packageVendorName(pkg)}</span>
                      {pkg.avg_rating !== undefined && <span className="trip-card-rating">★ {pkg.avg_rating} ({pkg.review_count ?? 0} reviews)</span>}
                      <div className="trip-card-price">
                        <span>From</span>
                        <strong>₹{packagePrice(pkg)?.toLocaleString()}</strong>
                        <span>/person</span>
                      </div>
                    </div>
                  </Link>
                  <div style={{ display: 'flex', gap: 8, margin: '0 14px 14px' }}>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => toggleCompare(pkg.id)}>
                      {compareIds.includes(pkg.id) ? '✓ Added' : 'View & Compare →'}
                    </button>
                  </div>
                </div>
              );
            })}

            {items.length > 4 && (
              <div className="promo-banner">
                <span>🔥 <strong>Limited Time:</strong> Book any trip this week and get free gear rental included.</span>
                <Link to="/app/search" className="btn btn-primary">Explore Offers →</Link>
              </div>
            )}
          </div>

          {query.data?.data && (
            <div className="pagination" style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 24 }}>
              <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span>Page {page}</span>
              <button className="btn btn-outline" disabled={!query.data.data.has_more} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {compareIds.length > 0 && (
        <div className="compare-tray">
          <div className="compare-tray-chips">
            <span>Compare Selected ({compareIds.length})</span>
            {compareIds.map((id) => (
              <span key={id} className="compare-chip">
                {items.find((p) => p.id === id)?.title ?? id}
                <button onClick={() => toggleCompare(id)}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to={`/app/compare?ids=${compareIds.join(',')}`} className="btn btn-primary">Compare Now →</Link>
            <button className="btn btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)' }} onClick={() => setCompareIds([])}>
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
