import type { Metadata } from "next";
import PowProfile from "../../components/pow-profile";
import { featuredProfile as data } from "../../../data/featured-profile";

export const metadata: Metadata = {
  title: "Ayush Goel",
  description: "Founder and growth operator building products, communities, and growth engines for early-stage tech startups.",
};

const structuredData = { "@context": "https://schema.org", "@type": "Person", name: "Ayush Goel", jobTitle: "Founder, GetAJob | Growth & GTM", description: "I build products, communities, and growth engines for early-stage tech startups.", address: { "@type": "PostalAddress", addressLocality: "Delhi NCR, India" }, sameAs: ["https://www.linkedin.com/in/ayushhgoel7/", "https://x.com/ayushhgoel7", "https://t.me/ayushhgoel7"] };


export default function AyushProfile() {
  return <div itemScope itemType="https://schema.org/Person">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <PowProfile data={data} action={<a href="/jobs">Jobs</a>} />
  </div>;
}
