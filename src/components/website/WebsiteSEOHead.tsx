import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { SchoolWebsiteConfig } from "@/hooks/useSchoolWebsite";
import { generateCompleteSEO, generateSchoolSchema, generateLocalBusinessSchema, SchoolSEOData } from "@/lib/seo-generator";

interface WebsiteSEOHeadProps {
  config: SchoolWebsiteConfig;
  pageTitle?: string;
  pageDescription?: string;
  canonicalUrl?: string;
}

export function WebsiteSEOHead({ 
  config, 
  pageTitle, 
  pageDescription,
  canonicalUrl 
}: WebsiteSEOHeadProps) {
  const siteUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/escola/${config.slug}` 
    : "";
  
  // Build SEO data from config
  const seoData: SchoolSEOData = {
    schoolName: config.hero_title || "Escola",
    description: config.seo_description || config.hero_subtitle || undefined,
    siteUrl: canonicalUrl || siteUrl,
    logoUrl: config.og_image_url || undefined,
  };
  
  // Generate automatic SEO if not manually configured
  const autoSEO = generateCompleteSEO(seoData);
  
  // Use manual SEO if set, otherwise use auto-generated
  const title = pageTitle || config.seo_title || autoSEO.title;
  const description = pageDescription || config.seo_description || autoSEO.description;
  const keywords = config.seo_keywords || autoSEO.keywords.join(", ");
  const ogImage = config.og_image_url || autoSEO.openGraph.image;
  
  // Schema.org structured data
  const schoolSchema = generateSchoolSchema(seoData);
  const localBusinessSchema = generateLocalBusinessSchema(seoData);
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl || siteUrl} />
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl || siteUrl} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:site_name" content={config.hero_title || "Escola"} />
      <meta property="og:locale" content="pt_BR" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      
      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(schoolSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(localBusinessSchema)}
      </script>
      
      {/* Tracking Scripts */}
      {config.google_tag_manager_id && (
        <script>
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${config.google_tag_manager_id}');`}
        </script>
      )}
      
      {config.google_analytics_id && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${config.google_analytics_id}`} />
          <script>
            {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${config.google_analytics_id}');`}
          </script>
        </>
      )}
      
      {config.facebook_pixel_id && (
        <script>
          {`!function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${config.facebook_pixel_id}');
          fbq('track', 'PageView');`}
        </script>
      )}
      
      {/* Font */}
      {config.font_family && config.font_family !== "Inter" && (
        <link 
          href={`https://fonts.googleapis.com/css2?family=${config.font_family.replace(/\s+/g, '+')}&display=swap`} 
          rel="stylesheet" 
        />
      )}
    </Helmet>
  );
}
