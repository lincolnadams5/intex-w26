import { Link } from "react-router-dom";
import aboutImage from "../../assets/AboutPageImage1.png";
import impact1 from "../../assets/pexels-jasper-mendoza-61081629-17831878.jpg";
import impact2 from "../../assets/Education.avif";
import impact3 from "../../assets/pexels-vhinz-tuqui-11925293-13040204.jpg";

export default function About() {
  return (
    <>
      {/* HERO (match landing style but simpler) */}
      ​​<section className="py-20 lg:py-28 bg-[var(--color-surface-container-low)]">

        <div className="bg-[var(--accent)] text-white py-16 px-6">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
            About Pag-asa
        </h1>
        <p className="text-lg text-[var(--color-on-surface-variant)] max-w-2xl mx-auto">
            Pag-asa means "hope." Our mission is to restore hope and rebuild
            lives for survivors of abuse and trafficking through safety,
            healing, and empowerment.
        </p>
        </div>
        </div>
</section>


      <main>

        {/* STORY SECTION (copy landing split layout) */}
        <section className="py-20 lg:py-28 bg-[var(--color-primary)]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Text */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Our Story
              </h2>
              <p className="text-white/80 mb-8">
              Pag-asa Sanctuary was founded to provide a safe haven for girls who have experienced trauma and exploitation. Through partnerships with local organizations, we create environments where healing is possible and futures are rebuilt.
              </p>

              <p className="text-white/80 mb-8">
              Through partnerships with local organizations and community leaders, we create safe environments where girls can rebuild trust, gain confidence, and begin again. Our work now includes counseling, education, life-skills training, and reintegration programs—supporting each survivor beyond the moment of rescue.
              </p>

              <p className="text-white/80 mb-8">
              Through partnerships with local organizations and community leaders, we create safe environments where girls can rebuild trust, gain confidence, and begin again. Our work now includes counseling, education, life-skills training, and reintegration programs—supporting each survivor beyond the moment of rescue.
              </p>
            </div>

            {/* Image */}
            <div className="rounded-2xl overflow-hidden shadow-[var(--shadow-elevated)]">
              <img
                src={aboutImage}
                alt="Community support"
                className="w-full h-[400px] object-cover"
              />
            </div>

          </div>
        </section>

        {/* VALUES SECTION (cards like landing) */}
        <section className="py-20 lg:py-28 bg-[var(--color-surface-container-low)]">
          <div className="max-w-[1200px] mx-auto px-6 md:px-12">

            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Our Values
              </h2>
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

        <div className="py-16 px-6 bg-[var(--bg-alt)]">
  <div className="max-w-6xl mx-auto text-center">

    <h2 className="text-4xl md:text-5xl font-bold mb-4">
      Our Impact
    </h2>

    <p className="text-[var(--color-on-surface-variant)] text-lg max-w-2xl mx-auto">
      Real change happens through compassion, safety, and opportunity. Here's how Pag-asa is making a difference.
    </p>

    <br></br>
    <br></br>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

      {/* Image Card 1 */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[var(--border)]">
        <img
          src={impact1}
          alt="Safe housing"
          className="w-full h-48 object-cover"
        />
        <div className="p-6">
          <h3 className="font-semibold text-[var(--text-h)] mb-2">
            Safe Housing
          </h3>
          <p className="text-[var(--text)] text-sm">
          Through our safehouse network, girls have found stability, security, and a place to begin healing. Each home provides not just shelter, but a consistent environment where recovery can take root.
          </p>
        </div>
      </div>

      {/* Image Card 2 */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[var(--border)]">
        <img
          src={impact2}
          alt="Education and skills"
          className="w-full h-48 object-cover"
        />
        <div className="p-6">
          <h3 className="font-semibold text-[var(--text-h)] mb-2">
            Education & Skills
          </h3>
          <p className="text-[var(--text)] text-sm">
          With access to counseling, education, and life-skills training, survivors are building confidence and independence. Many go on to pursue education, employment, and leadership opportunities.
          </p>
        </div>
      </div>

      {/* Image Card 3 */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[var(--border)]">
        <img
          src={impact3}
          alt="Community reintegration"
          className="w-full h-48 object-cover"
        />
        <div className="p-6">
          <h3 className="font-semibold text-[var(--text-h)] mb-2">
            Community Reintegration
          </h3>
          <p className="text-[var(--text)] text-sm">
          Our reintegration programs have helped survivors reconnect with their communities in safe and meaningful ways. Ongoing support ensures they continue to thrive beyond the program.
          </p>
        </div>
      </div>

    </div>
  </div>
</div>

        {/* TEAM / IMPACT STYLE SECTION */}
        <section className="py-20 lg:py-28 bg-[var(--color-surface-container-low)]">
          <div className="max-w-[1200px] mx-auto px-6 md:px-12 text-center">

            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Our Commitment
            </h2>

            <p className="text-lg text-[var(--color-on-surface-variant)] max-w-2xl mx-auto mb-10">
              We are committed to long-term change — not just immediate relief.
              Our programs focus on sustainable recovery and reintegration.
            </p>

            <Link
              to="/impact"
              className="btn btn-primary"
            >
              View Our Impact
            </Link>

          </div>
        </section>

        {/* CTA (match landing dark section) */}
        <section className="py-20 lg:py-28 bg-[var(--color-primary)]">
          <div className="max-w-[1200px] mx-auto px-6 md:px-12 text-center">

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Be Part of the Change
            </h2>

            <p className="text-white/80 mb-8">
              Your support helps restore hope and rebuild lives.
            </p>

            <Link
              to="/donate"
              className="btn btn-secondary"
            >
              Support Pag-asa
            </Link>

          </div>
        </section>

      </main>
    </>
  );
}