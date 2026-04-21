import type { LocalizedString } from "@/types/shop";
import type { Lang } from "@/lib/i18n";

/** Resolve a LocalizedString to a plain string for the given language. */
export const loc = (value: LocalizedString | undefined, lang: Lang): string => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return value[lang] ?? value.ru ?? value.en ?? "";
};
