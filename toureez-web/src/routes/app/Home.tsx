import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { getFeaturedPackages, packageCoverImage, packageLocationLabel, packagePrice } from '../../lib/api/packages';
import { getCategories } from '../../lib/api/categories';
import { getLocations } from '../../lib/api/locations';
import { LoadingState, ErrorState } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';

const RIBBONS = ['ribbon-best-price', 'ribbon-top-rated', 'ribbon-local-exclusive'] as const;
const RIBBON_LABELS = ['Best Price', 'Top Rated', 'Local Exclusive'];

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [activeDot, setActiveDot] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const locationsQuery = useQuery({ queryKey: ['locations', 'popular'], queryFn: () => getLocations(true) });
  const featuredQuery = useQuery({ queryKey: ['packages', 'featured'], queryFn: getFeaturedPackages });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/app/search${destination ? `?destination=${encodeURIComponent(destination)}` : ''}`);
  }

  function scrollCarousel(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 260, behavior: 'smooth' });
  }

  function handleScroll() {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = 260;
    setActiveDot(Math.round(el.scrollLeft / cardWidth));
  }

  const packages = featuredQuery.data?.data ?? [];

  return (
    <div>
      <section className="hero2">
        <div className="hero2-inner">
          <div className="hero2-tag">
            <span className="app-logo-dot" /> Travel made simple
          </div>
          <h1>
            Find your next <span className="accent">unforgettable trip</span>
          </h1>
          <p className="hero2-desc">
            {user?.fullName ? `Welcome back, ${user.fullName}. ` : ''}
            Discover hidden gems, chai stalls, ancient trails, and epic skylines — all in one place.
          </p>
          <form className="hero2-cta-row" onSubmit={handleSearch}>
            <input
              placeholder="Where do you want to go?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-pill">Find My Trip</button>
            <Link to="/app/search" className="btn btn-outline btn-pill" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)' }}>
              Explore Deals
            </Link>
          </form>
          <div className="hero2-trust">Secure booking · No hidden fees · Instant confirmation</div>
        </div>
      </section>

      <div className="site-content">
        <section className="home-section">
          <div className="section-tag2">Curated for you</div>
          <h2 className="section-heading">Popular Indian Trips</h2>
          <p className="section-sub2">Discover where travelers are heading this season — from tropical escapes to mountain getaways.</p>

          {featuredQuery.isLoading && <LoadingState />}
          {featuredQuery.isError && <ErrorState message="Failed to load packages" onRetry={() => featuredQuery.refetch()} />}

          <div className="carousel-wrap">
            {packages.length > 3 && (
              <>
                <button className="carousel-arrow prev" onClick={() => scrollCarousel(-1)} aria-label="Previous">‹</button>
                <button className="carousel-arrow next" onClick={() => scrollCarousel(1)} aria-label="Next">›</button>
              </>
            )}
            <div className="carousel-track" ref={trackRef} onScroll={handleScroll}>
              {packages.map((pkg, i) => (
                <div className="trip-card" key={pkg.id}>
                  <Link to={`/app/package/${pkg.id}`}>
                    <div className="trip-card-img">
                      <span className={`ribbon ${RIBBONS[i % RIBBONS.length]}`}>{RIBBON_LABELS[i % RIBBON_LABELS.length]}</span>
                      {packageCoverImage(pkg) ? (
                        <img src={packageCoverImage(pkg)!} alt={pkg.title} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#FFE8D9,#FFD2B0)' }} />
                      )}
                      <span className="trip-card-save">♡</span>
                    </div>
                    <div className="trip-card-body">
                      <span className="trip-card-title">{pkg.title}</span>
                      <span className="trip-card-meta">📍 {packageLocationLabel(pkg)}</span>
                      {pkg.duration_days !== undefined && <span className="trip-card-meta">{pkg.duration_days} nights</span>}
                      {pkg.avg_rating !== undefined && <span className="trip-card-rating">★ {pkg.avg_rating} ({pkg.review_count ?? 0})</span>}
                      <div className="trip-card-price">
                        <strong>₹{packagePrice(pkg)?.toLocaleString()}</strong>
                        <span>per person</span>
                      </div>
                    </div>
                  </Link>
                  <Link to={`/app/booking/${pkg.id}`} className="btn btn-primary trip-card-cta">Book Now</Link>
                </div>
              ))}
            </div>
            {packages.length > 1 && (
              <div className="carousel-dots">
                {packages.map((_, i) => (
                  <span key={i} className={`carousel-dot ${i === activeDot ? 'active' : ''}`} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="home-section">
          <div className="section-tag2">Why travelers choose us</div>
          <h2 className="section-heading">We <span className="accent">compare</span> and make your plan effortless</h2>
          <p className="section-sub2">So you can focus on what really matters.</p>
          <div className="value-trio">
            <div className="value-trio-item">
              <div className="value-trio-icon">⚖️</div>
              <h4>Compare prices</h4>
              <p>See every vendor's price side by side before you book.</p>
            </div>
            <div className="value-trio-item">
              <div className="value-trio-icon">📍</div>
              <h4>Verified for travelers</h4>
              <p>Every vendor on Toureez is reviewed and verified.</p>
            </div>
            <div className="value-trio-item">
              <div className="value-trio-icon">📅</div>
              <h4>Plan your trip</h4>
              <p>Because every journey deserves a personal touch.</p>
            </div>
          </div>
        </section>

        <div className="value-band">
          <div className="value-item"><strong>30K+</strong><span>Happy explorers</span></div>
          <div className="value-item"><strong>500+</strong><span>Curated destinations</span></div>
          <div className="value-item"><strong>60%</strong><span>Saved on average</span></div>
        </div>

        <section className="home-section">
          <div className="section-tag2">Explore by tag</div>
          <h2 className="section-heading">Discover the world</h2>
          <div className="pill-row" style={{ justifyContent: 'center', marginBottom: 20 }}>
            {categoriesQuery.data?.data?.map((c) => (
              <Link key={c.id} to={`/app/search?category=${c.name}`} className="pill">
                {c.label ?? c.name}
              </Link>
            ))}
          </div>

          {locationsQuery.isLoading && <LoadingState />}
          {locationsQuery.isError && <ErrorState message="Failed to load destinations" onRetry={() => locationsQuery.refetch()} />}

          <div className="discover-strip">
            {locationsQuery.data?.data?.map((loc) => (
              <Link key={loc.id} to={`/app/search?destination=${encodeURIComponent(loc.city)}`} className="discover-card">
                {loc.image_url ? (
                  <img src={loc.image_url} alt={loc.city} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#1A1A2E,#2D2D4E)' }} />
                )}
                <span className="discover-card-label">{loc.city}{loc.state ? `, ${loc.state}` : ''}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>
            <h4>Toureez</h4>
            <p style={{ maxWidth: 240, fontSize: '.85rem' }}>Travel made simple, stories made unforgettable.</p>
          </div>
          <div>
            <h4>Explore</h4>
            <Link to="/app/search">Search</Link>
            <Link to="/app/compare">Compare</Link>
            <Link to="/app/wishlist">Wishlist</Link>
          </div>
          <div>
            <h4>Support</h4>
            <Link to="/app/enquiries">Enquiries</Link>
            <Link to="/app/chat">Chat with us</Link>
          </div>
        </div>
        <div className="site-footer-bottom">© {new Date().getFullYear()} Toureez. All rights reserved.</div>
      </footer>
    </div>
  );
}
