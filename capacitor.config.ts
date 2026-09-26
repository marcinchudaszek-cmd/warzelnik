import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.marcin.warzelnik",
  appName: "Warzelnik",
  webDir: "dist-cap",
  // Tło WebView przed wczytaniem strony (amber-100 z gradientu tła)
  backgroundColor: "#fef3c7",
  plugins: {
    // Natywny HTTP zamiast fetch z WebView — pobieranie baz z dowolnych URL bez CORS.
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
