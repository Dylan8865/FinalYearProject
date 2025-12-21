import { requireAdmin } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function KnowledgeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  // Detail view is now a sidebar overlay, redirect to main list
  redirect("/knowledge");
}
