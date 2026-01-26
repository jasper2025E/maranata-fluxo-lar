// SEO Generator - Auto-generates SEO metadata for school websites

export interface SchoolSEOData {
  schoolName: string;
  city?: string;
  state?: string;
  neighborhood?: string;
  description?: string;
  courses?: string[];
  phone?: string;
  email?: string;
  address?: string;
  logoUrl?: string;
  siteUrl: string;
}

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  openGraph: {
    title: string;
    description: string;
    image: string;
    url: string;
    type: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image: string;
  };
  schema: object;
}

/**
 * Generates optimized SEO title (max 60 chars)
 */
export function generateSEOTitle(data: SchoolSEOData): string {
  const { schoolName, city } = data;
  const base = schoolName;
  
  if (city && base.length + city.length + 3 <= 60) {
    return `${base} - ${city}`;
  }
  
  return base.slice(0, 60);
}

/**
 * Generates optimized SEO description (max 160 chars)
 */
export function generateSEODescription(data: SchoolSEOData): string {
  const { schoolName, city, courses = [], description } = data;
  
  if (description && description.length <= 160) {
    return description;
  }
  
  let desc = `${schoolName}`;
  
  if (city) {
    desc += ` em ${city}`;
  }
  
  if (courses.length > 0) {
    const courseList = courses.slice(0, 3).join(", ");
    desc += `. ${courseList}`;
  }
  
  desc += ". Matrículas abertas!";
  
  return desc.slice(0, 160);
}

/**
 * Generates SEO keywords array
 */
export function generateSEOKeywords(data: SchoolSEOData): string[] {
  const { schoolName, city, state, neighborhood, courses = [] } = data;
  const keywords: string[] = [];
  
  keywords.push(schoolName);
  keywords.push("escola");
  keywords.push("educação");
  keywords.push("matrícula");
  
  if (city) {
    keywords.push(`escola ${city}`);
    keywords.push(`colégio ${city}`);
  }
  
  if (state) {
    keywords.push(`escola ${state}`);
  }
  
  if (neighborhood) {
    keywords.push(`escola ${neighborhood}`);
  }
  
  courses.forEach(course => {
    keywords.push(course.toLowerCase());
  });
  
  keywords.push("educação infantil");
  keywords.push("ensino fundamental");
  keywords.push("ensino médio");
  
  return [...new Set(keywords)];
}

/**
 * Generates Schema.org structured data for educational organization
 */
export function generateSchoolSchema(data: SchoolSEOData): object {
  const {
    schoolName,
    description,
    address,
    phone,
    email,
    logoUrl,
    siteUrl,
    city,
    state,
    neighborhood,
  } = data;
  
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "School",
    name: schoolName,
    url: siteUrl,
  };
  
  if (description) {
    schema.description = description;
  }
  
  if (logoUrl) {
    schema.logo = logoUrl;
    schema.image = logoUrl;
  }
  
  if (address || city || state) {
    schema.address = {
      "@type": "PostalAddress",
      addressLocality: city || "",
      addressRegion: state || "",
      addressCountry: "BR",
      streetAddress: address || "",
      neighborhood: neighborhood || "",
    };
  }
  
  if (phone) {
    schema.telephone = phone;
  }
  
  if (email) {
    schema.email = email;
  }
  
  // Add educational organization type
  schema.additionalType = "EducationalOrganization";
  
  return schema;
}

/**
 * Generates local business schema for local SEO
 */
export function generateLocalBusinessSchema(data: SchoolSEOData): object {
  const { schoolName, address, phone, city, state, siteUrl, logoUrl } = data;
  
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: schoolName,
    url: siteUrl,
    telephone: phone || "",
    image: logoUrl || "",
    address: {
      "@type": "PostalAddress",
      streetAddress: address || "",
      addressLocality: city || "",
      addressRegion: state || "",
      addressCountry: "BR",
    },
    geo: {
      "@type": "GeoCoordinates",
      // Would need actual coordinates from geocoding
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "07:00",
      closes: "18:00",
    },
    priceRange: "$$",
  };
}

/**
 * Generates complete SEO metadata object
 */
export function generateCompleteSEO(data: SchoolSEOData): SEOMetadata {
  const title = generateSEOTitle(data);
  const description = generateSEODescription(data);
  const keywords = generateSEOKeywords(data);
  
  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      image: data.logoUrl || "",
      url: data.siteUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      image: data.logoUrl || "",
    },
    schema: generateSchoolSchema(data),
  };
}

/**
 * Generates sitemap entries for a school website
 */
export function generateSitemapEntries(
  baseUrl: string,
  pages: Array<{ slug: string; updatedAt: string }>
): string {
  const entries = pages.map(page => {
    const url = page.slug === "home" ? baseUrl : `${baseUrl}/${page.slug}`;
    return `
  <url>
    <loc>${url}</loc>
    <lastmod>${page.updatedAt.split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.slug === "home" ? "1.0" : "0.8"}</priority>
  </url>`;
  });
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.w3.org/2000/svg">
${entries.join("\n")}
</urlset>`;
}

/**
 * Generates robots.txt content
 */
export function generateRobotsTxt(siteUrl: string): string {
  return `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml`;
}
