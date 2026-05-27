import TaskKanban from "@/components/TaskKanban"; // Adjust path as needed

interface PageProps {
  params: { projectId: string };
}

export default function Page({ params }: PageProps) {
  return <TaskKanban projectId={params.projectId} />;
}
