"use client";

import AnalystPanel from "./analyst/AnalystPanel";

export default function AnalystSlot({ habitatId }: { habitatId: string }) {
  return <AnalystPanel habitatId={habitatId} />;
}
