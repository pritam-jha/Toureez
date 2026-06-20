import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getPackageDetail, getSimilarPackages, packageCoverImage, packageLocationLabel, packagePrice, packageVendorName } from '../../lib/api/packages';
import { getPackageReviews } from '../../lib/api/reviews';
import { toggleWishlist } from '../../lib/api/wishlist';
import { LoadingState, ErrorState, Card } from '../../components/ui';

const ICONS: Record<string, string> = {
  default: '✨',
};

export default function PackageDetail() {
  const { id } = useParams<{ id: string }>();
  const [travelers, setTravelers] = useState(2);
  const packageQuery = useQuery({
    queryKey: ['package', id],
    queryFn: () => getPackageDetail(id!),
    enabled: !!id,
  });
  const reviewsQuery = useQuery({
    queryKey: ['package', id, 'reviews'],
    queryFn: () => getPackageReviews(id!),
    enabled: !!id,
  });
  const similarQuery = useQuery({
    queryKey: ['package', id, 'similar'],
    queryFn: () => getSimilarPackages(id!),
    enabled: !!id,
  });

  if (packageQuery.isLoading) return <LoadingState />;
  if (packageQuery.isError || !packageQuery.data?.data) {
    return <ErrorState message="Failed to load package" onRetry={() => packageQuery.refetch()} />;
  }

  const pkg = packageQuery.data.data;
  const cover = packageCoverImage(pkg);
  const basePrice = packagePrice(pkg) ?? 0;
  const fees = Math.round(basePrice * 0.02);
  const total = basePrice * travelers + fees;
  const reviews = reviewsQuery.data?.data ?? [];
  const categoryLabel = typeof pkg.category === 'string' ? pkg.category : pkg.category?.label ?? pkg.category?.name;

  const ratingBuckets = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(r.overall_rating) === star).length;
    return { star, pct: reviews.length ? Math.round((count / reviews.length) * 100) : 0 };
  });

  return (
    <div className="site-content">
      <div className="pd-breadcrumb">
        <Link to="/app">Home</Link> / <Link to="/app/search">{categoryLabel ?? 'Experiences'}</Link> / {pkg.title}
      </div>

      <div className="pd-gallery">
        <div className="pd-gallery-main">
          {cover ? <img src={cover} alt={pkg.title} /> : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#FFE8D9,#FFD2B0)' }} />}
        </div>
        <div className="pd-gallery-thumb">
          {cover ? <img src={cover} alt="" /> : <div style={{ width: '100%', height: '100%', background: '#FFE8D9' }} />}
        </div>
        <div className="pd-gallery-thumb">
          {cover ? <img src={cover} alt="" /> : <div style={{ width: '100%', height: '100%', background: '#FFD2B0' }} />}
        </div>
        <div className="pd-gallery-thumb">
          {cover ? <img src={cover} alt="" /> : <div style={{ width: '100%', height: '100%', background: '#FFE8D9' }} />}
        </div>
        <div className="pd-gallery-thumb">
          {cover ? <img src={cover} alt="" /> : <div style={{ width: '100%', height: '100%', background: '#FFD2B0' }} />}
          <span className="pd-gallery-more">View All Photos</span>
        </div>
      </div>

      <div className="pd-layout">
        <div>
          {categoryLabel && <div className="pd-category-tag">{categoryLabel} · {pkg.duration_days ?? '–'} Days</div>}
          <div className="pd-title-row">
            <div>
              <h1>{pkg.title}</h1>
              <p className="pd-subtitle">{pkg.duration_days ? `${pkg.duration_days} Days of Adventure through ${packageLocationLabel(pkg)}` : packageLocationLabel(pkg)}</p>
            </div>
            <button className="btn btn-outline" onClick={() => void toggleWishlist(pkg.id)}>♥ Save</button>
          </div>

          <div className="pd-vendor-row">
            <div className="pd-vendor-avatar">{packageVendorName(pkg).slice(0, 1) || 'V'}</div>
            <div>
              <div className="pd-vendor-name">{packageVendorName(pkg)} {pkg.company?.is_verified && <span className="trust-badge">Verified Operator</span>}</div>
              <div className="pd-vendor-meta">
                {pkg.avg_rating !== undefined && <>★ {pkg.avg_rating} Ratings ({pkg.review_count ?? 0} reviews)</>}
              </div>
            </div>
          </div>

          <div className="pd-meta-row">
            <span className="pd-meta-pill"><strong>{pkg.duration_days ?? '–'} Days</strong>Duration</span>
            <span className="pd-meta-pill"><strong>{pkg.min_group_size ?? 1}–{pkg.max_group_size ?? 12}</strong>Group Size</span>
            <span className="pd-meta-pill"><strong>{packageLocationLabel(pkg)}</strong>Location</span>
            <span className="pd-rating-badge">★ {pkg.avg_rating ?? '—'} ({pkg.review_count ?? 0})</span>
          </div>

          <p>{pkg.description}</p>

          {pkg.highlights && pkg.highlights.length > 0 && (
            <section className="pd-section">
              <h2>Highlights</h2>
              <div className="icon-grid">
                {pkg.highlights.map((h) => (
                  <div className="icon-card" key={h}>
                    <div className="icon-card-emoji">{ICONS.default}</div>
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {pkg.inclusions && pkg.inclusions.length > 0 && (
            <section className="pd-section">
              <h2>What's Included</h2>
              <div className="icon-grid">
                {pkg.inclusions.map((inc) => (
                  <div className="icon-card" key={inc}>
                    <div className="icon-card-emoji">✅</div>
                    <span>{inc}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {pkg.exclusions && pkg.exclusions.length > 0 && (
            <section className="pd-section">
              <h2>Not Included</h2>
              <div className="icon-grid">
                {pkg.exclusions.map((exc) => (
                  <div className="icon-card" key={exc}>
                    <div className="icon-card-emoji">❌</div>
                    <span>{exc}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="pd-section">
            <h2>Reviews</h2>
            {reviews.length > 0 ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>{pkg.avg_rating ?? '—'}</div>
                    <div className="muted">{pkg.review_count ?? reviews.length} reviews</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    {ratingBuckets.map((b) => (
                      <div key={b.star} className="filter-rating-bar">
                        <span>{b.star}★</span>
                        <div className="filter-rating-bar-track"><div className="filter-rating-bar-fill" style={{ width: `${b.pct}%` }} /></div>
                        <span className="muted">{b.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                {reviews.map((r) => (
                  <Card key={r.id} className="review-card">
                    <strong>{r.title}</strong>
                    <p>{r.body}</p>
                    <span className="muted">★ {r.overall_rating} — {r.user.display_name}</span>
                  </Card>
                ))}
              </>
            ) : (
              <p className="muted">No reviews yet.</p>
            )}
          </section>

          <section className="pd-section">
            <h2>Similar Experiences</h2>
            <div className="trip-grid">
              {similarQuery.data?.data?.map((sp) => (
                <Link key={sp.id} to={`/app/package/${sp.id}`} className="trip-card">
                  <div className="trip-card-img">
                    {packageCoverImage(sp) ? (
                      <img src={packageCoverImage(sp)!} alt={sp.title} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#FFE8D9,#FFD2B0)' }} />
                    )}
                  </div>
                  <div className="trip-card-body">
                    <span className="trip-card-title">{sp.title}</span>
                    <div className="trip-card-price"><strong>₹{packagePrice(sp)?.toLocaleString()}</strong></div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="booking-card">
          <span className="booking-card-badge">Best Price Guaranteed</span>
          <div className="booking-card-price">₹{basePrice.toLocaleString()} <span>per person</span></div>
          <div className="muted">{pkg.duration_days ?? '–'} Days</div>

          <label style={{ display: 'block', marginTop: 14, fontSize: '.8rem', fontWeight: 600, color: 'var(--slate)' }}>
            Select Departure Date
            <input type="date" style={{ width: '100%', marginTop: 4 }} />
          </label>

          <div className="stepper">
            <span>Travelers</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setTravelers((t) => Math.max(1, t - 1))}>−</button>
              <span>{travelers}</span>
              <button onClick={() => setTravelers((t) => t + 1)}>+</button>
            </div>
          </div>

          <div className="price-breakdown">
            <div className="price-breakdown-row"><span>Base price ({travelers} × ₹{basePrice.toLocaleString()})</span><span>₹{(basePrice * travelers).toLocaleString()}</span></div>
            <div className="price-breakdown-row"><span>Fees & taxes</span><span>₹{fees.toLocaleString()}</span></div>
            <div className="price-breakdown-row total"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
          </div>

          <Link className="btn btn-primary" to={`/app/booking/${pkg.id}`}>Book Now</Link>
          <Link className="btn btn-outline" to={`/app/enquiries?package=${pkg.id}`}>Have a question? Enquire</Link>
          <div className="booking-card-trust">
            <span>✓ Secure payment</span>
            <span>✓ Verified vendor</span>
            <span>✓ Free cancellation</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
