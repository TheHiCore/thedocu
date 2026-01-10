export interface CoordinateField {
  label: string;
  color: string;
  value: string;
}

export interface SignerData {
  name: string;
  role: string;
  image: string;
  position: { x: number; y: number; size: number };
}

export interface Template {
  id: string;
  name: string;
  coordinates: {
    name: CoordinateField;
    role: CoordinateField;
    phone: CoordinateField;
    email: CoordinateField;
  };
  object: {
    label: string;
    color: string;
    title: string;
  };
  positions: {
    coordinates: { x: number; y: number };
    body: { x: number; y: number };
    signature: { x: number; y: number; size: number };
  };
  background?: string;
  signatureImage?: string;
  signatureName?: string;
  signatureRole?: string;
  // Multi-signer support (up to 3 signers)
  signers?: SignerData[];
  fontFamily?: string;
  fontSize?: number;
  createdAt: number;
}

// Common system fonts available on most computers
export const SYSTEM_FONTS = [
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
];

// Common font sizes like in Word
export const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

export interface DocumentState {
  template: Template | null;
  bodyContent: string;
  signatureImage: string;
  signatureName: string;
  signatureRole: string;
}

export const createDefaultTemplate = (): Template => ({
  id: crypto.randomUUID(),
  name: "New Template",
  coordinates: {
    name: { label: "Name:", color: "#1e66d0", value: "" },
    role: { label: "Role:", color: "#000000", value: "" },
    phone: { label: "Phone:", color: "#000000", value: "" },
    email: { label: "Email:", color: "#000000", value: "" },
  },
  object: {
    label: "Object:",
    color: "#1e66d0",
    title: "Sponsoring Request",
  },
  positions: {
    coordinates: { x: 20, y: 50 },
    body: { x: 20, y: 70 },
    signature: { x: 130, y: 240, size: 45 },
  },
  fontFamily: "Arial, sans-serif",
  fontSize: 12,
  createdAt: Date.now(),
});
