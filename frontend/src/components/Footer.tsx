import { Link } from "react-router-dom";
import houseLogo from "../assets/house-logo.png";

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h4 className="mb-1">{title}</h4>
      {links.map(({ label, href }) => (
        <Link
        key={label}
        to={href}
        className="text-[var(--color-on-surface-variant)] text-sm hover:text-[var(--color-primary)] no-underline transition-colors"
      >
        {label}
      </Link>
      ))}
    </div>
  )
}

export function Footer() {
  return (
    <footer className="bg-[var(--color-surface-container-low)] border-t border-[var(--color-outline-variant)] mt-auto">
      <div className="grid grid-cols-1 md:grid-cols-[1.5fr_2fr] gap-10 md:gap-[60px] py-10 px-6 md:py-[60px] md:px-8 max-w-[1200px] mx-auto">
        <div>
          <div className="mb-4 inline-flex items-center gap-2">
            <img src={houseLogo} alt="Pag-asa Sanctuary logo" className="h-10 w-auto mb-2" /> 
            <span className="flex text-[22px] font-bold text-[var(--color-on-surface)] tracking-tight">
              Pag-asa Sanctuary
            </span>
          </div>
          <p className="text-[var(--color-on-surface-variant)] text-sm leading-relaxed max-w-[300px]">
            Pag-asa means "hope" in Tagalog. We restore hope and rebuild lives for survivors of abuse and trafficking.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
          <FooterColumn
            title="Organization"
            links={[
              { label: 'Our Mission', href: '#mission' },
              { label: 'Impact', href: '#impact' },
              { label: 'About Us', href: '#' },
              { label: 'Our Team', href: '#' },
            ]}
          />
          <FooterColumn
            title="Get Involved"
            links={[
              { label: 'Donate', href: '#' },
              { label: 'Volunteer', href: '#' },
              { label: 'Partner', href: '#' },
              { label: 'Careers', href: '#' },
            ]}
          />
          <FooterColumn
            title="Resources"
            links={[
              { label: 'Annual Reports', href: '#' },
              { label: 'News', href: '#' },
              { label: 'FAQ', href: '#' },
              { label: 'Contact Us', href: 'mailto:contact@pagasasanctuary.org' },
              { label: 'Privacy Policy', href: '/privacy' },
            ]}
          />
        </div>
      </div>
      <div className="border-t border-[var(--color-outline-variant)] py-6 px-8 text-center">
        <p className="text-[13px] text-[var(--color-on-surface-variant)]">
          © 2026 Pag-asa Sanctuary. All rights reserved. A 501(c)(3) nonprofit organization.
        </p>
      </div>
    </footer>
  )
}
