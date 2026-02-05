import { useMemo } from "react";
import { marked } from "marked";
import { Template, SignerData } from "@/types/template";

interface DocumentPreviewProps {
  template: Template | null;
  bodyContent: string;
  signers: SignerData[];
  scale?: number;
}

// A4 dimensions in mm
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 20;
const CONTENT_WIDTH = 170;

// Page break marker
const PAGE_BREAK_MARKER = "---pagebreak---";

export function DocumentPreview({
  template,
  bodyContent,
  signers,
  scale = 1,
}: DocumentPreviewProps) {
  // Configure marked for proper rendering
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  // Split content by page breaks and parse each section
  const pages = useMemo(() => {
    if (!bodyContent) return [""];
    const sections = bodyContent.split(PAGE_BREAK_MARKER);
    return sections.map(section => {
      const withBreaks = section.trim().replace(/\n\n/g, '\n\n&nbsp;\n\n');
      return marked.parse(withBreaks) as string;
    });
  }, [bodyContent]);

  if (!template) {
    return (
      <div 
        className="bg-white rounded-xl flex items-center justify-center text-muted-foreground border border-border"
        style={{ 
          width: `${PAGE_WIDTH * scale}mm`, 
          height: `${PAGE_HEIGHT * scale}mm`,
          boxShadow: "var(--document-shadow)"
        }}
      >
        <div className="text-center p-8">
          <p className="text-lg font-medium mb-2">No template selected</p>
          <p className="text-sm">Select a template or create a new one to start</p>
        </div>
      </div>
    );
  }

  const { coordinates, object, positions } = template;
  const fontFamily = template.fontFamily || "Arial, sans-serif";
  const fontSize = template.fontSize || 12;
  const isMultiPage = pages.length > 1;
  const hasSignatures = signers.some(s => s.image || s.name || s.role);

  // Common styles for markdown content
  const markdownStyles = `
    .markdown-content { word-wrap: break-word; overflow-wrap: break-word; }
    .markdown-content h1 { font-size: ${fontSize * 2}px; font-weight: bold; margin: 0.5em 0; }
    .markdown-content h2 { font-size: ${fontSize * 1.5}px; font-weight: bold; margin: 0.5em 0; }
    .markdown-content h3 { font-size: ${fontSize * 1.25}px; font-weight: bold; margin: 0.4em 0; }
    .markdown-content p { margin: 0.5em 0; white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word; }
    .markdown-content ul { list-style-type: disc; padding-left: 1.5em; margin: 0.5em 0; }
    .markdown-content ol { list-style-type: decimal; padding-left: 1.5em; margin: 0.5em 0; }
    .markdown-content li { margin: 0.25em 0; }
    .markdown-content table { width: 100%; border-collapse: collapse; margin: 0.5em 0; }
    .markdown-content th, .markdown-content td { border: 1px solid #333; padding: 0.5em; text-align: center; }
    .markdown-content th { background-color: #f5f5f5; font-weight: bold; }
    .markdown-content strong { font-weight: bold; }
    .markdown-content em { font-style: italic; }
    .markdown-content br { display: block; content: ""; margin-top: 0.5em; }
  `;

  const renderSignatures = () => {
    if (!hasSignatures) return null;
    return signers.map((signer, index) => {
      if (!signer.image && !signer.name && !signer.role) return null;
      return (
        <div
          key={index}
          className="absolute text-center font-bold"
          style={{
            left: `${signer.position.x}mm`,
            top: `${signer.position.y}mm`,
            fontFamily,
            fontSize: `${fontSize}px`,
          }}
        >
          {signer.name && <div>{signer.name}</div>}
          {signer.role && <div>{signer.role}</div>}
          {signer.image && (
            <img
              src={signer.image}
              alt={`Signature ${index + 1}`}
              className="mx-auto mt-2"
              style={{ maxWidth: `${signer.position.size}mm` }}
            />
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col items-center" style={{ gap: `${16 * scale}px` }}>
      <style dangerouslySetInnerHTML={{ __html: markdownStyles }} />

      {pages.map((pageContent, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === pages.length - 1;

        return (
          <div
            key={pageIndex}
            className="relative bg-white shadow-document origin-top"
            style={{
              width: `${PAGE_WIDTH}mm`,
              height: `${PAGE_HEIGHT}mm`,
              transform: `scale(${scale})`,
              fontFamily,
              marginTop: pageIndex > 0 ? `${-PAGE_HEIGHT * (1 - scale)}mm` : undefined,
            }}
          >
            {/* Background Image */}
            {template.background && (
              <img
                src={template.background}
                alt="Template background"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Coordinates Block - Only on first page */}
            {isFirstPage && (
              <div
                className="absolute"
                style={{
                  left: `${positions.coordinates.x}mm`,
                  top: `${positions.coordinates.y}mm`,
                  fontFamily,
                  fontSize: `${fontSize}px`,
                  lineHeight: 1.35,
                }}
              >
                <div>
                  <span className="font-bold" style={{ color: coordinates.name.color }}>
                    {coordinates.name.label}
                  </span>{" "}
                  {coordinates.name.value}
                </div>
                <div>
                  <span className="font-bold" style={{ color: coordinates.role.color }}>
                    {coordinates.role.label}
                  </span>{" "}
                  {coordinates.role.value}
                </div>
                <div>
                  <span className="font-bold" style={{ color: coordinates.phone.color }}>
                    {coordinates.phone.label}
                  </span>{" "}
                  {coordinates.phone.value}
                </div>
                <div>
                  <span className="font-bold" style={{ color: coordinates.email.color }}>
                    {coordinates.email.label}
                  </span>{" "}
                  {coordinates.email.value}
                </div>
              </div>
            )}

            {/* Object & Body Block */}
            <div
              className="absolute"
              style={{
                left: `${positions.body.x}mm`,
                top: isFirstPage ? `${positions.body.y}mm` : `${MARGIN_TOP}mm`,
                width: `${CONTENT_WIDTH}mm`,
                fontFamily,
              }}
            >
              {/* Object line only on first page */}
              {isFirstPage && (
                <div style={{ fontSize: `${fontSize + 4}px`, marginBottom: "4mm" }}>
                  <span className="font-bold" style={{ color: object.color }}>
                    {object.label}
                  </span>{" "}
                  {object.title}
                </div>
              )}
              <div
                className="markdown-content"
                style={{ fontFamily, fontSize: `${fontSize}px`, lineHeight: 1.35 }}
                dangerouslySetInnerHTML={{ __html: pageContent }}
              />
            </div>

            {/* Signature Blocks - Only on last page */}
            {isLastPage && renderSignatures()}
          </div>
        );
      })}
    </div>
  );
}
