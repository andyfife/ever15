'use client';

import { useEffect, useState } from 'react';

export default function Footer() {
  const [currentYear, setCurrentYear] = useState(2025);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="w-full mt-12 border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col items-center justify-center text-center text-xs text-gray-600 sm:text-sm">
        <p>
          © {currentYear} · All Rights Reserved ·{' '}
          <span className="font-medium text-green-700">
            The Evergreen Education Foundation
          </span>{' '}
          is a US-based non-profit 501(c)(3) organization.
        </p>
      </div>
    </footer>
  );
}
