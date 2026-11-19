import { SectionPage, sectionMetadata } from "@/lib/sectionPage";

export const metadata = sectionMetadata("about");

export default function Page() {
  return <SectionPage section="about" />;
}
