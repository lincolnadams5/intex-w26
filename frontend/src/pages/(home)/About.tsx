import { Link } from "react-router-dom";
import aboutImage from "../../assets/AboutPageImage1.png";
import impact1 from "../../assets/pexels-jasper-mendoza-61081629-17831878.jpg";
import impact2 from "../../assets/Education.avif";
import impact3 from "../../assets/pexels-vhinz-tuqui-11925293-13040204.jpg";
import safeHouse from "../../assets/safe-house.jpg";

export default function About() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">

      {/* Page Hero */}
      <header className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-white mb-4">About Pag-asa</h1>
          <p className="text-white/80 text-lg leading-relaxed">
            We partner with trusted in-country organizations to provide safe homes and holistic care for survivors of trafficking and abuse in the Philippines.
          </p>
        </div>
      </header>

      <main>

        {/* Safety First — split layout */}
        <section id="mission" className="py-20 lg:py-28 bg-[var(--color-surface)]">
          <div className="max-w-[1200px] mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

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

              <div className="relative">
                <div className="rounded-xl overflow-hidden shadow-[var(--shadow-elevated)]">
                  <img
                    src={safeHouse}
                    alt="Safe home interior"
                    className="w-full h-[400px] lg:h-[500px] object-cover"
                  />
                </div>
                <div className="absolute -bottom-8 left-8 lg:-left-8 bg-[var(--color-secondary)] text-[var(--color-on-secondary)] p-6 rounded-lg shadow-[var(--shadow-floating)] max-w-[200px]">
                  <h3 className="text-xl font-bold mb-1 text-[var(--color-on-secondary)]">Safe Homes</h3>
                  <p className="text-xs uppercase tracking-wider opacity-80">
                    Find Peace<br />
                    and Protection.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-20 lg:py-28 bg-[var(--color-primary)]">
          <div className="max-w-[1200px] mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Our Story
              </h2>
              <p className="text-white/80 mb-6">
                Pag-asa Sanctuary was founded to provide a safe haven for girls who have experienced trauma and exploitation. Through partnerships with local organizations, we create environments where healing is possible and futures are rebuilt.
              </p>
              <p className="text-white/80">
                Our work now includes counseling, education, life-skills training, and reintegration programs — supporting each survivor beyond the moment of rescue. Through this holistic approach, survivors rebuild trust, gain confidence, and reclaim their futures.
              </p>
            </div>

            <div className="rounded-xl overflow-hidden shadow-[var(--shadow-elevated)]">
              <img
                src={aboutImage}
                alt="Community support"
                className="w-full h-[400px] object-cover"
              />
            </div>

          </div>
        </section>

        {/* Our Values */}
        <section className="py-20 lg:py-28 bg-[var(--color-surface-container-low)]">
          <div className="max-w-[1200px] mx-auto px-6 md:px-12">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Values</h2>
              <p className="text-[var(--color-on-surface-variant)] text-lg max-w-2xl mx-auto">
                Everything we do is rooted in compassion, dignity, and long-term impact.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card card-elevated">
                <h3 className="text-xl font-bold mb-3">Safety</h3>
                <p className="text-sm text-[var(--color-on-surface-variant)]">
                  We prioritize secure environments where survivors can begin healing.
                </p>
              </div>
              <div className="card card-elevated">
                <h3 className="text-xl font-bold mb-3">Healing</h3>
                <p className="text-sm text-[var(--color-on-surface-variant)]">
                  Trauma-informed care supports emotional and psychological recovery.
                </p>
              </div>
              <div className="card card-elevated">
                <h3 className="text-xl font-bold mb-3">Empowerment</h3>
                <p className="text-sm text-[var(--color-on-surface-variant)]">
                  Education and life skills create pathways to independence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Commitment */}
        <section className="py-20 lg:py-28 bg-[var(--color-surface)]">
          <div className="max-w-[1200px] mx-auto px-6 md:px-12">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Commitment</h2>
              <p className="text-[var(--color-on-surface-variant)] text-lg max-w-2xl mx-auto">
                We are committed to long-term change — not just immediate relief. Here's how Pag-asa is making a lasting impact in the lives of survivors and their communities.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              <Link to="/impact" className="bg-[var(--color-surface-container-lowest)] rounded-xl overflow-hidden shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)] hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)] transition-all">
                <img src={impact1} alt="Safe housing" className="w-full h-48 object-cover" />
                <div className="p-6">
                  <h3 className="font-semibold text-[var(--color-on-surface)] mb-2">Safe Housing</h3>
                  <p className="text-[var(--color-on-surface-variant)] text-sm">
                    Through our safehouse network, girls have found stability, security, and a place to begin healing. Each home provides not just shelter, but a consistent environment where recovery can take root.
                  </p>
                </div>
              </Link>

              <Link to="/impact" className="bg-[var(--color-surface-container-lowest)] rounded-xl overflow-hidden shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)] hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)] transition-all">
                <img src={impact2} alt="Education and skills" className="w-full h-48 object-cover" />
                <div className="p-6">
                  <h3 className="font-semibold text-[var(--color-on-surface)] mb-2">Education & Skills</h3>
                  <p className="text-[var(--color-on-surface-variant)] text-sm">
                    With access to counseling, education, and life-skills training, survivors are building confidence and independence. Many go on to pursue education, employment, and leadership opportunities.
                  </p>
                </div>
              </Link>

              <Link to="/impact" className="bg-[var(--color-surface-container-lowest)] rounded-xl overflow-hidden shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)] hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)] transition-all">
                <img src={impact3} alt="Community reintegration" className="w-full h-48 object-cover" />
                <div className="p-6">
                  <h3 className="font-semibold text-[var(--color-on-surface)] mb-2">Community Reintegration</h3>
                  <p className="text-[var(--color-on-surface-variant)] text-sm">
                    Our reintegration programs have helped survivors reconnect with their communities in safe and meaningful ways. Ongoing support ensures they continue to thrive beyond the program.
                  </p>
                </div>
              </Link>

            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 lg:py-28 bg-[var(--color-primary)]">
          <div className="max-w-[1200px] mx-auto px-6 md:px-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Be Part of the Change
            </h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
              Your support helps restore hope and rebuild lives.
            </p>
            <Link
              to="/donate"
              className="btn btn-large bg-[var(--color-secondary)] text-[var(--color-on-secondary)] hover:shadow-[var(--shadow-elevated)]"
            >
              Support Pag-asa
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
