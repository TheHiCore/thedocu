import { useState } from "react";
import { AppSelector } from "@/components/AppSelector";
import { SponsoringEditor } from "@/components/editor/SponsoringEditor";
import { CertificateEditor } from "@/components/certificate/CertificateEditor";

type AppType = "selector" | "document" | "certificate";

const Index = () => {
  const [currentApp, setCurrentApp] = useState<AppType>("selector");

  const handleSelectApp = (app: "document" | "certificate") => {
    setCurrentApp(app);
  };

  const handleBackToSelector = () => {
    setCurrentApp("selector");
  };

  if (currentApp === "selector") {
    return <AppSelector onSelectApp={handleSelectApp} />;
  }

  if (currentApp === "document") {
    return <SponsoringEditor onBack={handleBackToSelector} />;
  }

  if (currentApp === "certificate") {
    return <CertificateEditor onBack={handleBackToSelector} />;
  }

  return null;
};

export default Index;
