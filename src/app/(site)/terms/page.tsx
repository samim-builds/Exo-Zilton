import { CmsPage, cmsMetadata } from "@/components/cms/CmsPage";

export const generateMetadata = () => cmsMetadata("terms", "/terms");

export default function TermsPage() {
  return <CmsPage slug="terms" />;
}
