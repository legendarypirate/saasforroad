import type { HomepageContent, HomepageNewsArticle } from '@/lib/homepage';
import { getDefaultHomepageContent } from '@/lib/homepage';

export type NewsArticle = HomepageNewsArticle;

export const NEWS_ARTICLES: NewsArticle[] = getDefaultHomepageContent().news_articles;

export function getNewsArticles(content?: HomepageContent): NewsArticle[] {
  return content?.news_articles?.length ? content.news_articles : NEWS_ARTICLES;
}

export function getNewsArticle(id: string, content?: HomepageContent): NewsArticle | undefined {
  return getNewsArticles(content).find((a) => a.id === id);
}

export function formatNewsDate(date: string): string {
  const [y, m, d] = date.split('-');
  return `${y} оны ${m} сарын ${d}`;
}
