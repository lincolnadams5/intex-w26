import { useEffect, useState } from 'react'
import { getSafehouses } from '../lib/api'
import './Landing.css'

export function Landing() {
  const [safehouseCount, setSafehouseCount] = useState<number | null>(null)

  useEffect(() => {
    getSafehouses()
      .then((data: unknown[]) => setSafehouseCount(data.length))
      .catch(() => setSafehouseCount(null))
  }, [])
  return (
    <>
      <header className="landing-header">
        <nav className="landing-nav">
          <div className="logo">
            <span className="logo-text">Pag-asa Sanctuary</span>
          </div>
          <div className="nav-links">
            <a href="#mission">Mission</a>
            <a href="#services">Services</a>
            <a href="#impact">Impact</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="nav-actions">
            <button className="btn btn-secondary">Sign In</button>
            <button className="btn btn-primary">Donate</button>
          </div>
        </nav>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-content">
            <h1>Pag-asa: Hope.<br />Rebuilding Lives.</h1>
            <p className="hero-subtitle">
              Pag-asa Sanctuary provides safe homes and comprehensive rehabilitation 
              services for survivors of sexual abuse and trafficking, helping them 
              heal and build brighter futures.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-large">Get Involved</button>
              <button className="btn btn-outline btn-large">Learn More</button>
            </div>
          </div>
          <div className="hero-stats">
            <div className="stat-card">
              <span className="stat-number">150+</span>
              <span className="stat-label">Lives Transformed</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{safehouseCount ?? '…'}</span>
              <span className="stat-label">Safe Homes</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">98%</span>
              <span className="stat-label">Successful Rehabilitation</span>
            </div>
          </div>
        </section>

        <section id="mission" className="mission-section">
          <div className="section-header">
            <h2>Our Mission</h2>
            <p>
              We partner with local organizations to create safe environments where 
              survivors can heal, grow, and thrive. Through comprehensive care and 
              data-driven approaches, we're building a model that can be replicated 
              across underserved regions worldwide.
            </p>
          </div>
          <div className="mission-pillars">
            <div className="pillar-card">
              <h3>Protection</h3>
              <p>Safe homes staffed by trained professionals providing 24/7 care and security.</p>
            </div>
            <div className="pillar-card">
              <h3>Healing</h3>
              <p>Trauma-informed counseling and therapy to support emotional recovery.</p>
            </div>
            <div className="pillar-card">
              <h3>Education</h3>
              <p>Academic support and vocational training for long-term independence.</p>
            </div>
            <div className="pillar-card">
              <h3>Reintegration</h3>
              <p>Careful transition support to help survivors rebuild their lives.</p>
            </div>
          </div>
        </section>

        <section id="services" className="services-section">
          <div className="section-header">
            <h2>Operations Portal</h2>
            <p>
              Authorized staff and partners can access our comprehensive case management 
              and reporting tools to coordinate care effectively.
            </p>
          </div>
          <div className="services-grid">
            <a href="/cases" className="service-card">
              <h3>Case Management</h3>
              <p>Track and manage caseload inventory, monitor progress, and coordinate care plans.</p>
              <span className="service-link">Access Cases →</span>
            </a>
            <a href="/sessions" className="service-card">
              <h3>Session Notes</h3>
              <p>Document counseling sessions with structured process recording formats.</p>
              <span className="service-link">View Sessions →</span>
            </a>
            <a href="/visits" className="service-card">
              <h3>Home Visits</h3>
              <p>Record and review home visitation reports and follow-up assessments.</p>
              <span className="service-link">Manage Visits →</span>
            </a>
            <a href="/reports" className="service-card">
              <h3>Reports & Analytics</h3>
              <p>Generate annual accomplishment reports and analyze program outcomes.</p>
              <span className="service-link">View Reports →</span>
            </a>
            <a href="/homes" className="service-card">
              <h3>Safe Homes</h3>
              <p>Manage safe home facilities, capacity, and partner organizations.</p>
              <span className="service-link">Manage Homes →</span>
            </a>
            <a href="/donors" className="service-card">
              <h3>Donor Relations</h3>
              <p>Track donations, manage donor communications, and acknowledge support.</p>
              <span className="service-link">View Donors →</span>
            </a>
          </div>
        </section>

        <section id="impact" className="impact-section">
          <div className="section-header">
            <h2>Our Impact</h2>
            <p>
              Every number represents a life changed. Through careful documentation 
              and data analysis, we continuously improve our programs to maximize impact.
            </p>
          </div>
          <div className="impact-grid">
            <div className="impact-card">
              <div className="impact-metric">
                <span className="impact-number">2,400+</span>
                <span className="impact-label">Counseling Sessions</span>
              </div>
              <p>Individual and group therapy sessions conducted annually</p>
            </div>
            <div className="impact-card">
              <div className="impact-metric">
                <span className="impact-number">85%</span>
                <span className="impact-label">Educational Advancement</span>
              </div>
              <p>Survivors advancing in education or vocational training</p>
            </div>
            <div className="impact-card">
              <div className="impact-metric">
                <span className="impact-number">500+</span>
                <span className="impact-label">Home Visits</span>
              </div>
              <p>Follow-up visits ensuring continued well-being</p>
            </div>
            <div className="impact-card">
              <div className="impact-metric">
                <span className="impact-number">4</span>
                <span className="impact-label">Partner Regions</span>
              </div>
              <p>Expanding our reach to underserved communities</p>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-content">
            <h2>Join Us in Making a Difference</h2>
            <p>
              Whether through donations, volunteering, or partnerships, your support 
              helps us provide safety and hope to those who need it most.
            </p>
            <div className="cta-actions">
              <button className="btn btn-primary btn-large">Donate Now</button>
              <button className="btn btn-outline-light btn-large">Partner With Us</button>
            </div>
          </div>
        </section>

        <section id="contact" className="contact-section">
          <div className="contact-grid">
            <div className="contact-info">
              <h2>Get in Touch</h2>
              <p>
                Have questions about our work or want to learn how you can help? 
                We'd love to hear from you.
              </p>
              <div className="contact-details">
                <div className="contact-item">
                  <span>contact@pagasasanctuary.org</span>
                </div>
                <div className="contact-item">
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="contact-item">
                  <span>123 Hope Street, Anytown, USA</span>
                </div>
              </div>
            </div>
            <form className="contact-form">
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
              <button type="submit" className="btn btn-primary">Send Message</button>
            </form>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo">
              <span className="logo-text">Pag-asa Sanctuary</span>
            </div>
            <p>Pag-asa means "hope" in Tagalog. We restore hope and rebuild lives for survivors of abuse and trafficking.</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Organization</h4>
              <a href="#mission">Our Mission</a>
              <a href="#impact">Impact</a>
              <a href="/about">About Us</a>
              <a href="/team">Our Team</a>
            </div>
            <div className="footer-column">
              <h4>Get Involved</h4>
              <a href="/donate">Donate</a>
              <a href="/volunteer">Volunteer</a>
              <a href="/partner">Partner</a>
              <a href="/careers">Careers</a>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <a href="/reports">Annual Reports</a>
              <a href="/news">News</a>
              <a href="/faq">FAQ</a>
              <a href="/privacy">Privacy Policy</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Pag-asa Sanctuary. All rights reserved. A 501(c)(3) nonprofit organization.</p>
        </div>
      </footer>
    </>
  )
}

export default Landing
