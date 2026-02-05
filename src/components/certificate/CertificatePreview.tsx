import { useMemo } from "react";
import { CertificateTemplate, CertificateEntry } from "@/types/certificate";

interface CertificatePreviewProps {
  template: CertificateTemplate | null;
  entry?: CertificateEntry;
  previewName?: string;
  previewSubtitle?: string;
  previewSubsubtitle?: string;
  scale?: number;
}

export function CertificatePreview({
  template,
  entry,
  previewName = "Sample Name",
  previewSubtitle = "Sample Subtitle",
  previewSubsubtitle = "Sample Sub-subtitle",
  scale = 1,
}: CertificatePreviewProps) {
  const dimensions = useMemo(() => {
    if (!template) return { width: 297, height: 210 }; // Default landscape
    return template.orientation === "landscape"
      ? { width: 297, height: 210 }
      : { width: 210, height: 297 };
  }, [template?.orientation]);

  if (!template) {
    return (
      <div
        className="bg-white rounded-xl flex items-center justify-center text-muted-foreground border border-border"
        style={{
          width: `${dimensions.width * scale}mm`,
          height: `${dimensions.height * scale}mm`,
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

  const name = entry?.name || previewName;
  const subtitle = entry?.subtitle || previewSubtitle;
  const subsubtitle = entry?.subsubtitle || previewSubsubtitle;

  // Merge entry-specific overrides with template defaults
  const getEffectiveConfig = (
    templateConfig: typeof template.nameConfig,
    entryOverrides?: Partial<typeof template.nameConfig>
  ) => {
    return { ...templateConfig, ...entryOverrides };
  };

  const effectiveNameConfig = getEffectiveConfig(template.nameConfig, entry?.nameConfig);
  const effectiveSubtitleConfig = getEffectiveConfig(template.subtitleConfig, entry?.subtitleConfig);
  const effectiveSubsubtitleConfig = getEffectiveConfig(template.subsubtitleConfig, entry?.subsubtitleConfig);

  const getTextPosition = (config: typeof template.nameConfig) => {
    let textAlign: "left" | "center" | "right" = config.alignment;
    // Always use the user's X position
    let left = config.x;
    // Transform based on alignment to position text correctly around the X point
    let transform = "none";
    if (config.alignment === "center") {
      transform = "translateX(-50%)";
    } else if (config.alignment === "right") {
      transform = "translateX(-100%)";
    }

    return {
      left: `${left}mm`,
      top: `${config.y}mm`,
      textAlign,
      transform,
    };
  };

  return (
    <div
      className="relative bg-white shadow-document origin-center"
      style={{
        width: `${dimensions.width}mm`,
        height: `${dimensions.height}mm`,
        transform: `scale(${scale})`,
      }}
    >
      {/* Background Image - object-contain to fit, not fill */}
      {template.background && (
        <img
          src={template.background}
          alt="Certificate background"
          className="absolute inset-0 w-full h-full object-contain"
        />
      )}

      {/* Name */}
      <div
        className="absolute whitespace-nowrap"
        style={{
          ...getTextPosition(effectiveNameConfig),
          fontSize: `${effectiveNameConfig.fontSize}px`,
          color: effectiveNameConfig.color,
          fontFamily: effectiveNameConfig.fontFamily,
          lineHeight: 1,
        }}
      >
        {effectiveNameConfig.prefix && (
          <span style={{ color: effectiveNameConfig.prefixColor || effectiveNameConfig.color }}>
            {effectiveNameConfig.prefix}
          </span>
        )}
        {name}
      </div>

      {/* Subtitle */}
      {template.subtitleEnabled && (
        <div
          className="absolute whitespace-nowrap"
          style={{
            ...getTextPosition(effectiveSubtitleConfig),
            fontSize: `${effectiveSubtitleConfig.fontSize}px`,
            color: effectiveSubtitleConfig.color,
            fontFamily: effectiveSubtitleConfig.fontFamily,
            lineHeight: 1,
          }}
        >
          {effectiveSubtitleConfig.prefix && (
            <span style={{ color: effectiveSubtitleConfig.prefixColor || effectiveSubtitleConfig.color }}>
              {effectiveSubtitleConfig.prefix}
            </span>
          )}
          {subtitle}
        </div>
      )}

      {/* Subsubtitle */}
      {template.subtitleEnabled && template.subsubtitleEnabled && (
        <div
          className="absolute whitespace-nowrap"
          style={{
            ...getTextPosition(effectiveSubsubtitleConfig),
            fontSize: `${effectiveSubsubtitleConfig.fontSize}px`,
            color: effectiveSubsubtitleConfig.color,
            fontFamily: effectiveSubsubtitleConfig.fontFamily,
            lineHeight: 1,
          }}
        >
          {effectiveSubsubtitleConfig.prefix && (
            <span style={{ color: effectiveSubsubtitleConfig.prefixColor || effectiveSubsubtitleConfig.color }}>
              {effectiveSubsubtitleConfig.prefix}
            </span>
          )}
          {subsubtitle}
        </div>
      )}

      {/* Signatures */}
      {template.signers?.map((signer, index) => (
        signer.image && (
          <div
            key={index}
            className="absolute"
            style={{
              left: `${signer.position.x}mm`,
              top: `${signer.position.y}mm`,
              transform: "translateX(-50%)",
            }}
          >
            <img
              src={signer.image}
              alt={`Signature ${index + 1}`}
              style={{
                height: `${signer.position.size}px`,
                width: "auto",
              }}
            />
            {(signer.name || signer.role) && (
              <div className="text-center mt-1">
                {signer.name && (
                  <p className="text-xs font-medium" style={{ fontSize: "10px" }}>
                    {signer.name}
                  </p>
                )}
                {signer.role && (
                  <p className="text-xs text-muted-foreground" style={{ fontSize: "8px" }}>
                    {signer.role}
                  </p>
                )}
              </div>
            )}
          </div>
        )
      ))}
    </div>
  );
}
