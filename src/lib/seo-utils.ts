import type { Metadata } from 'next';
import type {
  BreadcrumbList,
  TechArticle,
  WebSite,
  WithContext,
} from 'schema-dts';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rpbey.fr';

/**
 * Generate consistent OG + Twitter metadata for a page.
 */
export function createPageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
}): Metadata {
  const { title, description, path, type = 'website' } = opts;
  const image = opts.image || '/banner.png';
  const url = `${baseUrl}${path}`;

  return {
    title,
    description,
    openGraph: {
      type,
      locale: 'fr_FR',
      url,
      siteName: 'RPB - République Populaire du Beyblade',
      title,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export function generateTechArticleJsonLd(article: {
  title: string;
  description: string;
  publishedAt: string;
  modifiedAt: string;
  authorName: string;
  url: string;
  image?: string;
  keywords?: string[];
  proficiencyLevel?: 'Beginner' | 'Intermediate' | 'Expert';
}): WithContext<TechArticle> {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: article.title,
    description: article.description,
    image: article.image ? [`${baseUrl}${article.image}`] : undefined,
    datePublished: article.publishedAt,
    dateModified: article.modifiedAt,
    author: {
      '@type': 'Person',
      name: article.authorName,
      url: `${baseUrl}/notre-equipe`, // Or specific author profile
    },
    publisher: {
      '@type': 'Organization',
      name: 'République Populaire du Beyblade',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}${article.url}`,
    },
    proficiencyLevel: article.proficiencyLevel || 'Beginner',
    keywords: article.keywords?.join(', '),
  };
}

export function generateBreadcrumbJsonLd(
  items: { name: string; item: string }[],
): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.item}`,
    })),
  };
}

export function generateWebsiteJsonLd(): WithContext<WebSite> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'RPB - République Populaire du Beyblade',
    url: baseUrl,
    author: {
      '@type': 'Person',
      name: 'Yoyo',
      url: 'https://twitter.com/yoyo__goat',
    },
    creator: {
      '@type': 'Person',
      name: 'Yoyo',
      url: 'https://twitter.com/yoyo__goat',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      // @ts-expect-error - query-input is required by Google but not in schema-dts
      'query-input': 'required name=search_term_string',
    },
  };
}
