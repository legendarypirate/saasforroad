import { redirect } from 'next/navigation';

interface PageProps {
  params: { projectId: string };
}

export default function Page({ params }: PageProps) {
  redirect(`/admin/project/${params.projectId}`);
}
