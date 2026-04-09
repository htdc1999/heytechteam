import { prisma } from "@/lib/prisma";
import MediaFilesSection from "@/components/clients/MediaFilesSection";

export default async function MediaFilesPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const mediaFiles = await prisma.mediaFile.findMany({
    where: { clientId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <MediaFilesSection clientId={params.id} initialFiles={mediaFiles} />
    </div>
  );
}
