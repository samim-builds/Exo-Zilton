import { renderProductEditor } from "../editor/edit-route";

export const metadata = {
  title: "Edit product | Admin",
  robots: { index: false, follow: false },
};

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  return renderProductEditor(params, false);
}
