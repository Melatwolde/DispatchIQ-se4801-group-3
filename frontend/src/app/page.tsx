import { Navigation2, ArrowRight, Play, MapPin, Cpu, Truck, Sparkles } from 'lucide-react';
import styles from './page.module.css';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Technology', href: '#technology' },
];

export default function Home() {
  return (
    <main className={styles.page}>
      {/* Hero & Navigation Section */}
      <section className={styles.heroSection}>
        <div className={styles.inner}>
          <header className={styles.navbar}>
            <div className={styles.logoSection}>
              <Navigation2 className={styles.logoIcon} />
              <span>DispatchIQ</span>
            </div>

            <nav className={styles.navLinks}>
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className={styles.navLink}>
                  {link.label}
                </a>
              ))}
            </nav>

            <div className={styles.navActions}>
              <a href="/login" className={styles.navTextButton}>
                Log In
              </a>
              <a href="/register" className={styles.navButton}>
                Sign Up
              </a>
            </div>
          </header>

          <div className={styles.heroContent}>
            <div className={styles.heroCopy}>
              <p className={styles.heroBadge}>Dispatch intelligence for modern fleets</p>
              <h1 className={styles.heroTitle}>Smart Dispatching, Optimized Routing, Automated Delivery.</h1>
              <p className={styles.heroDescription}>
                Streamline your logistics operations. Calculate instant ETAs, find optimal routes,
                and assign deliveries to the best available courier automatically.
              </p>

              <div className={styles.heroActions}>
                <a href="/register" className={styles.primaryButton}>
                  Get Started for Free
                </a>
              </div>

              <div className={styles.heroMetrics}>
                <div>
                  <span>99.9%</span>
                  <p>On-time route accuracy</p>
                </div>
                <div>
                  <span>4.8x</span>
                  <p>Faster assignment workflows</p>
                </div>
                <div>
                  <span>Live</span>
                  <p>OSRM routing performance</p>
                </div>
              </div>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.dashboardCard}>
                <div className={styles.dashboardHeader}>
                  <div className={styles.dotGroup}>
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className={styles.statusBadge}>Live Dispatch</div>
                </div>

                <div className={styles.dashboardTopBar}>
                  <div>
                    <h3>Active Route</h3>
                    <p>Fleet performance snapshot</p>
                  </div>
                  <div className={styles.dashboardStat}>ETA 18m</div>
                </div>

                <div className={styles.mapPreview}>
                  <div className={styles.mapOverlay}>
                    <div className={styles.mapPin}>A</div>
                    <div className={styles.mapPinEnd}>B</div>
                  </div>
                  <div className={styles.routeLine} />
                </div>

                <div className={styles.dashboardFooter}>
                  <div>
                    <p>Pickup</p>
                    <strong>Downtown Hub</strong>
                  </div>
                  <div>
                    <p>Delivery</p>
                    <strong>North Terminal</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.inner}>
          <div className={styles.sectionHeader}>
            <span>Core Platform Features</span>
            <h2>Built for precision logistics and rapid decision-making.</h2>
          </div>

          <div className={styles.featureGrid}>
            <article className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <MapPin size={20} />
              </div>
              <h3>Photon-Powered Address Search</h3>
              <p>Lightning-fast geocoding and typeahead address search for flawless pickup and drop-off coordinates.</p>
            </article>

            <article className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Cpu size={20} />
              </div>
              <h3>OSRM Map & Routing Engine</h3>
              <p>Real-time open-source routing machine calculations showing exact distance and precise ETAs instantly on a dark-themed vector map.</p>
            </article>

            <article className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Truck size={20} />
              </div>
              <h3>Optimal Smart Assignment</h3>
              <p>Intelligent dispatching algorithm that automatically matches orders with the best-positioned courier for maximum efficiency.</p>
            </article>
          </div>
        </div>
      </section>

      {/* How it Works Section (With Minimized Text Block and Expanded Map Graphic) */}
      <section id="how-it-works" className={styles.howItWorksSection || ''} style={{ padding: '80px 0' }}>
        <div 
          style={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            padding: '0 24px',
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '64px'
          }}
        >
          {/* Left Side: Minimized Text Content */}
          <div className={styles.workCopy} style={{ flex: '1 1 300px', maxWidth: '380px', textAlign: 'left' }}>
            <span style={{ color: '#2563EB', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
              How It Works
            </span>
            <h2 style={{ fontSize: '1.5rem', marginTop: '6px', marginBottom: '24px', color: '#FFFFFF', lineHeight: '1.25' }}>
              From request to dispatch, every step is streamlined.
            </h2>
            <ol className={styles.stepsList} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li>
                <strong style={{ display: 'block', color: '#FFFFFF', marginBottom: '2px', fontSize: '0.9rem' }}>1. Create a dispatch request</strong>
                <p style={{ color: '#71717A', margin: 0, fontSize: '0.85rem', lineHeight: '1.4' }}>Enter pickup and drop-off details in a single, clean workflow.</p>
              </li>
              <li>
                <strong style={{ display: 'block', color: '#FFFFFF', marginBottom: '2px', fontSize: '0.9rem' }}>2. Get distance/ETA via OSRM</strong>
                <p style={{ color: '#71717A', margin: 0, fontSize: '0.85rem', lineHeight: '1.4' }}>Receive precise route data and travel time immediately.</p>
              </li>
              <li>
                <strong style={{ display: 'block', color: '#FFFFFF', marginBottom: '2px', fontSize: '0.9rem' }}>3. Auto-assign to courier</strong>
                <p style={{ color: '#71717A', margin: 0, fontSize: '0.85rem', lineHeight: '1.4' }}>Automatically match each order with the best available driver.</p>
              </li>
            </ol>
          </div>

          {/* Right Side: Much Larger Dashboard Image Container */}
          <div 
            className={styles.heroVisual} 
            style={{ 
              flex: '1 1 500px',
              maxWidth: '700px', /* Increased scale size to emphasize dashboard layout */
              width: '100%', 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <img 
              src="/image.png" 
              alt="DispatchIQ UI Flow Mockup" 
              style={{ 
                width: '100%', 
                height: 'auto', 
                borderRadius: '8px',
                border: '1px solid #27272A',
                display: 'block'
              }} 
            />
          </div>
        </div>
      </section>

      {/* CTA Conversion Form */}
      <section className={styles.ctaSection}>
        <div className={styles.innerCta}>
          <h2>Ready to optimize your delivery fleet?</h2>
          <form action="/signup" method="get" className={styles.ctaForm}>
            <label className={styles.emailField}>
              <span className={styles.visuallyHidden}>Email</span>
              <input type="email" name="email" placeholder="Enter your business email" />
            </label>
            <button type="submit" className={styles.ctaButton}>
              Create Account
            </button>
          </form>
        </div>
      </section>

      {/* Footer Block */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>© 2026 DispatchIQ. All rights reserved.</p>
          <div className={styles.footerLinks}>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">LinkedIn</a>
          </div>
        </div>
      </footer>
    </main>
  );
}