/**
 * News Service
 * Fetches Indian stock market news and analyzes sentiment using FinBERT-India-v1
 */

// Hugging Face API endpoints
// Try router API first, fallback to alternative endpoints if needed
const HUGGINGFACE_ROUTER_URL = 'https://router.huggingface.co/models/Vansh180/FinBERT-India-v1';
const HUGGINGFACE_INFERENCE_URL = 'https://api-inference.huggingface.co/models/Vansh180/FinBERT-India-v1';
const HUGGINGFACE_API_KEY = ''; // Optional: Add if you have a token for higher rate limits

// Use router URL by default, but will fallback if auth is required
const HUGGINGFACE_API_URL = HUGGINGFACE_ROUTER_URL;

export interface NewsArticle {
  id: string;
  headline: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number;
}

interface SentimentResult {
  label: string;
  score: number;
}

/**
 * Analyze sentiment of a news headline using FinBERT-India-v1
 */
export async function analyzeSentiment(headline: string): Promise<{
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
}> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add API key if available for higher rate limits
    if (HUGGINGFACE_API_KEY) {
      headers['Authorization'] = `Bearer ${HUGGINGFACE_API_KEY}`;
    }

    console.log('[News Service] Analyzing sentiment for:', headline.substring(0, 50) + '...');
    console.log('[News Service] API URL:', HUGGINGFACE_API_URL);

    // Use the new Hugging Face router API
    const response = await fetch(HUGGINGFACE_API_URL, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: headline }),
    });

    console.log('[News Service] Response status:', response.status, response.statusText);

    // Handle model loading (503) - retry after a delay
    if (response.status === 503) {
      const retryAfter = response.headers.get('retry-after');
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
      console.log(`[News Service] Model loading, waiting ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      
      // Retry once
      const retryResponse = await fetch(HUGGINGFACE_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ inputs: headline }),
      });
      
      if (!retryResponse.ok) {
        console.warn('[News Service] Model still loading after retry, using fallback');
        return { sentiment: 'neutral', score: 0.5 };
      }
      
      return parseSentimentResponse(await retryResponse.json(), headline);
    }

    if (!response.ok) {
      // Handle authentication error (401)
      if (response.status === 401) {
        console.warn('[News Service] Authentication required for Hugging Face API. Using keyword-based sentiment analysis.');
        return analyzeSentimentWithKeywords(headline);
      }
      
      // If rate limited
      if (response.status === 429) {
        console.warn('[News Service] Rate limited, using keyword-based sentiment analysis');
        return analyzeSentimentWithKeywords(headline);
      }
      
      const errorText = await response.text();
      console.error(`[News Service] Hugging Face API error ${response.status}:`, errorText);
      
      // Fall back to keyword analysis on any error
      console.warn('[News Service] Falling back to keyword-based sentiment analysis');
      return analyzeSentimentWithKeywords(headline);
    }

    const data = await response.json();
    return parseSentimentResponse(data, headline);
  } catch (error) {
    console.error('[News Service] Error analyzing sentiment:', error);
    // Fall back to keyword-based analysis
    console.warn('[News Service] Using keyword-based sentiment analysis as fallback');
    return analyzeSentimentWithKeywords(headline);
  }
}

/**
 * Fallback sentiment analysis using keywords
 * Used when Hugging Face API is unavailable or requires authentication
 */
function analyzeSentimentWithKeywords(headline: string): {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
} {
  const lowerHeadline = headline.toLowerCase();

  // Positive keywords
  const positiveKeywords = [
    'surge', 'surges', 'rally', 'gain', 'gains', 'rises', 'rise', 'jump', 'jumps',
    'soar', 'soars', 'record', 'high', 'profit', 'profits', 'earnings', 'growth',
    'up', 'increase', 'increases', 'boost', 'boosts', 'positive', 'strong',
    'beat', 'beats', 'exceed', 'exceeds', 'outperform', 'outperforms',
    'buy', 'buys', 'upgrade', 'upgrades', 'bullish', 'optimistic',
    'all-time high', 'record high', 'strong performance', 'wins'
  ];

  // Negative keywords
  const negativeKeywords = [
    'fall', 'falls', 'decline', 'declines', 'drop', 'drops', 'plunge', 'plunges',
    'crash', 'crashes', 'loss', 'losses', 'deficit', 'debt', 'default',
    'down', 'decrease', 'decreases', 'cut', 'cuts', 'negative', 'weak',
    'miss', 'misses', 'below', 'disappoint', 'disappoints', 'bearish',
    'pessimistic', 'concern', 'concerns', 'worry', 'worries', 'risk', 'risks',
    'uncertainty', 'volatility', 'crisis', 'recession', 'recessionary',
    'downward', 'downturn', 'sell', 'sells', 'downgrade', 'downgrades'
  ];

  // Count positive and negative matches
  let positiveCount = 0;
  let negativeCount = 0;

  positiveKeywords.forEach(keyword => {
    if (lowerHeadline.includes(keyword)) {
      positiveCount++;
    }
  });

  negativeKeywords.forEach(keyword => {
    if (lowerHeadline.includes(keyword)) {
      negativeCount++;
    }
  });

  // Determine sentiment based on keyword counts
  let sentiment: 'positive' | 'neutral' | 'negative';
  let score: number;

  if (positiveCount > negativeCount && positiveCount > 0) {
    sentiment = 'positive';
    score = Math.min(0.7 + (positiveCount * 0.1), 0.95);
  } else if (negativeCount > positiveCount && negativeCount > 0) {
    sentiment = 'negative';
    score = Math.min(0.7 + (negativeCount * 0.1), 0.95);
  } else {
    sentiment = 'neutral';
    score = 0.6;
  }

  console.log(`[News Service] Keyword-based sentiment: ${sentiment} (positive: ${positiveCount}, negative: ${negativeCount}, score: ${score.toFixed(2)})`);

  return { sentiment, score };
}

/**
 * Parse Hugging Face API response to extract sentiment
 */
function parseSentimentResponse(data: any, headline: string): {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
} {
  console.log('[News Service] Raw API response:', JSON.stringify(data, null, 2));

  // Handle different response formats from Hugging Face
  let results: SentimentResult[] = [];

  // Text classification models typically return: [[{label: "...", score: ...}, ...]]
  if (Array.isArray(data)) {
    // Nested array: [[{label, score}, ...]]
    if (Array.isArray(data[0])) {
      results = data[0];
    } 
    // Direct array: [{label, score}, ...]
    else if (data.length > 0 && typeof data[0] === 'object' && ('label' in data[0] || 'LABEL_0' in data[0])) {
      results = data;
    }
  } 
  // Single object: {label: "...", score: ...}
  else if (data && typeof data === 'object') {
    if ('label' in data || 'LABEL_0' in data) {
      results = [data];
    } else if (Array.isArray(data)) {
      results = data;
    }
  }

  if (!results || results.length === 0) {
    console.warn('[News Service] No results found in response. Full response:', JSON.stringify(data, null, 2));
    return { sentiment: 'neutral', score: 0.5 };
  }

  console.log('[News Service] Parsed results:', JSON.stringify(results, null, 2));

  // Find the highest confidence prediction
  const topResult = results.reduce((prev, current) => {
    const prevScore = typeof prev === 'object' && prev !== null ? (prev.score || 0) : 0;
    const currentScore = typeof current === 'object' && current !== null ? (current.score || 0) : 0;
    return currentScore > prevScore ? current : prev;
  });

  if (!topResult || (typeof topResult !== 'object')) {
    console.warn('[News Service] Invalid result format:', topResult);
    return { sentiment: 'neutral', score: 0.5 };
  }

  // Handle different label formats from Hugging Face
  let label = '';
  
  // Try different possible label fields
  if (topResult.label !== undefined) {
    label = String(topResult.label);
  } else if ('LABEL_0' in topResult) {
    label = String(topResult.LABEL_0);
  } else if ('LABEL_1' in topResult) {
    label = String(topResult.LABEL_1);
  } else if ('LABEL_2' in topResult) {
    label = String(topResult.LABEL_2);
  } else {
    // Check all keys for potential label
    const keys = Object.keys(topResult);
    const labelKey = keys.find(key => key.toLowerCase().includes('label'));
    if (labelKey) {
      label = String(topResult[labelKey]);
    }
  }

  label = label.toLowerCase().trim();

  console.log('[News Service] Extracted label:', label, 'Score:', topResult.score, 'All keys:', Object.keys(topResult));

  // Map labels to our sentiment types
  // FinBERT-India might return: positive/POSITIVE, negative/NEGATIVE, neutral/NEUTRAL
  // Or numeric labels: LABEL_0, LABEL_1, LABEL_2
  let sentiment: 'positive' | 'neutral' | 'negative';

  // Check for positive sentiment
  if (
    label === 'positive' || 
    label === 'pos' || 
    label.includes('positive') || 
    label === 'label_0' ||
    label.startsWith('pos')
  ) {
    sentiment = 'positive';
  } 
  // Check for negative sentiment
  else if (
    label === 'negative' || 
    label === 'neg' || 
    label.includes('negative') || 
    label === 'label_2' ||
    label.startsWith('neg')
  ) {
    sentiment = 'negative';
  } 
  // Check for neutral sentiment
  else if (
    label === 'neutral' || 
    label === 'neu' || 
    label.includes('neutral') || 
    label === 'label_1' ||
    label.startsWith('neu')
  ) {
    sentiment = 'neutral';
  } 
  // Fallback: analyze all results to find sentiment
  else {
    console.warn('[News Service] Unexpected label format:', label, '. Full result:', JSON.stringify(topResult));
    console.warn('[News Service] All results:', JSON.stringify(results, null, 2));
    
    // Try to infer from all results - look for the label that matches our keywords
    let foundSentiment: 'positive' | 'neutral' | 'negative' | null = null;
    
    for (const result of results) {
      const resultLabel = String(result?.label || '').toLowerCase();
      
      if (resultLabel.includes('positive') || resultLabel.includes('pos')) {
        foundSentiment = 'positive';
        break;
      } else if (resultLabel.includes('negative') || resultLabel.includes('neg')) {
        foundSentiment = 'negative';
        break;
      } else if (resultLabel.includes('neutral') || resultLabel.includes('neu')) {
        foundSentiment = 'neutral';
      }
    }
    
    sentiment = foundSentiment || 'neutral';
  }

  const score = topResult.score || 0.5;
  console.log(`[News Service] Final sentiment: ${sentiment} (from label: "${label}", score: ${score.toFixed(3)}) for: "${headline.substring(0, 60)}..."`);

  return {
    sentiment,
    score,
  };
}

/**
 * Fetch top 10 Indian stock market news articles
 * For now, returns mock data. Replace with actual news API call.
 */
export async function fetchStockNews(): Promise<NewsArticle[]> {
  // TODO: Replace with actual news API (e.g., NewsAPI, RSS feed, etc.)
  // Example structure for NewsAPI:
  // const response = await fetch(`https://newsapi.org/v2/everything?q=indian+stock+market&apiKey=${NEWS_API_KEY}`);
  
  // Mock news data - replace with real API call
  const mockNews: NewsArticle[] = [
    {
      id: '1',
      headline: 'Sensex surges 500 points as IT and banking stocks rally on strong quarterly results',
      url: 'https://economictimes.indiatimes.com/markets/stocks/news/sensex-surges-500-points',
      source: 'Economic Times',
      publishedAt: new Date().toISOString(),
    },
    {
      id: '2',
      headline: 'Rupee falls sharply against the dollar amid global economic uncertainty',
      url: 'https://www.livemint.com/market/rupee-falls-sharply',
      source: 'Livemint',
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      headline: 'TCS announces leadership reshuffle; markets await further clarity on strategy',
      url: 'https://www.business-standard.com/companies/tcs-announces-leadership-reshuffle',
      source: 'Business Standard',
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: '4',
      headline: 'Reliance Industries reports record quarterly profits, stock price jumps 3%',
      url: 'https://economictimes.indiatimes.com/companies/reliance-industries-record-profits',
      source: 'Economic Times',
      publishedAt: new Date(Date.now() - 10800000).toISOString(),
    },
    {
      id: '5',
      headline: 'RBI keeps repo rate unchanged at 6.5%, maintains accommodative stance',
      url: 'https://www.livemint.com/economy/rbi-keeps-repo-rate-unchanged',
      source: 'Livemint',
      publishedAt: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      id: '6',
      headline: 'HDFC Bank shares decline 2% following announcement of increased provisioning',
      url: 'https://www.business-standard.com/markets/hdfc-bank-shares-decline',
      source: 'Business Standard',
      publishedAt: new Date(Date.now() - 18000000).toISOString(),
    },
    {
      id: '7',
      headline: 'Indian stock markets reach new all-time high as foreign investors continue buying',
      url: 'https://economictimes.indiatimes.com/markets/stocks/indian-markets-all-time-high',
      source: 'Economic Times',
      publishedAt: new Date(Date.now() - 21600000).toISOString(),
    },
    {
      id: '8',
      headline: 'Infosys wins multi-million dollar deal with US client, shares gain 1.5%',
      url: 'https://www.livemint.com/companies/infosys-wins-major-deal',
      source: 'Livemint',
      publishedAt: new Date(Date.now() - 25200000).toISOString(),
    },
    {
      id: '9',
      headline: 'BSE and NSE witness record trading volumes amid increased retail participation',
      url: 'https://www.business-standard.com/markets/bse-nse-record-volumes',
      source: 'Business Standard',
      publishedAt: new Date(Date.now() - 28800000).toISOString(),
    },
    {
      id: '10',
      headline: 'Market volatility increases as investors react to global inflation concerns',
      url: 'https://economictimes.indiatimes.com/markets/stocks/market-volatility-increases',
      source: 'Economic Times',
      publishedAt: new Date(Date.now() - 32400000).toISOString(),
    },
  ];

  // Analyze sentiment for each news article with delays to avoid rate limiting
  const newsWithSentiment: NewsArticle[] = [];
  
  for (let i = 0; i < mockNews.length; i++) {
    const article = mockNews[i];
    
    // Add delay between API calls to avoid rate limiting (except for first one)
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
    }
    
    try {
      const sentimentResult = await analyzeSentiment(article.headline);
      newsWithSentiment.push({
        ...article,
        sentiment: sentimentResult.sentiment,
        sentimentScore: sentimentResult.score,
      });
    } catch (error) {
      console.error(`[News Service] Error analyzing sentiment for article ${i + 1}:`, error);
      // Add article without sentiment on error
      newsWithSentiment.push({
        ...article,
        sentiment: 'neutral',
        sentimentScore: 0.5,
      });
    }
  }

  return newsWithSentiment;
}

