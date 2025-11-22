'use client';

import Link from 'next/link';
import { FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa';

const currentYear = new Date().getFullYear();

const QUICK_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/who-we-are', label: 'About Us' },
  { href: '/oral-history/how-it-works', label: 'How It Works' },
  { href: '/archived-stories', label: 'Archive Stories' },
  { href: '/contact-us', label: 'Contact' },
];

const SOCIAL_LINKS = [
  { href: 'https://facebook.com', icon: FaFacebook, label: 'Facebook' },
  { href: 'https://instagram.com', icon: FaInstagram, label: 'Instagram' },
  { href: 'https://youtube.com', icon: FaYoutube, label: 'YouTube' },
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {/* Quick Links */}
        <nav aria-label="Quick Links">
          <ul className="space-y-2 text-gray-600 text-sm">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="hover:text-green-700 transition"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Social Media */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Follow Us
          </h3>
          <div className="flex space-x-4 text-gray-600 text-2xl">
            {SOCIAL_LINKS.map(({ href, icon: Icon, label }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="hover:text-green-700 transition"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>

        {/* Optional Logo or Future Section */}
      </div>

      <div className="border-t border-gray-100 mt-10 py-4 text-center text-gray-600 text-sm">
        <p>
          © {currentYear} · All Rights Reserved ·{' '}
          <span className="font-medium text-green-700">
            The Evergreen Education Foundation
          </span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          US-based non-profit 501(c)(3) organization
        </p>
      </div>
    </footer>
  );
}
