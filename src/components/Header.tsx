'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { HiOutlinePhone, HiOutlineMenu, HiOutlineX, HiOutlineUser, HiOutlineLogout, HiOutlineClipboardList, HiOutlineCog } from 'react-icons/hi';
import { FiLogIn, FiUserPlus, FiChevronDown } from 'react-icons/fi';
import { BsBriefcase } from 'react-icons/bs';
import LanguageSwitcher from './LanguageSwitcher';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';

// Pages that have light backgrounds and need dark header
const LIGHT_BG_PAGES = ['/explore', '/wilayas', '/hotels', '/restaurants', '/cars', '/profile', '/reservations', '/settings'];

// Pages where header should be floating/fixed (only home page)
const FLOATING_HEADER_PAGES = ['/'];

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if current page has light background
  const isLightBgPage = LIGHT_BG_PAGES.some(page => pathname?.startsWith(page));

  // Check if header should be floating (only on home page)
  const isFloatingHeader = FLOATING_HEADER_PAGES.includes(pathname || '');

  // Use scrolled style if page has light background or user has scrolled
  const useScrolledStyle = isLightBgPage || scrolled;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSwitchToLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  const handleSwitchToRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  return (
    <>
      <header
        className={`z-50 transition-all duration-500 ease-out ${
          isFloatingHeader
            ? `fixed top-0 left-0 right-0 ${scrolled ? 'py-2' : 'py-4'}`
            : 'sticky top-0 bg-white shadow-sm'
        }`}
      >
        <nav
          className={`transition-all duration-500 ease-out ${
            isFloatingHeader
              ? `max-w-7xl mx-4 sm:mx-6 lg:mx-auto px-4 sm:px-6 lg:px-8 ${scrolled
                  ? 'bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/5 py-2.5 sm:py-3'
                  : 'bg-white/10 backdrop-blur-md rounded-2xl py-3 sm:py-4'
                }`
              : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3'
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className={`text-2xl font-extrabold tracking-tight transition-all duration-500 hover:scale-105 ${
                !isFloatingHeader || useScrolledStyle ? 'text-[#2FB7EC]' : 'text-white'
              }`}
            >
              <span className="inline-block animate-fadeIn">Hajz</span>
            </Link>

            {/* Right Side */}
            <div className="hidden md:flex items-center gap-3">
              {/* Phone Number */}
              <a
                href="tel:+213123456789"
                className={`flex items-center gap-2 transition-all duration-500 group ${
                  !isFloatingHeader || useScrolledStyle ? 'text-gray-600 hover:text-[#2FB7EC]' : 'text-white/90 hover:text-white'
                }`}
              >
                <span className={`p-2 rounded-full transition-all duration-300 ${
                  !isFloatingHeader || useScrolledStyle ? 'bg-gray-100 group-hover:bg-[#2FB7EC]/10' : 'bg-white/10 group-hover:bg-white/20'
                }`}>
                  <HiOutlinePhone size={16} className="group-hover:rotate-12 transition-transform duration-300" />
                </span>
                <span className="font-medium text-sm">+213 123 456 789</span>
              </a>

              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Auth Buttons */}
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                      !isFloatingHeader || useScrolledStyle
                        ? 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      !isFloatingHeader || useScrolledStyle ? 'bg-[#2FB7EC]/10 text-[#2FB7EC]' : 'bg-white/20 text-white'
                    }`}>
                      <HiOutlineUser size={18} />
                    </div>
                    <span className="max-w-[100px] truncate">{user.name}</span>
                    <FiChevronDown
                      size={16}
                      className={`transition-transform duration-300 ${showUserDropdown ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl shadow-black/10 border border-gray-100 py-2 z-50 animate-fadeIn">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <HiOutlineUser size={18} className="text-gray-400" />
                          <span>My Profile</span>
                        </Link>
                        <Link
                          href="/reservations"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <HiOutlineClipboardList size={18} className="text-gray-400" />
                          <span>My Reservations</span>
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <HiOutlineCog size={18} className="text-gray-400" />
                          <span>Settings</span>
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={() => { logout(); setShowUserDropdown(false); }}
                          className="flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors w-full"
                        >
                          <HiOutlineLogout size={18} />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Pro Button */}
                  <Link
                    href="/pro/login"
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 border-2 ${
                      !isFloatingHeader || useScrolledStyle
                        ? 'border-gray-200 text-gray-700 hover:border-[#2FB7EC] hover:text-[#2FB7EC]'
                        : 'border-white/30 text-white hover:border-white hover:bg-white/10'
                    }`}
                  >
                    <BsBriefcase size={16} />
                    Pro
                  </Link>

                  {/* Sign In Button */}
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                      !isFloatingHeader || useScrolledStyle
                        ? 'text-gray-700 hover:text-[#2FB7EC]'
                        : 'text-white hover:text-white/80'
                    }`}
                  >
                    <FiLogIn size={16} />
                    Sign In
                  </button>

                  {/* Register Button */}
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 ${
                      !isFloatingHeader || useScrolledStyle
                        ? 'bg-[#2FB7EC] text-white shadow-lg shadow-[#2FB7EC]/25 hover:shadow-xl hover:shadow-[#2FB7EC]/30'
                        : 'bg-white text-gray-900 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    <FiUserPlus size={16} />
                    Register
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden p-2.5 rounded-xl transition-all duration-300 ${
                !isFloatingHeader || useScrolledStyle
                  ? 'text-gray-600 hover:bg-gray-100'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <div className="relative w-6 h-6">
                <HiOutlineMenu
                  size={24}
                  className={`absolute inset-0 transition-all duration-300 ${
                    isMenuOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'
                  }`}
                />
                <HiOutlineX
                  size={24}
                  className={`absolute inset-0 transition-all duration-300 ${
                    isMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Mobile Menu */}
          <div
            className={`md:hidden overflow-hidden transition-all duration-500 ease-out ${
              isMenuOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}
          >
            <div className={`pt-4 border-t ${!isFloatingHeader || useScrolledStyle ? 'border-gray-100' : 'border-white/10'}`}>
              <div className="flex flex-col gap-3">
                <a
                  href="tel:+213123456789"
                  className={`flex items-center gap-3 py-3 px-3 rounded-xl transition-all duration-300 ${
                    !isFloatingHeader || useScrolledStyle ? 'text-gray-600 hover:bg-gray-50' : 'text-white hover:bg-white/10'
                  }`}
                >
                  <HiOutlinePhone size={20} />
                  <span className="font-medium">+213 123 456 789</span>
                </a>

                <div className="py-2 px-3">
                  <LanguageSwitcher />
                </div>

                {user ? (
                  <div className="flex items-center justify-between py-3 px-3">
                    <span className={`font-medium ${!isFloatingHeader || useScrolledStyle ? 'text-gray-700' : 'text-white'}`}>
                      {user.name}
                    </span>
                    <button
                      onClick={() => { logout(); setIsMenuOpen(false); }}
                      className="text-red-500 font-medium"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Pro Button Mobile */}
                    <Link
                      href="/pro/login"
                      className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-medium transition-all duration-300 border-2 ${
                        !isFloatingHeader || useScrolledStyle
                          ? 'border-gray-200 text-gray-700'
                          : 'border-white/30 text-white'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <BsBriefcase size={18} />
                      Professional Access
                    </Link>

                    {/* Sign In Mobile */}
                    <button
                      onClick={() => { setShowLoginModal(true); setIsMenuOpen(false); }}
                      className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-medium transition-all duration-300 ${
                        !isFloatingHeader || useScrolledStyle ? 'text-gray-700 hover:bg-gray-50' : 'text-white hover:bg-white/10'
                      }`}
                    >
                      <FiLogIn size={18} />
                      Sign In
                    </button>

                    {/* Register Mobile */}
                    <button
                      onClick={() => { setShowRegisterModal(true); setIsMenuOpen(false); }}
                      className="flex items-center justify-center gap-2 bg-[#2FB7EC] text-white px-5 py-3 rounded-xl font-medium transition-all duration-300 hover:bg-[#26a5d8]"
                    >
                      <FiUserPlus size={18} />
                      Register
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={handleSwitchToRegister}
      />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </>
  );
}
