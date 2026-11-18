import type { Metadata } from "next";
import { StudentPackageHub } from "@/components/pages/student-package-hub";

export const metadata: Metadata = {
  title: "Tryout",
};

export default function StudentTryoutPage() {
  return <StudentPackageHub type="tryout" />;
}
