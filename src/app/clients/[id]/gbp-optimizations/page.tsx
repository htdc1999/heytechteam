import { prisma } from "@/lib/prisma";
import GbpLinkSection from "@/components/clients/GbpLinkSection";

export default async function GbpOptimizationsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const docs = await prisma.gbpDocument.findMany({
    where: { 
      clientId: params.id,
      type: "OPTIMIZATIONS"
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <GbpLinkSection clientId={params.id} type="OPTIMIZATIONS" initialDocs={docs} />
    </div>
  );
}
