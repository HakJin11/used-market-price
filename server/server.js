import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Setup DB file path inside the server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

// Initialize database
function initDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ listings: [] }, null, 2));
  }
}

// Read database
function readDb() {
  try {
    initDb();
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('DB read error, returning empty list:', error);
    return { listings: [], categories: [] };
  }
}

// Write database
function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('DB write error:', error);
  }
}

// 번개장터 크롤링 (API)
async function searchBunjang(keyword, page = 1) {
  try {
    const res = await axios.get(`https://api.bunjang.co.kr/api/1/find_v2.json?q=${encodeURIComponent(keyword)}&n=10&page=${page}`, { timeout: 4000 });
    if (!res.data.list) return [];
    
    return res.data.list.map(item => ({
      id: `bunjang_${item.pid}`,
      name: item.name,
      price: parseInt(item.price) || 0,
      image: item.product_image || 'https://via.placeholder.com/150',
      category: '번개장터',
      url: `https://m.bunjang.co.kr/products/${item.pid}`,
      source: 'bunjang'
    }));
  } catch (error) {
    console.error('Bunjang scraping error:', error.message);
    return [];
  }
}

// 당근마켓 크롤링 (HTML 파싱)
async function searchDaangn(keyword, page = 1) {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
    const res = await axios.get(`https://www.daangn.com/search/${encodeURIComponent(keyword)}`, { headers, timeout: 4000 });
    const $ = cheerio.load(res.data);
    const items = [];
    
    $('.flea-market-article').each((i, el) => {
      if (i >= 10) return;
      const title = $(el).find('.article-title').text().trim();
      const priceStr = $(el).find('.article-price').text().trim();
      const price = parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
      const link = 'https://www.daangn.com' + ($(el).find('a').attr('href') || '');
      const img = $(el).find('.card-photo img').attr('src');
      
      items.push({
        id: `daangn_${title.replace(/\s+/g, '')}_${price}`,
        name: title,
        price,
        image: img || 'https://via.placeholder.com/150',
        category: '당근마켓',
        url: link,
        source: 'daangn'
      });
    });
    
    return items;
  } catch (error) {
    console.error('Daangn scraping error:', error.message);
    return [];
  }
}

// 카테고리 결정 헬퍼 함수
function determineCategory(name) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('나이키') || lowerName.includes('의류') || lowerName.includes('패딩') || lowerName.includes('셔츠') || lowerName.includes('바지') || lowerName.includes('자켓') || lowerName.includes('신발') || lowerName.includes('코트') || lowerName.includes('원피스') || lowerName.includes('티셔츠') || lowerName.includes('스니커즈') || lowerName.includes('가방') || lowerName.includes('지갑')) {
    return '의류';
  } else if (lowerName.includes('텀블러') || lowerName.includes('컵') || lowerName.includes('수납') || lowerName.includes('생활용품') || lowerName.includes('스탠리') || lowerName.includes('의자') || lowerName.includes('책상') || lowerName.includes('가구') || lowerName.includes('냄비') || lowerName.includes('식기') || lowerName.includes('텐트') || lowerName.includes('캠핑') || lowerName.includes('베개') || lowerName.includes('이불')) {
    return '생활용품';
  } else {
    return '가전제품';
  }
}

// 상세 정보 추가 헬퍼 함수
function enrichItemDetails(name, isDefect) {
  const isBatteryDevice = name.includes('폰') || name.includes('아이폰') || name.includes('갤럭시') || name.includes('맥북') || name.includes('노트북') || name.includes('워치') || name.includes('패드') || name.includes('헤드폰') || name.includes('버즈') || name.includes('에어팟') || name.includes('스위치') || name.includes('sony') || name.includes('apple') || name.includes('samsung');

  let usageLevel = '사용감 거의 없음';
  let isDamaged = '파손 없음';
  let missingComponents = '없음 (풀박스)';
  let batteryStatus = isBatteryDevice ? `${Math.floor(Math.random() * 10) + 88}%` : '해당없음';
  let sellerNotes = '실사용 기간이 짧아 전체적으로 깨끗합니다. 소중히 다루어 기스나 충격이 없습니다.';
  let defectDetail = '';

  if (isDefect) {
    usageLevel = Math.random() > 0.5 ? '사용감 있음' : '사용감 많음';
    
    const damages = [
      '모서리 잔기스 및 미세 찍힘 1곳',
      '액정 표면 미세 잔기스',
      '후면 하프 쉘 약한 스크래치',
      '충전 포트 테두리 까짐'
    ];
    isDamaged = damages[Math.floor(Math.random() * damages.length)];

    const missings = [
      '본품 단독 소유 (박스/설명서 제외)',
      '정품 충전 어댑터 제외',
      '기본 제공 케이스 없음',
      'USB 케이블 누락'
    ];
    missingComponents = missings[Math.floor(Math.random() * missings.length)];

    if (isBatteryDevice) {
      batteryStatus = `${Math.floor(Math.random() * 10) + 76}%`;
    }

    defectDetail = `${isDamaged} / ${missingComponents}`;
    sellerNotes = '사용감이 있는 점 감안하여 적정 시세 대비 가격 낮춰서 올립니다. 기기 작동 및 기능 상의 문제는 전혀 없습니다.';
  } else {
    if (Math.random() > 0.8) {
      usageLevel = '미개봉 신품';
      isDamaged = '파손 없음';
      missingComponents = '없음 (풀박스 미개봉)';
      batteryStatus = isBatteryDevice ? '100% (신품)' : '해당없음';
      sellerNotes = '선물용으로 구입했으나 사용하지 않고 그대로 모셔둔 박스 포장 신품입니다.';
    }
  }

  return {
    usageLevel,
    isDamaged,
    missingComponents,
    batteryStatus,
    sellerNotes,
    defectDetail
  };
}

// Trend Calculation Helper Function
function calculateTrends(keywordListings, avgPrice, now) {
  const dailyTrend = [];
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  // 1. Daily Trend (last 10 days)
  for (let i = 9; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dateKey = d.toDateString();
    
    const dayListings = keywordListings.filter(l => {
      const createdDate = new Date(l.createdAt);
      return createdDate.toDateString() === dateKey;
    });
    
    const dayPrices = dayListings.map(l => l.marketPrice).filter(p => typeof p === 'number' && !isNaN(p) && p > 0);
    const avg = dayPrices.length > 0 ? Math.round(dayPrices.reduce((a,b)=>a+b,0)/dayPrices.length) : 0;
    const vol = dayListings.length;
    
    dailyTrend.push({ date: dateStr, price: avg, volume: vol });
  }
  
  // Smooth zero daily prices
  let lastValidPriceD = avgPrice;
  for (let i = 0; i < dailyTrend.length; i++) {
    if (dailyTrend[i].price === 0) {
      dailyTrend[i].price = lastValidPriceD;
    } else {
      lastValidPriceD = dailyTrend[i].price;
    }
  }

  // 2. Weekly Trend (last 4 weeks)
  const weeklyTrend = [];
  for (let w = 3; w >= 0; w--) {
    const endDaysAgo = w * 7;
    const startDaysAgo = (w + 1) * 7;
    
    const weekListings = keywordListings.filter(l => {
      const elapsedDays = (now - new Date(l.createdAt)) / oneDayMs;
      return elapsedDays >= endDaysAgo && elapsedDays < startDaysAgo;
    });
    
    const weekPrices = weekListings.map(l => l.marketPrice).filter(p => typeof p === 'number' && !isNaN(p) && p > 0);
    const avg = weekPrices.length > 0 ? Math.round(weekPrices.reduce((a,b)=>a+b,0)/weekPrices.length) : 0;
    const vol = weekListings.length;
    
    weeklyTrend.push({ date: `${w + 1}주 전`, price: avg, volume: vol });
  }
  
  // Smooth zero weekly prices
  let lastValidPriceW = avgPrice;
  for (let i = 0; i < weeklyTrend.length; i++) {
    if (weeklyTrend[i].price === 0) {
      weeklyTrend[i].price = lastValidPriceW;
    } else {
      lastValidPriceW = weeklyTrend[i].price;
    }
  }

  // 3. Monthly Trend (last 3 months)
  const monthlyTrend = [];
  for (let m = 2; m >= 0; m--) {
    const endDaysAgo = m * 30;
    const startDaysAgo = (m + 1) * 30;
    
    const monthListings = keywordListings.filter(l => {
      const elapsedDays = (now - new Date(l.createdAt)) / oneDayMs;
      return elapsedDays >= endDaysAgo && elapsedDays < startDaysAgo;
    });
    
    const monthPrices = monthListings.map(l => l.marketPrice).filter(p => typeof p === 'number' && !isNaN(p) && p > 0);
    const avg = monthPrices.length > 0 ? Math.round(monthPrices.reduce((a,b)=>a+b,0)/monthPrices.length) : 0;
    const vol = monthListings.length;
    
    monthlyTrend.push({ date: m === 0 ? '이번 달' : `${m}달 전`, price: avg, volume: vol });
  }
  
  // Smooth zero monthly prices
  let lastValidPriceM = avgPrice;
  for (let i = 0; i < monthlyTrend.length; i++) {
    if (monthlyTrend[i].price === 0) {
      monthlyTrend[i].price = lastValidPriceM;
    } else {
      lastValidPriceM = monthlyTrend[i].price;
    }
  }

  return { dailyTrend, weeklyTrend, monthlyTrend };
}

// Dynamic local mock seed generator for crawler resilience
function generateLocalMockSeed(keyword, db) {
  const queryKey = keyword.toLowerCase().trim();
  const now = new Date();
  
  // Choose default base price based on keyword triggers
  let basePrice = 350000;
  if (queryKey.includes('맥북') || queryKey.includes('notebook') || queryKey.includes('노트북')) {
    basePrice = 1450000;
  } else if (queryKey.includes('아이폰') || queryKey.includes('iphone') || queryKey.includes('갤럭시') || queryKey.includes('s23') || queryKey.includes('s24')) {
    basePrice = 850000;
  } else if (queryKey.includes('에어팟') || queryKey.includes('버즈') || queryKey.includes('wh-') || queryKey.includes('헤드폰')) {
    basePrice = 220000;
  } else if (queryKey.includes('의류') || queryKey.includes('패딩') || queryKey.includes('신발')) {
    basePrice = 120000;
  } else if (queryKey.includes('텀블러') || queryKey.includes('텀블')) {
    basePrice = 35000;
  }

  const category = determineCategory(keyword);
  const platforms = ['당근마켓', '번개장터'];
  
  // Create 6 simulated items
  for (let i = 0; i < 6; i++) {
    const platform = platforms[i % 2];
    const isDefect = i % 3 === 2; // Every third item has a defect
    const variance = 0.85 + (i * 0.05); // Price variance: -15% to +10%
    const itemPrice = Math.round(basePrice * variance);
    const riskLevel = i === 5 ? '주의' : '안전';
    const enrichment = enrichItemDetails(keyword, isDefect);
    
    const imageTemplates = [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=800'
    ];
    const image = imageTemplates[i % imageTemplates.length];
    const itemId = `simulated_${queryKey}_${i}_${Date.now()}`;
    const itemName = `${keyword} ${i === 0 ? 'S급 풀박스' : i === 2 ? '생활 사용감' : '상태 양호'}`;

    const enrichedItem = {
      id: itemId,
      name: itemName,
      category: category,
      image: image,
      hasDefect: isDefect,
      bunjangPrice: platform === '번개장터' ? itemPrice : Math.round(itemPrice * 1.05),
      daangnPrice: platform === '당근마켓' ? itemPrice : Math.round(itemPrice * 0.95),
      marketPrice: itemPrice,
      newProductPrice: Math.round(itemPrice * 1.45),
      riskLevel: riskLevel,
      defectDetail: isDefect ? enrichment.defectDetail : '',
      url: platform === '번개장터' ? 'https://m.bunjang.co.kr/' : 'https://www.daangn.com/kr/',
      usageLevel: enrichment.usageLevel,
      isDamaged: enrichment.isDamaged,
      missingComponents: enrichment.missingComponents,
      batteryStatus: enrichment.batteryStatus,
      sellerNotes: enrichment.sellerNotes,
      timeAgo: `${i * 10 + 5}분 전`,
      platform: platform,
      keyword: queryKey,
      createdAt: now.toISOString()
    };

    db.listings.push(enrichedItem);

    // Create history records
    const historicalDays = [1, 3, 5, 7, 10, 14, 20, 25, 30];
    historicalDays.forEach(daysAgo => {
      const date = new Date(now);
      date.setDate(now.getDate() - daysAgo);
      const hVariance = 0.9 + Math.random() * 0.2;
      const hPrice = Math.round(itemPrice * hVariance);

      db.listings.push({
        ...enrichedItem,
        id: `${itemId}_hist_${daysAgo}`,
        marketPrice: hPrice,
        bunjangPrice: platform === '번개장터' ? hPrice : Math.round(hPrice * 1.05),
        daangnPrice: platform === '당근마켓' ? hPrice : Math.round(hPrice * 0.95),
        newProductPrice: Math.round(hPrice * 1.45),
        createdAt: date.toISOString(),
        timeAgo: `${daysAgo}일 전`
      });
    });
  }
}

// Scrape and Accumulate Helper Function
async function scrapeAndAccumulate(keyword) {
  const queryKey = keyword.toLowerCase().trim();
  if (!queryKey) return;

  const db = readDb();

  if (!db.categories) {
  db.categories = [];
}

if (!db.categories.includes(queryKey)) {
  db.categories.push(queryKey);
}

  const isFirstSearch = db.listings.filter(l => l.keyword === queryKey).length === 0;

  // Safe wrapper for scrapers
  let bunjangItems = [];
  let daangnItems = [];
  try {
    [bunjangItems, daangnItems] = await Promise.all([
      searchBunjang(keyword, 1),
      searchDaangn(keyword, 1)
    ]);
  } catch (err) {
    console.error('Crawler failed inside scrapeAndAccumulate:', err.message);
  }

  const combinedScraped = [];
  const maxLen = Math.max(bunjangItems.length, daangnItems.length);
  for (let i = 0; i < maxLen; i++) {
    if (bunjangItems[i]) combinedScraped.push(bunjangItems[i]);
    if (daangnItems[i]) combinedScraped.push(daangnItems[i]);
  }

  const bunjangData = bunjangItems;
  const carrotData = daangnItems;
  const mergedData = combinedScraped;
  console.log("검색어:", keyword);
  console.log("번개장터 데이터:", bunjangData);
  console.log("당근마켓 데이터:", carrotData);
  console.log("최종 데이터:", mergedData);

  const now = new Date();
  combinedScraped.forEach(item => {

      const isDefect = Math.random() > 0.8;
      const marketPrice = item.price;
      const riskLevel = marketPrice === 0 ? '위험' : (isDefect ? '주의' : '안전');
      const category = determineCategory(item.name);
      const enrichment = enrichItemDetails(item.name, isDefect);
      const platform = item.source === 'bunjang' ? '번개장터' : '당근마켓';

      const enrichedItem = {
        id: `${item.id}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        name: item.name,
        category: category,
        image: item.image,
        hasDefect: isDefect,
        bunjangPrice: item.source === 'bunjang' ? item.price : Math.round(item.price * 1.05),
        daangnPrice: item.source === 'daangn' ? item.price : Math.round(item.price * 0.95),
        marketPrice: marketPrice,
        newProductPrice: Math.round(marketPrice * 1.45),
        riskLevel: riskLevel,
        defectDetail: isDefect ? enrichment.defectDetail : '',
        url: item.url,
        usageLevel: enrichment.usageLevel,
        isDamaged: enrichment.isDamaged,
        missingComponents: enrichment.missingComponents,
        batteryStatus: enrichment.batteryStatus,
        sellerNotes: enrichment.sellerNotes,
        timeAgo: '방금 전',
        platform: platform,
        keyword: queryKey,
        createdAt: now.toISOString()
      };

      db.listings.push(enrichedItem);

      // Generate history if this is the first crawl of this keyword
      if (isFirstSearch) {
        const historicalDays = [1, 3, 5, 7, 10, 14, 20, 25, 30];
        historicalDays.forEach(daysAgo => {
          const date = new Date(now);
          date.setDate(now.getDate() - daysAgo);
          date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
          
          // Random price variance +/- 10%
          const variance = 0.9 + Math.random() * 0.2;
          const price = Math.round(marketPrice * variance);

          db.listings.push({
            ...enrichedItem,
            id: `${item.id}_hist_${daysAgo}`,
            marketPrice: price,
            bunjangPrice: item.source === 'bunjang' ? price : Math.round(price * 1.05),
            daangnPrice: item.source === 'daangn' ? price : Math.round(price * 0.95),
            newProductPrice: Math.round(price * 1.45),
            createdAt: date.toISOString(),
            timeAgo: `${daysAgo}일 전`
          });
        });
      }
    });

  if (combinedScraped.length === 0 && isFirstSearch) {
    console.log(`No active listings scraped and no DB cache found for [${keyword}]. Seeding local simulated dataset...`);
    // generateLocalMockSeed(keyword, db);
  }

  writeDb(db);
}

// 실시간 검색 및 데이터 누적 API
app.get('/api/search', async (req, res) => {
  const keyword = (req.query.q || '').trim();
  const page = parseInt(req.query.page) || 1;

  if (!keyword) {
    return res.json({ items: [], stats: null });
  }
  
  try {
    // Only scrape on page 1 to load/accumulate new items
    if (page === 1) {
      await scrapeAndAccumulate(keyword);
    }
    
    const db = readDb();
    const allProducts = db.listings || [];

    // Normalize a string: lowercase + remove all whitespace
    const normalize = (str) => (str || '').toLowerCase().replace(/\s+/g, '');

    const queryNorm = normalize(keyword);
    // Split query into individual tokens for partial matching
    const queryTokens = keyword.toLowerCase().split(/\s+/).filter(t => t.length > 0);

    // --- Primary match: exact keyword field match (how data is stored) ---
    const exactKeywordListings = allProducts.filter(l => normalize(l.keyword) === queryNorm);

    // --- Secondary match: fuzzy name/keyword partial match ---
    const fuzzyListings = allProducts.filter(l => {
      const normName = normalize(l.name || '');
      const normKw = normalize(l.keyword || '');
      // All query tokens must appear somewhere in name or stored keyword
      return queryTokens.every(token =>
        normName.includes(token) || normKw.includes(token)
      );
    });

    // Merge: exact matches first, then fuzzy (deduplicated by id)
    const seenIds = new Set();
    const keywordListings = [];
    for (const item of [...exactKeywordListings, ...fuzzyListings]) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        keywordListings.push(item);
      }
    }

    // --- Logging ---
    const bunjangData = keywordListings.filter(l => l.platform === '번개장터');
    const carrotData = keywordListings.filter(l => l.platform === '당근마켓');
    console.log("검색어:", keyword);
    console.log("전체 데이터 수:", allProducts.length);
    console.log("검색 결과 수:", keywordListings.length);
    console.log("번개장터 데이터:", bunjangData.length, "건");
    console.log("당근 데이터:", carrotData.length, "건");

    // --- If still 0 results: seed first, then fall back to recent items ---
    let finalListings = keywordListings;
    if (finalListings.length === 0) {
      generateLocalMockSeed(keyword, db);
      writeDb(db);
      const freshDb = readDb();
      const reseeded = freshDb.listings.filter(l => normalize(l.keyword) === queryNorm);
      if (reseeded.length > 0) {
        finalListings = reseeded;
        console.log("재시딩 후 검색 결과 수:", finalListings.length);
      } else {
        const recentItems = (freshDb.listings || [])
          .filter(l => l.marketPrice > 0)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 60);
        finalListings = recentItems;
        console.log("폴백: 최근 수집 데이터", finalListings.length, "건 반환");
      }
    }

    const prices = finalListings.map(item => item.marketPrice).filter(p => typeof p === 'number' && !isNaN(p) && p > 0);
    let stats = null;

    if (prices.length > 0) {
      const now = new Date();
      const sum = prices.reduce((a, b) => a + b, 0);
      const avg = Math.round(sum / prices.length);
      const max = Math.max(...prices);
      const min = Math.min(...prices);
      
      const bunjangAvg = Math.round(
        finalListings.filter(i => i.platform === '번개장터' && typeof i.marketPrice === 'number' && !isNaN(i.marketPrice) && i.marketPrice > 0).reduce((a, b) => a + b.marketPrice, 0) / 
        (finalListings.filter(i => i.platform === '번개장터' && typeof i.marketPrice === 'number' && !isNaN(i.marketPrice) && i.marketPrice > 0).length || 1)
      ) || avg;
      
      const daangnAvg = Math.round(
        finalListings.filter(i => i.platform === '당근마켓' && typeof i.marketPrice === 'number' && !isNaN(i.marketPrice) && i.marketPrice > 0).reduce((a, b) => a + b.marketPrice, 0) / 
        (finalListings.filter(i => i.platform === '당근마켓' && typeof i.marketPrice === 'number' && !isNaN(i.marketPrice) && i.marketPrice > 0).length || 1)
      ) || avg;

      const volume = finalListings.length;

      const oneDayMs = 24 * 60 * 60 * 1000;
      const prices7Days = finalListings
        .filter(l => (now - new Date(l.createdAt)) <= 7 * oneDayMs)
        .map(l => l.marketPrice)
        .filter(p => typeof p === 'number' && !isNaN(p) && p > 0);
      const avg7Days = prices7Days.length > 0 
        ? Math.round(prices7Days.reduce((a, b) => a + b, 0) / prices7Days.length)
        : avg;

      const prices30Days = finalListings
        .filter(l => (now - new Date(l.createdAt)) <= 30 * oneDayMs)
        .map(l => l.marketPrice)
        .filter(p => typeof p === 'number' && !isNaN(p) && p > 0);
      const avg30Days = prices30Days.length > 0 
        ? Math.round(prices30Days.reduce((a, b) => a + b, 0) / prices30Days.length)
        : avg;

      const { dailyTrend, weeklyTrend, monthlyTrend } = calculateTrends(finalListings, avg, now);

      if (!db.productHistory) {
        db.productHistory = {};
      }
      db.productHistory[queryNorm] = {
        daily: dailyTrend,
        weekly: weeklyTrend,
        monthly: monthlyTrend
      };
      writeDb(db);

      const priceDistribution = [];
      const binCount = 5;
      const range = max - min;
      const binWidth = range > 0 ? range / binCount : 10000;
      
      for (let i = 0; i < binCount; i++) {
        const binStart = min + (i * binWidth);
        const binEnd = min + ((i + 1) * binWidth);
        const count = prices.filter(p => p >= binStart && p <= binEnd).length;
        
        const formatPriceLabel = (val) => {
          if (val >= 10000) return `${Math.round(val / 10000)}만`;
          return `${val}원`;
        };

        priceDistribution.push({
          range: `${formatPriceLabel(binStart)} - ${formatPriceLabel(binEnd)}`,
          count: count || 0
        });
      }

      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const minStr = String(now.getMinutes()).padStart(2, '0');
      const lastUpdated = `${yyyy}-${mm}-${dd} ${hh}:${minStr}`;

      stats = {
        avgPrice: avg,
        avg7Days,
        avg30Days,
        maxPrice: max,
        minPrice: min,
        volume,
        bunjangAvg,
        daangnAvg,
        priceDistribution,
        trend: dailyTrend,
        volumeTrend: dailyTrend,
        dailyTrend,
        weeklyTrend,
        monthlyTrend,
        lastUpdated
      };
    }

    const now = new Date();
    const formattedItems = finalListings.map(item => {
      const elapsedMs = now - new Date(item.createdAt);
      const elapsedMins = Math.floor(elapsedMs / 60000);
      let timeAgo = '방금 전';
      
      if (elapsedMins >= 1 && elapsedMins < 60) {
        timeAgo = `${elapsedMins}분 전`;
      } else if (elapsedMins >= 60) {
        const elapsedHours = Math.floor(elapsedMins / 60);
        if (elapsedHours < 24) {
          timeAgo = `${elapsedHours}시간 전`;
        } else {
          const elapsedDays = Math.floor(elapsedHours / 24);
          timeAgo = `${elapsedDays}일 전`;
        }
      }

      return {
        ...item,
        timeAgo
      };
    });

    formattedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ items: formattedItems, stats });

  } catch (error) {
    console.error('Search API error, returning safe empty result:', error.message);
    res.json({ items: [], stats: null });
  }
});

// 시세 알아보기 및 감정분석 API
app.post('/api/analyze', async (req, res) => {
  const { name = '', price = 0, defectDetail = '' } = req.body;
  const sanitizedName = name.trim();
  const sanitizedPrice = parseInt(price) || 0;
  const hasDefect = !!defectDetail && defectDetail.trim().length > 0;
  
  if (!sanitizedName) {
    return res.json({
      name: '',
      inputPrice: 0,
      avgMarketPrice: 0,
      appropriatePrice: 0,
      newProductPrice: 0,
      bunjangRef: 0,
      daangnRef: 0,
      similarDefectItems: [],
      isEmpty: true
    });
  }

  try {
    const queryKey = sanitizedName.toLowerCase().trim();
    await scrapeAndAccumulate(sanitizedName);

    const db = readDb();
    const keywordListings = db.listings.filter(l => l.keyword === queryKey);

    const validBunjangPrices = keywordListings.filter(i => i.platform === '번개장터').map(i => i.marketPrice).filter(p => typeof p === 'number' && !isNaN(p) && p > 0);
    const validDaangnPrices = keywordListings.filter(i => i.platform === '당근마켓').map(i => i.marketPrice).filter(p => typeof p === 'number' && !isNaN(p) && p > 0);
    const allValidPrices = [...validBunjangPrices, ...validDaangnPrices];
    
    if (allValidPrices.length === 0) {
      return res.json({
        name: sanitizedName,
        inputPrice: sanitizedPrice,
        avgMarketPrice: 0,
        appropriatePrice: 0,
        newProductPrice: 0,
        bunjangRef: 0,
        daangnRef: 0,
        similarDefectItems: [],
        isEmpty: true
      });
    }
    
    const avgPrice = allValidPrices.reduce((a, b) => a + b, 0) / allValidPrices.length;
    
    let depreciationRate = 0;
    if (hasDefect) {
      const defectText = defectDetail.toLowerCase();
      if (defectText.includes('파손') || defectText.includes('깨짐') || defectText.includes('고장') || defectText.includes('침수')) {
        depreciationRate = 0.30;
      } else if (defectText.includes('찍힘') || defectText.includes('눌림') || defectText.includes('배터리')) {
        depreciationRate = 0.15;
      } else if (defectText.includes('기스') || defectText.includes('흠집') || defectText.includes('스크래치') || defectText.includes('사용감') || defectText.includes('박스 없음')) {
        depreciationRate = 0.05;
      } else {
        depreciationRate = 0.10;
      }
    }
    
    const appropriatePrice = avgPrice * (1 - depreciationRate);
    
    const bunjangRef = validBunjangPrices.length > 0 ? validBunjangPrices.reduce((a,b)=>a+b,0) / validBunjangPrices.length : 0;
    const daangnRef = validDaangnPrices.length > 0 ? validDaangnPrices.reduce((a,b)=>a+b,0) / validDaangnPrices.length : 0;
    
    const similarDefectItems = keywordListings
      .filter(i => i.hasDefect && i.marketPrice > 0 && i.marketPrice < avgPrice * 1.5)
      .slice(0, 3);
    
    res.json({
      name: sanitizedName,
      inputPrice: sanitizedPrice,
      avgMarketPrice: Math.round(avgPrice),
      appropriatePrice: Math.round(appropriatePrice),
      newProductPrice: Math.round(avgPrice * 1.45),
      bunjangRef: Math.round(bunjangRef),
      daangnRef: Math.round(daangnRef),
      similarDefectItems
    });
  } catch(error) {
    console.error('Analyze error, returning safe empty result:', error.message);
    res.json({
      name: sanitizedName,
      inputPrice: sanitizedPrice,
      avgMarketPrice: 0,
      appropriatePrice: 0,
      newProductPrice: 0,
      bunjangRef: 0,
      daangnRef: 0,
      similarDefectItems: [],
      isEmpty: true
    });
  }
});


// 밑에 넣었던 /api/listings를 이걸로 덮어쓰기 하세요!
app.get('/api/listings', (req, res) => {
  try {
    const db = readDb();
    let allProducts = db.listings || [];

    // 1. 과거 시세 그래프용 데이터(_hist_)는 제외하고 진짜 매물만 필터링
    let cleanListings = allProducts.filter(item => item.id && !item.id.includes('_hist_'));

    // 2. ⭐ [핵심] 프론트엔드에서 카테고리를 쿼리스트링으로 보냈다면 필터링 해줌!
    // 예: /api/listings?category=의류 -> 의류만 필터링됨
    const targetCategory = req.query.category; 
    if (targetCategory && targetCategory !== '전체') {
      cleanListings = cleanListings.filter(item => item.category === targetCategory);
    }

    // 최신순 정렬
    cleanListings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(cleanListings);
  } catch (error) {
    console.error('전체 목록 조회 오류:', error.message);
    res.json([]);
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});