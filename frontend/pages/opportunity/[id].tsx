import { useEffect } from "react";
import { useRouter } from "next/router";

export default function OpportunityRedirect() {
  const router = useRouter();
  useEffect(() => {
    const { id, scan } = router.query;
    if (id) router.replace(`/app/opportunity/${id}${scan ? `?scan=${scan}` : ""}`);
  }, [router]);
  return null;
}
