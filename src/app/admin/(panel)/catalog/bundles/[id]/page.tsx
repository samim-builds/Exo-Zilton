import { renderProductEditor } from "../../products/editor/edit-route";

export const metadata = {
  title: "Edit bundle | Admin",
  robots: { index: false, follow: false },
};

export default function EditBundlePage({ params }: { params: Promise<{ id: string }> }) {
  return renderProductEditor(params, true);
}
