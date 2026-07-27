"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AssistIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/assist/catalog");
  }, [router]);
  return null;
}
