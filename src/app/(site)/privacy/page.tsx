import { CmsPage, cmsMetadata } from "@/components/cms/CmsPage";

export const generateMetadata = () => cmsMetadata("privacy", "/privacy");

export default function PrivacyPage() {
  return <CmsPage slug="privacy" />;
}
