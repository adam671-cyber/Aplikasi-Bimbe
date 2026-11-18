import type { Metadata } from "next";
import { StudentPackageHub } from "@/components/pages/student-package-hub";

export const metadata: Metadata = {
  title: "Latihan",
};

export default function StudentExercisePage() {
  return <StudentPackageHub type="latihan" />;
}
