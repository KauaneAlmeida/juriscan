"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Como Funciona", href: "#como-funciona" },
  { label: "Planos", href: "#planos" },
  { label: "Depoimentos", href: "#depoimentos" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-colors duration-200 ${
        scrolled
          ? "border-white/[0.08] bg-[#0f1923]/30 backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5" aria-label="Juriscan, página inicial">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#1a4fd6] font-dm-sans text-[15px] font-bold text-white"
            aria-hidden="true"
          >
            J
          </span>
          <span className="font-dm-sans text-[17px] font-semibold tracking-tight text-white">
            Juriscan
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="font-dm-sans text-[14px] font-medium text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] transition-colors hover:text-[#f5b800]"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop right CTAs */}
        <div className="hidden items-center gap-5 lg:flex">
          <Link
            href="/login"
            className="font-dm-sans text-[14px] font-medium text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] transition-colors hover:text-[#f5b800]"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="rounded-[8px] bg-[#1a4fd6] px-[18px] py-2 font-dm-sans text-[14px] font-semibold text-white transition-colors hover:bg-[#1440b8]"
          >
            Começar grátis
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-[8px] text-white lg:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="absolute inset-x-0 top-16 z-40 border-b border-white/[0.08] bg-[#0f1923] px-5 py-6 shadow-lg lg:hidden">
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-[8px] px-3 py-3 font-dm-sans text-[15px] font-medium text-white/80 hover:bg-white/[0.04] hover:text-[#f5b800]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-3 border-t border-white/[0.08] pt-4">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block rounded-[8px] px-3 py-3 text-center font-dm-sans text-[15px] font-medium text-white/65"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="block rounded-[8px] bg-[#1a4fd6] px-3 py-3 text-center font-dm-sans text-[15px] font-semibold text-white hover:bg-[#1440b8]"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
