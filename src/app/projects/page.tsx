import { SectionPage, sectionMetadata } from "@/lib/sectionPage";

export const metadata = sectionMetadata("projects");

export default function Page() {
  return <SectionPage section="projects" />;
}
