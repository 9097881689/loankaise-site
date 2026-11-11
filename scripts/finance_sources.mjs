// Top 10+ Verified Finance News Sources for LoanKaise.in
export const FINANCE_SOURCES = [
  {
    id: 'moneycontrol-top',
    name: 'Moneycontrol Top News',
    site: 'moneycontrol.com',
    url: 'https://www.moneycontrol.com/rss/MCtopnews.xml',
    categoryDefault: 'business',
    enabled: true,
  },
  {
    id: 'moneycontrol-latest',
    name: 'Moneycontrol Latest',
    site: 'moneycontrol.com',
    url: 'https://www.moneycontrol.com/rss/latestnews.xml',
    categoryDefault: 'markets',
    enabled: true,
  },
  {
    id: 'etmoney-learn',
    name: 'ETMoney Personal Finance',
    site: 'etmoney.com',
    url: 'https://www.etmoney.com/learn/feed/',
    categoryDefault: 'personal-finance',
    enabled: true,
  },
  {
    id: 'yahoo-finance',
    name: 'Yahoo Finance',
    site: 'finance.yahoo.com',
    url: 'https://news.google.com/rss/search?q=site:finance.yahoo.com&hl=en-IN&gl=IN&ceid=IN:en',
    categoryDefault: 'markets',
    enabled: true,
  },
  {
    id: 'et-wealth',
    name: 'Economic Times Wealth',
    site: 'economictimes.indiatimes.com',
    url: 'https://economictimes.indiatimes.com/wealth/rssfeeds/837555174.cms',
    categoryDefault: 'personal-finance',
    enabled: true,
  },
  {
    id: 'et-markets',
    name: 'Economic Times Markets',
    site: 'economictimes.indiatimes.com',
    url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
    categoryDefault: 'markets',
    enabled: true,
  },
  {
    id: 'livemint-money',
    name: 'Livemint Money',
    site: 'livemint.com',
    url: 'https://www.livemint.com/rss/money',
    categoryDefault: 'personal-finance',
    enabled: true,
  },
  {
    id: 'livemint-markets',
    name: 'Livemint Markets',
    site: 'livemint.com',
    url: 'https://www.livemint.com/rss/markets',
    categoryDefault: 'markets',
    enabled: true,
  },
  {
    id: 'business-standard',
    name: 'Business Standard Finance',
    site: 'business-standard.com',
    url: 'https://www.business-standard.com/rss/finance-103.rss',
    categoryDefault: 'banking-rbi',
    enabled: true,
  },
  {
    id: 'cnbctv18-pf',
    name: 'CNBC-TV18 Personal Finance',
    site: 'cnbctv18.com',
    url: 'https://www.cnbctv18.com/commonfeeds/v1/cne/rss/personal-finance.xml',
    categoryDefault: 'loans-emi',
    enabled: true,
  },
  {
    id: 'ndtv-profit',
    name: 'NDTV Profit',
    site: 'ndtvprofit.com',
    url: 'https://feeds.feedburner.com/ndtvprofit-latest',
    categoryDefault: 'business',
    enabled: true,
  },
  {
    id: 'financial-express',
    name: 'Financial Express Finance',
    site: 'financialexpress.com',
    url: 'https://news.google.com/rss/search?q=site:financialexpress.com+finance+OR+loan+OR+bank&hl=en-IN&gl=IN&ceid=IN:en',
    categoryDefault: 'banking-rbi',
    enabled: true,
  },
  {
    id: 'finshots',
    name: 'Finshots Deep Dive',
    site: 'finshots.in',
    url: 'https://finshots.in/rss/',
    categoryDefault: 'business',
    enabled: true,
  },
  {
    id: 'rbi-press',
    name: 'Reserve Bank of India (RBI)',
    site: 'rbi.org.in',
    url: 'https://www.rbi.org.in/pressreleases_rss.xml',
    categoryDefault: 'banking-rbi',
    enabled: true,
  },
  {
    id: 'goodreturns',
    name: 'Goodreturns Finance & Gold',
    site: 'goodreturns.in',
    url: 'https://www.goodreturns.in/rss/feeds/goodreturns-fb.xml',
    categoryDefault: 'personal-finance',
    enabled: true,
  },
];

export const FINANCE_CATEGORIES = [
  { slug: 'banking-rbi', label: 'बैंकिंग & RBI' },
  { slug: 'loans-emi', label: 'लोन & EMI' },
  { slug: 'markets', label: 'शेयर बाज़ार & गोल्ड' },
  { slug: 'personal-finance', label: 'पर्सनल फाइनेंस' },
  { slug: 'mutual-funds', label: 'म्यूचुअल फंड & SIP' },
  { slug: 'tax-saving', label: 'टैक्स & बचत' },
  { slug: 'business', label: 'बिज़नेस & इकोनॉमी' },
];

export const HINDI_AUTHORS = [
  {
    name: 'राहुल शर्मा',
    role: 'सीनियर बैंकिंग & लोन एडिटर',
    slug: 'rahul-sharma',
    categories: ['banking-rbi', 'loans-emi'],
  },
  {
    name: 'प्रिया वर्मा',
    role: 'पर्सनल फाइनेंस & टैक्स विशेषज्ञ',
    slug: 'priya-verma',
    categories: ['personal-finance', 'tax-saving'],
  },
  {
    name: 'अमित मिश्रा',
    role: 'मार्केट्स & म्यूचुअल फंड एनालिस्ट',
    slug: 'amit-mishra',
    categories: ['markets', 'mutual-funds'],
  },
  {
    name: 'नेहा गुप्ता',
    role: 'बिज़नेस & इकोनॉमी ब्यूरो प्रमुख',
    slug: 'neha-gupta',
    categories: ['business'],
  },
];

export function getAuthorForFinanceCategory(cat) {
  return HINDI_AUTHORS.find((a) => a.categories.includes(cat)) || HINDI_AUTHORS[0];
}
