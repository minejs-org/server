/* eslint-disable @typescript-eslint/no-explicit-any */
// src/mod/i18n.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import type { I18nConfig, TranslationSet } from '../types';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    class I18nManager {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            private translations        : TranslationSet = {};
            private currentLanguage     : string = 'en';
            private defaultLanguage     : string = 'en';
            private supportedLanguages  = new Set<string>(['en']);
            private cachePath           : string = '';

            constructor(config?: I18nConfig) {
                if (config) {
                    this.defaultLanguage = config.defaultLanguage || 'en';
                    this.currentLanguage = config.defaultLanguage || 'en';
                    this.cachePath = config.staticPath || 'static/i18n';
                    if (config.supportedLanguages) {
                        this.supportedLanguages = new Set(config.supportedLanguages);
                    }
                }
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── MAIN ──────────────────────────────┐

            /**
             * Load translations for a specific language
             * @param lang Language code (e.g., 'en', 'ar', 'fr')
             * @param translations Translation object (can be nested)
             */
            public loadLanguage(lang: string, translations: Record<string, any>): void {
                if (!this.translations[lang]) {
                    this.translations[lang] = {};
                }
                // Flatten the nested translations
                const flattened = this.flattenObject(translations);
                this.translations[lang] = { ...this.translations[lang], ...flattened };
                this.supportedLanguages.add(lang);
            }

            /**
             * Flatten nested object into dot notation
             * @param obj Nested object
             * @param prefix Current prefix
             * @returns Flattened object with dot notation keys
             */
            private flattenObject(obj: Record<string, any>, prefix: string = ''): Record<string, string> {
                const flattened: Record<string, string> = {};

                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        const value = obj[key];
                        const newKey = prefix ? `${prefix}.${key}` : key;

                        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                            // Recursively flatten nested objects
                            Object.assign(flattened, this.flattenObject(value, newKey));
                        } else {
                            // Store the value
                            flattened[newKey] = String(value);
                        }
                    }
                }

                return flattened;
            }

            /**
             * Load all translations from static files
             * @param translations Object with language codes as keys and translation objects as values
             */
            public loadTranslations(translations: Record<string, Record<string, any>>): void {
                Object.entries(translations).forEach(([lang, trans]) => {
                    this.loadLanguage(lang, trans);
                });
            }

            /**
             * Set the current language
             * @param lang Language code
             */
            public setLanguage(lang: string): void {
                if (this.supportedLanguages.has(lang)) {
                    this.currentLanguage = lang;
                } else if (this.supportedLanguages.has(this.defaultLanguage)) {
                    this.currentLanguage = this.defaultLanguage;
                }
            }

            /**
             * Get the current language
             */
            public getLanguage(): string {
                return this.currentLanguage;
            }

            /**
             * Get all supported languages
             */
            public getSupportedLanguages(): string[] {
                return Array.from(this.supportedLanguages);
            }

            /**
             * Translate a key with smart parameter replacement
             * Supports nested translation keys as parameter values
             *
             * @example
             * // Simple translation
             * t('button.login') // => "Login" or "دخـول"
             *
             * @example
             * // With parameters
             * t('nav.credits', { count: '100' })
             * // => "Available Credits: 100"
             *
             * @example
             * // With nested translation keys as parameters
             * t('language.switching_to', { language: 'button.login' })
             * // => "Switching to Login..."
             *
             * @param key Translation key (dot-notation for nested keys)
             * @param params Optional parameters for replacement
             * @param defaultValue Optional default value
             * @returns Translated string with replaced parameters
             */
            public t(key: string, params?: Record<string, string>, defaultValue?: string): string {
                const lang = this.currentLanguage;

                let translation = this.getTranslation(key, defaultValue);

                // Replace parameters if provided
                if (params) {
                    Object.entries(params).forEach(([param, value]) => {
                        // Check if the parameter value is a translation key
                        const paramValue = this.translations[lang]?.[value] ||
                            this.translations[this.defaultLanguage]?.[value] ||
                            value;

                        translation = translation.replace(
                            new RegExp(`\\{${param}\\}`, 'g'),
                            paramValue
                        );
                    });
                }

                return translation;
            }

            private getTranslation(key: string, defaultValue?: string): string {
                const lang = this.currentLanguage;

                // warn if not found
                if (!this.translations[lang]?.[key]) {
                    console.warn(`Translation key not found: ${key}`);

                    return defaultValue || key;
                }

                return this.translations[lang]?.[key] || this.translations[this.defaultLanguage]?.[key];
            }

            /**
             * Translate with a specific language (overrides current language temporarily)
             *
             * @param key Translation key
             * @param lang Language code
             * @param params Optional parameters
             * @returns Translated string
             */
            public tLang(key: string, lang: string, params?: Record<string, string>): string {
                const currentLang = this.currentLanguage;
                this.setLanguage(lang);
                const result = this.t(key, params);
                this.currentLanguage = currentLang;
                return result;
            }

            /**
             * Get all translations for current language
             */
            public getTranslations(): Record<string, string> {
                return this.translations[this.currentLanguage] || {};
            }

            /**
             * Check if a translation key exists
             * @param key Translation key
             * @returns true if key exists in current or default language
             */
            public hasKey(key: string): boolean {
                return !!(
                    this.translations[this.currentLanguage]?.[key] ||
                    this.translations[this.defaultLanguage]?.[key]
                );
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ GLOB ════════════════════════════════════════╗

    // Singleton instance
    let i18nInstance: I18nManager | null = null;

    /**
     * Initialize the i18n manager
     * @param config I18n configuration
     * @returns I18nManager instance
     */
    export function initI18n(config?: I18nConfig): I18nManager {
        if (!i18nInstance) {
            i18nInstance = new I18nManager(config);
        }
        return i18nInstance;
    }

    /**
     * Get the global i18n instance
     */
    export function getI18n(): I18nManager {
        if (!i18nInstance) {
            i18nInstance = new I18nManager();
        }
        return i18nInstance;
    }

    /**
     * Global translation function
     * @param key Translation key (supports dot notation for nested keys)
     * @param params Optional parameters
     * @param defaultValue Optional default value
     * @returns Translated string
     */
    export function t(key: string, params?: Record<string, string>, defaultValue?: string): string {
        return getI18n().t(key, params, defaultValue);
    }

    /**
     * Set the current language globally
     * @param lang Language code
     */
    export function setLanguage(lang: string): void {
        getI18n().setLanguage(lang);
    }

    /**
     * Get the current language
     */
    export function getCurrentLanguage(): string {
        return getI18n().getLanguage();
    }

    /**
     * Get all supported languages
     */
    export function getSupportedLanguages(): string[] {
        return getI18n().getSupportedLanguages();
    }

    export { I18nManager };
    export type { I18nConfig, TranslationSet };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝