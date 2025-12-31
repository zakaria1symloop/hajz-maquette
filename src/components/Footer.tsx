'use client';

import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 text-center">
        <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} Hajz. {t('rights')}</p>
      </div>
    </footer>
  );
}
