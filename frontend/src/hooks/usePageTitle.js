import { useEffect } from "react";

const SITE = "CyberShield Hub";

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : SITE;
  }, [title]);
}
