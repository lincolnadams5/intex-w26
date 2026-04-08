import { Link } from 'react-router-dom'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

const HERO_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQCwFDpDFmhS3BLjo2OwfxXfr7hfXrO56Z37FaxidHie8o6zqG0n6j8je2HSN4F_Ge5mqdmtreC81GXPGtAOwOKtPiVYRC01Z2_yTHmfoiuCm2iGqdidluqe5HE9uMMo7UsUeG6JG1Ox92Zlbu-v9hjZKQmKf0HGQsln63qSPj1ry0sKoJ2AkfDkzTqZWXxTsI_8OySd7ZX1fofx9EHZFcyNUFaxHvrN1pDXok1HjYSJIhW9unrzawZwlNEBUbjblCMAzE8RAtWWI'

const SAFE_HOME_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJqJfbKhS6TZxTzjYwcJhFJqNqVqYGNqYGNqYGNqYGNqYGNqYGNqYGNqYGNqYGNqYGNqYGNqYGNqYGNqYGNqYGNqYGNqYGNqYGNqYGNqYGNqYGNqYGNqYGNqYGNqYGNqYG'

export function Landing() {
  return (
    <>
      {/* Hero Section with integrated header */}
      <section 
        className="relative min-h-[90vh] flex flex-col"
        style={{
          backgroundImage: `url(${HERO_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a3a3a]/95 via-[#1a3a3a]/70 to-transparent"></div>
        
        <Header transparent />

        <div className="relative flex-1 flex items-center py-16 md:py-24">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 w-full">
            <div className="max-w-2xl">
              <h1 className="text-white font-[family-name:var(--font-display)] text-7xl md:text-8xl lg:text-[8rem] font-bold leading-[1.05] mb-10">
                Her<br />
                Future,<br />
                Restored.
              </h1>
              <p className="text-white/85 text-xl md:text-2xl leading-[1.7] mb-12 max-w-xl">
                Pag-asa provides high-security safe homes and holistic rehabilitation for girls who are survivors of trafficking and abuse in the Philippines.
              </p>
              <div className="flex gap-5 flex-wrap">
                <Link 
                  to="/donate" 
                  className="px-10 py-4 bg-[var(--color-secondary)] text-[var(--color-on-secondary)] font-semibold text-sm uppercase tracking-wider rounded hover:shadow-[0_12px_40px_rgba(0,76,90,0.2)] transition-all"
                >
                  Empower a Survivor
                </Link>
                <a 
                  href="#mission" 
                  className="px-10 py-4 bg-transparent border-2 border-white/40 text-white font-semibold text-sm uppercase tracking-wider rounded hover:bg-white/10 hover:border-white/60 transition-all"
                >
                  Our Mission
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--color-secondary)]"></div>
      </section>

      <main>
        {/* Safety First Section - Split layout like screenshot */}
        <section id="mission" className="py-16 lg:py-24 bg-[var(--color-surface)]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left: Text Content */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-on-surface-variant)] mb-4">
                  Philippines Restoration Network
                </p>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6">
                  Safety first.<br />
                  Healing always.
                </h2>
                <p className="text-[var(--color-on-surface-variant)] text-lg leading-relaxed">
                  In partnership with trusted in-country organizations, Pag-asa operates a network of confidential safe houses. We provide a protective environment where young survivors of sexual abuse can find the clinical, legal, and emotional support required for long-term reintegration.
                </p>
              </div>

              {/* Right: Image with floating card */}
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-[var(--shadow-elevated)]">
                  <img 
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=500&fit=crop"
                    alt="Safe home interior"
                    className="w-full h-[400px] lg:h-[500px] object-cover"
                  />
                </div>
                {/* Floating Gold Card */}
                <div className="absolute -bottom-8 left-8 lg:-left-8 bg-[var(--color-secondary)] text-[var(--color-on-secondary)] p-6 rounded-lg shadow-[var(--shadow-floating)] max-w-[200px]">
                  <h3 className="text-xl font-bold mb-1 text-[var(--color-on-secondary)]">Safe Homes</h3>
                  <p className="text-xs uppercase tracking-wider opacity-80">
                    24/7 High-Security<br />
                    Protection for Girls
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pathway to Peace - Impact/Services Section */}
        <section className="py-20 lg:py-28 bg-[var(--color-surface-container-low)]">
          <div className="max-w-[1200px] mx-auto px-6 md:px-12">
            {/* Centered Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Pathway to Peace</h2>
              <p className="text-[var(--color-on-surface-variant)] text-lg max-w-2xl mx-auto">
                Our specialized approach combines secure housing with trauma-informed care to navigate the journey from victimhood to agency.
              </p>
            </div>

            {/* Three Service Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 - Light */}
              <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-8 flex flex-col">
                <div className="w-12 h-12 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Confidential Safety</h3>
                <p className="text-[var(--color-on-surface-variant)] text-sm leading-relaxed flex-1">
                  Secured residential facilities specifically for girls, providing immediate distance from trauma and exploitation.
                </p>
                <a href="#" className="mt-6 text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)] hover:text-[var(--color-primary-container)] transition-colors inline-flex items-center gap-2">
                  Our Safety Protocols
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>

              {/* Card 2 - Teal (Featured) */}
              <div className="bg-[var(--color-primary)] rounded-xl p-8 flex flex-col text-white">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Trauma-Informed Care</h3>
                <p className="text-white/80 text-sm leading-relaxed flex-1">
                  On-site clinical counseling and medical services tailored to the unique recovery needs of abuse survivors.
                </p>
                <a href="#" className="mt-6 text-xs font-semibold uppercase tracking-wider text-[var(--color-secondary)] hover:text-[var(--color-secondary-container)] transition-colors inline-flex items-center gap-2">
                  Healing Services
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>

              {/* Card 3 - Light */}
              <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-8 flex flex-col">
                <div className="w-12 h-12 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Reintegration</h3>
                <p className="text-[var(--color-on-surface-variant)] text-sm leading-relaxed flex-1">
                  Education and life-skills training to help girls safely transition back to their communities with dignity and hope.
                </p>
                <a href="#" className="mt-6 text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)] hover:text-[var(--color-primary-container)] transition-colors inline-flex items-center gap-2">
                  Success Stories
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Metrics Section */}
        <section id="impact" className="py-20 lg:py-28 bg-[var(--color-surface)]">
          <div className="max-w-[1200px] mx-auto px-6 md:px-12">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Impact</h2>
              <p className="text-[var(--color-on-surface-variant)] text-lg max-w-2xl mx-auto">
                Every number represents a life changed. Through careful documentation and data analysis, we continuously improve our programs.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              <div className="text-center p-6">
                <div className="text-5xl lg:text-6xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-display)] mb-2">2,400+</div>
                <div className="text-sm font-semibold text-[var(--color-on-surface)] mb-1">Counseling Sessions</div>
                <div className="text-xs text-[var(--color-on-surface-variant)]">Individual and group therapy annually</div>
              </div>
              <div className="text-center p-6">
                <div className="text-5xl lg:text-6xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-display)] mb-2">85%</div>
                <div className="text-sm font-semibold text-[var(--color-on-surface)] mb-1">Educational Advancement</div>
                <div className="text-xs text-[var(--color-on-surface-variant)]">Survivors advancing in education</div>
              </div>
              <div className="text-center p-6">
                <div className="text-5xl lg:text-6xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-display)] mb-2">500+</div>
                <div className="text-sm font-semibold text-[var(--color-on-surface)] mb-1">Home Visits</div>
                <div className="text-xs text-[var(--color-on-surface-variant)]">Follow-up visits ensuring well-being</div>
              </div>
              <div className="text-center p-6">
                <div className="text-5xl lg:text-6xl font-bold text-[var(--color-primary)] font-[family-name:var(--font-display)] mb-2">4</div>
                <div className="text-sm font-semibold text-[var(--color-on-surface)] mb-1">Partner Regions</div>
                <div className="text-xs text-[var(--color-on-surface-variant)]">Expanding our reach</div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link 
                to="/impact" 
                className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--color-primary)] hover:text-[var(--color-primary-container)] transition-colors"
              >
                View Full Impact Dashboard
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Join the Circle CTA - Dark teal with email signup */}
        <section className="py-20 lg:py-28 bg-[var(--color-primary)]">
          <div className="max-w-[1200px] mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left: Text */}
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-white leading-[1.1] mb-4">
                  Join the Circle of<br />
                  Protection.
                </h2>
                <p className="text-white/80 text-lg">
                  Stay updated on our safe house initiatives and see how your support changes lives across the Philippines.
                </p>
              </div>

              {/* Right: Email Signup */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">
                  Your Email Address
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="email" 
                    placeholder="email@impact.org"
                    className="flex-1 px-4 py-3 rounded bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
                  />
                  <button className="px-8 py-3 bg-[var(--color-secondary)] text-[var(--color-on-secondary)] font-semibold rounded hover:shadow-[var(--shadow-elevated)] transition-all whitespace-nowrap">
                    Support Pag-asa
                  </button>
                </div>
                <p className="text-xs text-white/40 mt-3">
                  Your privacy is safe with us. We only share stories of hope.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 lg:py-28 bg-[var(--color-surface)]">
          <div className="max-w-[1200px] mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Get in Touch</h2>
                <p className="text-[var(--color-on-surface-variant)] text-lg mb-8">
                  Have questions about our work or want to learn how you can help? We'd love to hear from you.
                </p>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 text-[var(--color-on-surface)]">
                    <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>contact@pagasasanctuary.org</span>
                  </div>
                  <div className="flex items-center gap-3 text-[var(--color-on-surface)]">
                    <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-3 text-[var(--color-on-surface)]">
                    <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>123 Hope Street, Anytown, USA</span>
                  </div>
                </div>
              </div>

              <form className="bg-[var(--color-surface-container-low)] p-8 rounded-xl">
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input type="text" id="name" placeholder="Your name" />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" placeholder="your@email.com" />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" rows={4} placeholder="How can we help?"></textarea>
                </div>
                <button type="submit" className="btn btn-primary w-full">Send Message</button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

export default Landing
