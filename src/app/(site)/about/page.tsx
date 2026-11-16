import { CmsPage, cmsMetadata } from "@/components/cms/CmsPage";

export const generateMetadata = () => cmsMetadata("about", "/about");

export default function AboutPage() {
  return <CmsPage slug="about" />;
}
