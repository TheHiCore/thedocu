export interface CertificateTemplate {
  id: string;
  name: string;
  orientation: "portrait" | "landscape";
  background?: string;
  nameConfig: TextConfig;
  subtitleConfig: TextConfig;
  subsubtitleConfig: TextConfig;
  subtitleEnabled: boolean;
  subsubtitleEnabled: boolean;
  signers: CertificateSignerData[];
  createdAt: number;
}

export interface TextConfig {
  alignment: "left" | "center" | "right";
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  pdfOffset?: number;
  prefix?: string;
  prefixColor?: string;
}

export interface CertificateSignerData {
  name: string;
  role: string;
  image: string;
  position: { x: number; y: number; size: number };
}

export interface CustomFont {
  name: string;
  url: string; // data URL of the font file
}

export interface CertificateEntry {
  id: string;
  name: string;
  subtitle: string;
  subsubtitle: string;
  selected: boolean;
  // Per-entry overrides (optional)
  nameConfig?: Partial<TextConfig>;
  subtitleConfig?: Partial<TextConfig>;
  subsubtitleConfig?: Partial<TextConfig>;
}

export interface CertificateExportOptions {
  type: "single-pdf" | "zip";
  projectName: string;
}

// Default fonts + ability to add custom ones
export const DEFAULT_FONTS = [
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Times New Roman", value: "'Times New Roman', serif" },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Verdana", value: "Verdana, sans-serif" },
  { name: "Tahoma", value: "Tahoma, sans-serif" },
  { name: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { name: "Courier New", value: "'Courier New', monospace" },
  { name: "Palatino", value: "'Palatino Linotype', 'Book Antiqua', Palatino, serif" },
  { name: "Garamond", value: "Garamond, serif" },
  { name: "Calibri", value: "Calibri, sans-serif" },
  { name: "Cambria", value: "Cambria, serif" },
  { name: "Century Gothic", value: "'Century Gothic', sans-serif" },
  { name: "Comic Sans MS", value: "'Comic Sans MS', cursive" },
  { name: "Impact", value: "Impact, sans-serif" },
  { name: "Lucida Console", value: "'Lucida Console', monospace" },
  { name: "Lucida Sans", value: "'Lucida Sans Unicode', sans-serif" },
  { name: "Segoe UI", value: "'Segoe UI', sans-serif" },
  { name: "Brush Script MT", value: "'Brush Script MT', cursive" },
];

export const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 84, 96];

export const createDefaultCertificateTemplate = (): CertificateTemplate => ({
  id: crypto.randomUUID(),
  name: "New Certificate",
  orientation: "landscape",
  nameConfig: {
    alignment: "center",
    x: 148.5, // center of A4 landscape
    y: 110,
    fontSize: 48,
    color: "#000000",
    fontFamily: "Georgia, serif",
  },
  subtitleConfig: {
    alignment: "center",
    x: 148.5,
    y: 140,
    fontSize: 24,
    color: "#333333",
    fontFamily: "Georgia, serif",
  },
  subsubtitleConfig: {
    alignment: "center",
    x: 148.5,
    y: 160,
    fontSize: 18,
    color: "#555555",
    fontFamily: "Georgia, serif",
  },
  subtitleEnabled: true,
  subsubtitleEnabled: false,
  signers: [
    {
      name: "",
      role: "",
      image: "",
      position: { x: 148.5, y: 180, size: 45 },
    },
  ],
  createdAt: Date.now(),
});

export const createDefaultCertificateSigner = (): CertificateSignerData => ({
  name: "",
  role: "",
  image: "",
  position: { x: 148.5, y: 180, size: 45 },
});
