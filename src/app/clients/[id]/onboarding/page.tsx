import { prisma } from "@/lib/prisma";
import OnboardingSection from "@/components/clients/OnboardingSection";

export default async function OnboardingPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const tasks = await prisma.onboardingTask.findMany({
    where: { clientId: params.id },
    orderBy: { createdAt: "asc" }, // Keeps the original order they were generated in
  });

  return (
    <div>
      <OnboardingSection clientId={params.id} initialTasks={tasks} />
    </div>
  );
}
