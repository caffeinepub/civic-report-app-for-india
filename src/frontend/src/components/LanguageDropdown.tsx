import { Check, ChevronDown } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import {
  type Language,
  languages,
  useLanguage,
} from "../contexts/LanguageContext";

export function LanguageDropdown() {
  const { currentLanguage, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLanguageSelect = (language: Language) => {
    setLanguage(language);
    setIsOpen(false);
  };

  return (
    <div className="language-dropdown-compact" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="language-dropdown-trigger-compact"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="language-dropdown-text-compact">
          {currentLanguage.nativeName}
        </span>
        <ChevronDown
          className={`language-dropdown-icon-compact ${isOpen ? "language-dropdown-icon-open" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="language-dropdown-menu-compact">
          <div className="language-dropdown-content">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageSelect(language)}
                className={`language-dropdown-item-compact ${
                  currentLanguage.code === language.code
                    ? "language-dropdown-item-selected"
                    : ""
                }`}
                role="option"
                aria-selected={currentLanguage.code === language.code}
              >
                <span className="language-dropdown-item-text-compact">
                  {language.nativeName}
                </span>
                {currentLanguage.code === language.code && (
                  <Check className="language-dropdown-check-compact" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
