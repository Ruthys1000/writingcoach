export interface SystemSettings {
    max_lessons: number;
    llm_timeout_seconds: number;
    rate_limit_enabled: boolean;
    rate_limit_max: number;
    rate_limit_window_minutes: number;
    site_title: string;
    site_tagline: string;
    footer_color: string;
    footer_text: string;
    logo_data_url: string;
    hero_badge: string;
    hero_subtitle: string;
    cta_button_text: string;
}
export declare const settingsStore: {
    get(): SystemSettings;
    update(patch: Partial<SystemSettings>): SystemSettings;
};
//# sourceMappingURL=settings-store.d.ts.map