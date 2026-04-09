import { prisma } from "@/lib/prisma";
import GbpLinkSection from "@/components/clients/GbpLinkSection";

export default async function GbpPostsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const client = await prisma.client.findUnique({ where: { id: params.id } });

  const docs = await prisma.gbpDocument.findMany({
    where: { 
      clientId: params.id,
      type: "POSTS"
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <GbpLinkSection 
        clientId={params.id} 
        type="POSTS" 
        initialDocs={docs} 
        focusKeyword={client?.gbpFocusKeyword} 
        gbpPostsScheduledUntil={client?.gbpPostsScheduledUntil}
      />
    </div>
  );
}
