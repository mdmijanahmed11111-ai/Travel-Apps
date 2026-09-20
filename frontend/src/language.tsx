import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { storage } from "@/src/utils/storage";
import { LangCode, translate, SUPPORTED_LANGS } from "@/src/i18n";

type Ctx = {
  lang: LangCode;
  setLang: (l: LangCode) => Promise<void>;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LanguageCtx = createContext<Ctx>({
  lang: "en",
  setLang: async () => {},
  t: (k: string) => k,
});

const KEY = "gt_lang";

function detectDefault(): LangCode {
  try {
    if (typeof navigator !== "undefined" && (navigator as any).language) {
      const raw = String((navigator as any).language).toLowerCase().split(/[-_]/)[0];
      const match = SUPPORTED_LANGS.find((l) => l.code === raw);
      if (match) return match.code;
    }
  } catch {}
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");

  useEffect(() => {
    (async () => {
      const stored = (await storage.getItem(KEY)) as LangCode | null;
      if (stored && SUPPORTED_LANGS.some((l) => l.code === stored)) {
        setLangState(stored);
      } else {
        setLangState(detectDefault());
      }
    })();
  }, []);

  const setLang = useCallback(async (l: LangCode) => {
    await storage.setItem(KEY, l);
    setLangState(l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  return <LanguageCtx.Provider value={{ lang, setLang, t }}>{children}</LanguageCtx.Provider>;
}

export const useLanguage = () => useContext(LanguageCtx);
