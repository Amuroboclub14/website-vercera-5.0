import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, MapPin } from 'lucide-react'

const MAP_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d612.6850131734105!2d78.07731245929473!3d27.91425835521257!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3974a4e35a72ca85%3A0xc0f01f571f2881a9!2sAmuroboclub%20Office!5e1!3m2!1sen!2sin!4v1770872210538!5m2!1sen!2sin'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-secondary/50 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-18 h-8 flex items-center justify-center">
                <img src="/vercera_logo_full.png" alt="Vercera" className="w-full h-full object-contain" />
              </div>
              {/* <span className="font-display font-bold text-lg">Vercera</span> */}
            </div>
            <p className="text-foreground/60 text-sm">
              National-level technical fest bringing together innovators and builders from across the country.
            </p>
            <div className="pt-2">
              <p className="text-foreground/50 text-xs mb-2">Organized by</p>
              <a
                href="https://amuroboclub.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block transition-transform hover:scale-105"
              >
              <Image
                src="/amuroboclub.png"
                alt="AMURoboclub"
                width={200}
                height={60}
                quality={100}
                className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
              />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-bold text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#home" className="text-foreground/60 hover:text-accent transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#events" className="text-foreground/60 hover:text-accent transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="text-foreground/60 hover:text-accent transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-foreground/60 hover:text-accent transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact + Map */}
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-foreground mb-4">Get in Touch</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Mail size={16} className="text-accent flex-shrink-0 mt-0.5" />
                  <a href="mailto:chairperson@amuroboclub.com" className="text-foreground/60 hover:text-accent transition-colors break-all">
                    chairperson@amuroboclub.com
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <Phone size={16} className="text-accent flex-shrink-0 mt-0.5" />
                  <a href="tel:+919999999999" className="text-foreground/60 hover:text-accent transition-colors">
                    +91 9999 999 999
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin size={16} className="text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/60">AMURoboclub, Mechanical Dept, Aligarh Muslim University</span>
                </li>
              </ul>
            </div>
            <div className="overflow-hidden rounded-xl border border-border/50 bg-card/30 w-full max-w-[320px] aspect-[4/3]">
              <iframe
                title="AMURoboclub"
                src={MAP_EMBED_URL}
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-8"></div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center text-foreground/60 text-sm">
          <p>&copy; {currentYear} Vercera Technical Fest. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-accent transition-colors">
              Twitter
            </a>
            <a href="#" className="hover:text-accent transition-colors">
              LinkedIn
            </a>
            <a href="#" className="hover:text-accent transition-colors">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
