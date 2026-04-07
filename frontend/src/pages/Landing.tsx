import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSafehouses } from '../lib/api'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { StatCard } from '../components/StatCard'
import { SectionHeader } from '../components/SectionHeader'
import { PillarCard } from '../components/PillarCard'
import { ServiceCard } from '../components/ServiceCard'
import { ImpactCard } from '../components/ImpactCard'

export function Landing() {
  const [safehouseCount, setSafehouseCount] = useState<number | null>(null)

  useEffect(() => {
    // setSafehouseCount(4); for testing cookies
    getSafehouses()
      .then((data: unknown[]) => setSafehouseCount(data.length))
      .catch(() => setSafehouseCount(null))
  }, [])

  return (
    <>
      <Header />

      <main>
        {/* Hero */}
        <section className="py-12 px-6 lg:py-20 lg:px-8 max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-[60px] items-center text-center lg:text-left">
          <div>
            <h1 className="mb-6">Pag-asa: Hope.<br />Rebuilding Lives.</h1>
            <p className="text-lg leading-[1.7] text-[var(--text)] mb-8">
              Pag-asa Sanctuary provides safe homes and comprehensive rehabilitation
              services for survivors of sexual abuse and trafficking, helping them
              heal and build brighter futures.
            </p>
            <div className="flex gap-4 justify-center lg:justify-start flex-col sm:flex-row">
              <button className="btn btn-primary btn-large">Get Involved</button>
              <button className="btn btn-outline btn-large">Learn More</button>
            </div>
          </div>
          <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-4 sm:gap-6 max-w-[500px] lg:max-w-none mx-auto lg:mx-0">
            <StatCard number="150+" label="Lives Transformed" />
            <StatCard number={safehouseCount ?? '…'} label="Safe Homes" />
            <StatCard number="98%" label="Successful Rehabilitation" />
          </div>
        </section>

        {/* Mission */}
        <section id="mission" className="py-12 px-6 lg:py-20 lg:px-8 bg-[var(--bg-alt)]">
          <SectionHeader
            title="Our Mission"
            subtitle="We partner with local organizations to create safe environments where survivors can heal, grow, and thrive. Through comprehensive care and data-driven approaches, we're building a model that can be replicated across underserved regions worldwide."
          />
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1200px] mx-auto">
            <PillarCard title="Protection" description="Safe homes staffed by trained professionals providing 24/7 care and security." />
            <PillarCard title="Healing" description="Trauma-informed counseling and therapy to support emotional recovery." />
            <PillarCard title="Education" description="Academic support and vocational training for long-term independence." />
            <PillarCard title="Reintegration" description="Careful transition support to help survivors rebuild their lives." />
          </div>
        </section>

        {/* Services */}
        <section id="services" className="py-12 px-6 lg:py-20 lg:px-8 max-w-[1200px] mx-auto">
          <SectionHeader
            title="Operations Portal"
            subtitle="Authorized staff and partners can access our comprehensive case management and reporting tools to coordinate care effectively."
          />
          <div className="grid grid-cols-1 min-[600px]:grid-cols-2 lg:grid-cols-3 gap-6">
            <ServiceCard href="/cases" title="Case Management" description="Track and manage caseload inventory, monitor progress, and coordinate care plans." linkText="Access Cases →" />
            <ServiceCard href="/sessions" title="Session Notes" description="Document counseling sessions with structured process recording formats." linkText="View Sessions →" />
            <ServiceCard href="/visits" title="Home Visits" description="Record and review home visitation reports and follow-up assessments." linkText="Manage Visits →" />
            <ServiceCard href="/reports" title="Reports & Analytics" description="Generate annual accomplishment reports and analyze program outcomes." linkText="View Reports →" />
            <ServiceCard href="/homes" title="Safe Homes" description="Manage safe home facilities, capacity, and partner organizations." linkText="Manage Homes →" />
            <ServiceCard href="/donors" title="Donor Relations" description="Track donations, manage donor communications, and acknowledge support." linkText="View Donors →" />
          </div>
        </section>

        {/* Impact */}
        <section id="impact" className="py-12 px-6 lg:py-20 lg:px-8 bg-[var(--bg-alt)]">
          <SectionHeader
            title="Our Impact"
            subtitle="Every number represents a life changed. Through careful documentation and data analysis, we continuously improve our programs to maximize impact."
          />
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1200px] mx-auto">
            <ImpactCard number="2,400+" label="Counseling Sessions" description="Individual and group therapy sessions conducted annually" />
            <ImpactCard number="85%" label="Educational Advancement" description="Survivors advancing in education or vocational training" />
            <ImpactCard number="500+" label="Home Visits" description="Follow-up visits ensuring continued well-being" />
            <ImpactCard number="4" label="Partner Regions" description="Expanding our reach to underserved communities" />
          </div>
          <div className="text-center mt-10">
            <Link to="/impact" className="btn btn-outline">View Full Impact Dashboard →</Link>
          </div>
        </section>

        {/* CTA */}
        <section
          className="py-12 px-6 lg:py-20 lg:px-8 text-center"
          style={{ background: 'linear-gradient(135deg, #2D9F8C 0%, #1f7a69 100%)' }}
        >
          <div className="max-w-[700px] mx-auto">
            <h2 className="text-white mb-4">Join Us in Making a Difference</h2>
            <p className="text-white/90 text-lg mb-8">
              Whether through donations, volunteering, or partnerships, your support
              helps us provide safety and hope to those who need it most.
            </p>
            <div className="flex gap-4 justify-center flex-col sm:flex-row items-center">
              <button className="btn btn-large bg-white text-[var(--accent)] hover:bg-white/90">
                Donate Now
              </button>
              <button className="btn btn-outline-light btn-large">Partner With Us</button>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="py-12 px-6 lg:py-20 lg:px-8 max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-[60px] items-start">
            <div>
              <h2 className="mb-4">Get in Touch</h2>
              <p className="text-[var(--text)] mb-8">
                Have questions about our work or want to learn how you can help?
                We'd love to hear from you.
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-[var(--text-h)]">
                  <span>contact@pagasasanctuary.org</span>
                </div>
                <div className="flex items-center gap-3 text-[var(--text-h)]">
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-3 text-[var(--text-h)]">
                  <span>123 Hope Street, Anytown, USA</span>
                </div>
              </div>
            </div>
            <form className="bg-[var(--bg-alt)] p-8 rounded-xl border border-[var(--border)]">
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

      <Footer />
    </>
  )
}

export default Landing
