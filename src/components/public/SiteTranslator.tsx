"use client";

import { useEffect, useRef, useState } from "react";
import { Languages } from "lucide-react";
import {
  DEFAULT_TRANSLATION_LANGUAGES,
  normalizeTranslationLanguages,
  type TranslationLanguageCode,
} from "@/lib/portfolio-types";

const GOOGLE_TRANSLATE_SCRIPT_ID = "google-translate-script";

type GoogleTranslateElement = new (
  options: {
    pageLanguage: string;
    includedLanguages: string;
    autoDisplay: boolean;
  },
  containerId: string,
) => unknown;

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement?: GoogleTranslateElement;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

export function SiteTranslator() {
  const [language, setLanguage] = useState("en");
  const [languages, setLanguages] = useState<TranslationLanguageCode[]>([
    ...DEFAULT_TRANSLATION_LANGUAGES,
  ]);
  const [status, setStatus] = useState("");
  const [widgetReady, setWidgetReady] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const observer = useRef<MutationObserver | null>(null);
  const optionObserver = useRef<MutationObserver | null>(null);
  const timeout = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site-settings", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load language settings.");
        return response.json();
      })
      .then((settings: {
        preferredLanguage?: unknown;
        translationLanguages?: unknown;
      }) => {
        if (cancelled) return;
        const enabledLanguages = normalizeTranslationLanguages(
          settings.translationLanguages,
        );
        setLanguages(enabledLanguages);
        if (
          typeof settings.preferredLanguage === "string" &&
          enabledLanguages.includes(
            settings.preferredLanguage as TranslationLanguageCode,
          )
        ) {
          setLanguage(settings.preferredLanguage);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = "ltr";

    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    if (language === "en") {
      document.cookie = `googtrans=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
      return;
    }

    document.cookie = `googtrans=${encodeURIComponent(`/en/${language}`)}; Path=/; SameSite=Lax${secure}`;
    if (document.querySelector("#google-translate-element .goog-te-combo")) {
      return;
    }

    const initializeForLocation = () => {
      const TranslateElement = window.google?.translate?.TranslateElement;
      if (!TranslateElement) return;
      new TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: languages.join(","),
          autoDisplay: false,
        },
        "google-translate-element",
      );
      setWidgetReady(true);
    };

    window.googleTranslateElementInit = initializeForLocation;
    if (window.google?.translate?.TranslateElement) {
      initializeForLocation();
      return;
    }

    if (document.getElementById(GOOGLE_TRANSLATE_SCRIPT_ID)) return;
    const script = document.createElement("script");
    script.id = GOOGLE_TRANSLATE_SCRIPT_ID;
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.onerror = () => {
      setStatus("Automatic translation could not be loaded.");
      script.remove();
    };
    document.body.appendChild(script);
  }, [language, languages]);

  useEffect(() => {
    const digits = language === "ar"
      ? "٠١٢٣٤٥٦٧٨٩"
      : "0123456789";
    const digitPattern = /[0-9٠-٩]/g;

    const localizeDigits = (textNode: Node) => {
      if (
        !textNode.textContent ||
        textNode.parentElement?.closest(
          "#google-translate-element, script, style, noscript",
        )
      ) {
        return;
      }

      const localized = textNode.textContent.replace(digitPattern, (digit) => {
        const value = digit.charCodeAt(0) >= 0x0660
          ? digit.charCodeAt(0) - 0x0660
          : digit.charCodeAt(0) - 0x0030;
        return digits[value];
      });

      if (localized !== textNode.textContent) {
        textNode.textContent = localized;
      }
    };

    const localizeTree = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        localizeDigits(node);
        return;
      }

      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) localizeDigits(walker.currentNode);
    };

    localizeTree(document.body);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") {
          localizeDigits(mutation.target);
        } else {
          mutation.addedNodes.forEach(localizeTree);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [language]);

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      const details = detailsRef.current;
      if (
        !details?.open ||
        details.contains(event.target as Node)
      ) {
        return;
      }

      details.removeAttribute("open");
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    const handleWidgetChange = (event: Event) => {
      const select = event.currentTarget as HTMLSelectElement;
      const nextLanguage = select.value || "en";
      setLanguage(nextLanguage);
      setStatus("");
      detailsRef.current?.removeAttribute("open");
    };

    const attachWidgetListener = () => {
      const select = document.querySelector<HTMLSelectElement>(
        "#google-translate-element .goog-te-combo",
      );
      if (!select) return false;

      const ensureEnglishOption = () => {
        select.size = 1;
        const enabledCodes = new Set(languages);
        Array.from(select.options).forEach((option) => {
          if (option.value && !enabledCodes.has(option.value as TranslationLanguageCode)) {
            option.remove();
          }
        });
        const originalOption = Array.from(select.options).find(
          ({ value }) => value === "",
        );
        const englishOption = Array.from(select.options).find(
          ({ value }) => value === "en",
        );
        if (originalOption && englishOption) {
          originalOption.remove();
          return;
        }
        if (originalOption) {
          originalOption.textContent = "English";
          return;
        }

        if (!englishOption) {
          const sourceOption = document.createElement("option");
          sourceOption.value = "";
          sourceOption.textContent = "English";
          select.insertBefore(sourceOption, select.firstChild);
        }
      };

      ensureEnglishOption();
      optionObserver.current?.disconnect();
      optionObserver.current = new MutationObserver(ensureEnglishOption);
      optionObserver.current.observe(select, { childList: true });
      select.addEventListener("change", handleWidgetChange);
      const preferredOption = Array.from(select.options).some(
        ({ value }) => value === language,
      )
        ? language
        : language === "en"
          ? ""
          : null;
      if (preferredOption !== null && select.value !== preferredOption) {
        select.value = preferredOption;
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
      observer.current?.disconnect();
      observer.current = null;
      if (timeout.current !== null) window.clearTimeout(timeout.current);
      timeout.current = null;
      setWidgetReady(true);
      setStatus("");
      return true;
    };

    if (!widgetReady) return;
    if (attachWidgetListener()) {
      return () => {
        document
          .querySelector<HTMLSelectElement>(
            "#google-translate-element .goog-te-combo",
          )
          ?.removeEventListener("change", handleWidgetChange);
        optionObserver.current?.disconnect();
        optionObserver.current = null;
      };
    }

    observer.current = new MutationObserver(() => attachWidgetListener());
    observer.current.observe(
      document.getElementById("google-translate-element")!,
      { childList: true, subtree: true },
    );
    return () => observer.current?.disconnect();
  }, [language, languages, widgetReady]);

  useEffect(
    () => () => {
      observer.current?.disconnect();
      optionObserver.current?.disconnect();
      if (timeout.current !== null) window.clearTimeout(timeout.current);
    },
    [],
  );

  const initializeTranslator = () => {
    const TranslateElement = window.google?.translate?.TranslateElement;
    if (!TranslateElement) return;
    const targetLanguages = languages.filter((code) => code !== "en");
    if (!targetLanguages.length) {
      setStatus("Only English is enabled.");
      return;
    }

    const existingSelect = document.querySelector(
      "#google-translate-element .goog-te-combo",
    );
    if (existingSelect) {
      setWidgetReady(true);
      return;
    }

    new TranslateElement(
      {
        pageLanguage: "en",
        includedLanguages: languages.join(","),
        autoDisplay: false,
      },
      "google-translate-element",
    );
    setWidgetReady(true);
  };

  const openTranslator = () => {
    if (!detailsRef.current?.open) return;
    if (languages.every((code) => code === "en")) {
      setStatus("Only English is enabled.");
      return;
    }

    if (document.querySelector("#google-translate-element .goog-te-combo")) {
      setWidgetReady(true);
      return;
    }

    setStatus("Loading languages...");
    window.googleTranslateElementInit = initializeTranslator;

    if (window.google?.translate?.TranslateElement) {
      initializeTranslator();
      return;
    }

    if (document.getElementById(GOOGLE_TRANSLATE_SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = GOOGLE_TRANSLATE_SCRIPT_ID;
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.onerror = () => {
      setStatus("Translation could not be loaded. Please try again.");
      script.remove();
    };
    document.body.appendChild(script);

    timeout.current = window.setTimeout(() => {
      setStatus("Translation is taking too long. Please try again.");
    }, 15000);
  };

  const selectedLanguage = language.toUpperCase();

  return (
    <details
      ref={detailsRef}
      className="notranslate relative shrink-0"
      translate="no"
      onToggle={(event) => {
        const isOpen = event.currentTarget.open;
        if (isOpen) openTranslator();
      }}
    >
      <summary
        aria-label={`Website language: ${selectedLanguage}.`}
        className="flex h-9 cursor-pointer list-none items-center justify-center gap-1.5 rounded-md border border-border bg-secondary px-2 text-foreground transition-colors hover:border-primary hover:text-primary [&::-webkit-details-marker]:hidden"
      >
        <Languages size={15} aria-hidden="true" />
        <span className="font-mono text-[9px] font-bold uppercase" aria-hidden="true">
          {selectedLanguage}
        </span>
      </summary>
      <div
        dir="ltr"
        className="site-translator-popup text-foreground"
      >
        <p className="mb-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          Language
        </p>
        <div
          id="google-translate-element"
          className="site-translator-widget notranslate min-h-10"
          translate="no"
        />
        {status && (
          <span
            className="mt-1 block text-[10px] text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            {status}
          </span>
        )}
      </div>
    </details>
  );
}