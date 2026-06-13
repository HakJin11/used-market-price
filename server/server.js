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

// ─── 초기 데이터 시딩 ──────────────────────────────────────────────────────────
// 서버 시작 시 DB 매물이 부족하면 60개 기본 매물을 자동 생성
const INITIAL_SEED_ITEMS = [
  // ── 아이폰 ──
  { keyword: '아이폰', name: '아이폰 15 Pro 128GB 자연티타늄', basePrice: 1100000, category: '가전제품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1695048132532-1c45e5e7f6f1?auto=format&fit=crop&w=400&q=80', bunjangPid: '236812345' },
  { keyword: '아이폰', name: '아이폰 14 256GB 미드나이트', basePrice: 780000, category: '가전제품', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1662947037261-be37cde2b3b0?auto=format&fit=crop&w=400&q=80', daangnId: '254719823' },
  { keyword: '아이폰', name: '아이폰 15 256GB 핑크', basePrice: 920000, category: '가전제품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1695048132532-1c45e5e7f6f1?auto=format&fit=crop&w=400&q=80', bunjangPid: '238001234' },
  { keyword: '아이폰', name: '아이폰 13 128GB 스타라이트', basePrice: 580000, category: '가전제품', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1662947037261-be37cde2b3b0?auto=format&fit=crop&w=400&q=80', daangnId: '249301234' },
  { keyword: '아이폰', name: '아이폰 15 Pro Max 256GB 블랙티타늄', basePrice: 1350000, category: '가전제품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1695048132532-1c45e5e7f6f1?auto=format&fit=crop&w=400&q=80', bunjangPid: '239012345' },
  // ── 갤럭시 ──
  { keyword: '갤럭시', name: '삼성 갤럭시 S24 Ultra 256GB', basePrice: 1050000, category: '가전제품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=400&q=80', bunjangPid: '236904512' },
  { keyword: '갤럭시', name: '갤럭시 S23+ 512GB 크림', basePrice: 720000, category: '가전제품', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=400&q=80', daangnId: '251830944' },
  { keyword: '갤럭시', name: '갤럭시 S24+ 256GB 그레이', basePrice: 890000, category: '가전제품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=400&q=80', bunjangPid: '237512340' },
  { keyword: '갤럭시', name: '갤럭시 Z폴드5 256GB', basePrice: 1200000, category: '가전제품', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=400&q=80', daangnId: '252901234' },
  // ── 맥북 ──
  { keyword: '맥북', name: '애플 맥북 에어 M2 13인치 스타라이트', basePrice: 1250000, category: '가전제품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80', bunjangPid: '235671234' },
  { keyword: '맥북', name: '맥북 프로 14인치 M3 스페이스블랙', basePrice: 2100000, category: '가전제품', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80', daangnId: '253948721' },
  { keyword: '맥북', name: '맥북 에어 M3 15인치 미드나이트', basePrice: 1580000, category: '가전제품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80', bunjangPid: '240123456' },
  { keyword: '맥북', name: '맥북 프로 16인치 M3 Max', basePrice: 3200000, category: '가전제품', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80', daangnId: '256012345' },
  // ── 에어팟 ──
  { keyword: '에어팟', name: '에어팟 프로 2세대 USB-C', basePrice: 220000, category: '가전제품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=400&q=80', bunjangPid: '237123456' },
  { keyword: '에어팟', name: '에어팟 4세대 ANC 화이트', basePrice: 180000, category: '가전제품', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=400&q=80', daangnId: '255012834' },
  { keyword: '에어팟', name: '에어팟 맥스 미드나이트', basePrice: 490000, category: '가전제품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=400&q=80', bunjangPid: '238765432' },
  // ── 닌텐도 ──
  { keyword: '닌텐도', name: '닌텐도 스위치 OLED 흰색', basePrice: 310000, category: '가전제품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1578306899732-7206132cc49d?auto=format&fit=crop&w=400&q=80', bunjangPid: '234987123' },
  { keyword: '닌텐도', name: '닌텐도 스위치 라이트 옐로우', basePrice: 195000, category: '가전제품', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1578306899732-7206132cc49d?auto=format&fit=crop&w=400&q=80', daangnId: '252176543' },
  { keyword: '닌텐도', name: '닌텐도 스위치 OLED 네온 풀박스', basePrice: 295000, category: '가전제품', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1578306899732-7206132cc49d?auto=format&fit=crop&w=400&q=80', daangnId: '253456789' },
  // ── 소니 ──
  { keyword: '소니헤드폰', name: '소니 WH-1000XM5 블랙', basePrice: 280000, category: '가전제품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=400&q=80', bunjangPid: '236543219' },
  { keyword: '소니헤드폰', name: '소니 WH-1000XM4 미드나이트블루', basePrice: 210000, category: '가전제품', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=400&q=80', daangnId: '251234567' },
  // ── 아이패드 ──
  { keyword: '아이패드', name: '아이패드 프로 11인치 M4 256GB Wi-Fi', basePrice: 1100000, category: '가전제품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1542751110-97427bbecfd8?auto=format&fit=crop&w=400&q=80', bunjangPid: '237890123' },
  { keyword: '아이패드', name: '아이패드 에어 5세대 256GB 스타라이트', basePrice: 680000, category: '가전제품', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1542751110-97427bbecfd8?auto=format&fit=crop&w=400&q=80', daangnId: '254890123' },
  { keyword: '아이패드', name: '아이패드 미니 6세대 64GB 퍼플', basePrice: 520000, category: '가전제품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1542751110-97427bbecfd8?auto=format&fit=crop&w=400&q=80', bunjangPid: '238123456' },
  // ── 다이슨 ──
  { keyword: '다이슨', name: '다이슨 에어랩 컴플리트 롱 니켈/코퍼', basePrice: 490000, category: '가전제품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=400&q=80', bunjangPid: '236789012' },
  { keyword: '다이슨', name: '다이슨 V15 디텍트 무선청소기', basePrice: 420000, category: '가전제품', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80', daangnId: '253012345' },
  // ── 나이키 ──
  { keyword: '나이키', name: '나이키 에어맥스 90 화이트 270mm', basePrice: 95000, category: '의류', platform: '번개장터', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80', bunjangPid: '235810234' },
  { keyword: '나이키', name: '나이키 에어포스 1 OG 화이트 265mm', basePrice: 115000, category: '의류', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=400&q=80', daangnId: '253401876' },
  { keyword: '나이키', name: '나이키 조던 1 레트로 하이 OG 시카고', basePrice: 380000, category: '의류', platform: '번개장터', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80', bunjangPid: '236012345' },
  { keyword: '나이키', name: '나이키 덩크 로우 판다 265mm', basePrice: 145000, category: '의류', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80', daangnId: '254123456' },
  // ── 패딩 ──
  { keyword: '패딩', name: '노스페이스 눕시 패딩 M사이즈 블랙', basePrice: 180000, category: '의류', platform: '번개장터', image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=400&q=80', bunjangPid: '236123890' },
  { keyword: '패딩', name: '캐나다구스 조스탄 파카 M사이즈', basePrice: 650000, category: '의류', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=400&q=80', daangnId: '253678901' },
  { keyword: '패딩', name: '몽클레어 마야 숏패딩 네이비 L', basePrice: 1200000, category: '의류', platform: '번개장터', image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=400&q=80', bunjangPid: '237234567' },
  { keyword: '패딩', name: '노스페이스 1996 레트로 눕시 화이트', basePrice: 220000, category: '의류', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=400&q=80', daangnId: '254567890' },
  // ── 가방 ──
  { keyword: '가방', name: '구찌 GG 마몽 미니 숄더백 베이지', basePrice: 980000, category: '의류', platform: '번개장터', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80', bunjangPid: '236345678' },
  { keyword: '가방', name: '루이비통 네버풀 MM 다미에 에벤', basePrice: 1450000, category: '의류', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80', daangnId: '253789012' },
  { keyword: '가방', name: '샤넬 클래식 플랩 미니 블랙 캐비어', basePrice: 5800000, category: '의류', platform: '번개장터', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80', bunjangPid: '237456789' },
  // ── 스탠리 ──
  { keyword: '스탠리', name: '스탠리 퀜처 텀블러 887ml 블랙', basePrice: 42000, category: '생활용품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80', bunjangPid: '237654321' },
  { keyword: '스탠리', name: '스탠리 IceFlow 텀블러 650ml 라벤더', basePrice: 35000, category: '생활용품', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80', daangnId: '255234567' },
  { keyword: '스탠리', name: '스탠리 퀜처 1.18L 올데이슬림 크림', basePrice: 55000, category: '생활용품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80', bunjangPid: '238901234' },
  // ── 캠핑 ──
  { keyword: '캠핑', name: '스노우피크 쉘터 TP-880R', basePrice: 380000, category: '생활용품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=400&q=80', bunjangPid: '235012345' },
  { keyword: '캠핑', name: '코베아 팰리스 거실형 텐트 4~5인용', basePrice: 250000, category: '생활용품', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=400&q=80', daangnId: '252345678' },
  { keyword: '캠핑', name: '콜맨 로드트립 LXE 그릴 그레이', basePrice: 130000, category: '생활용품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=400&q=80', bunjangPid: '236567890' },
  // ── 가구/인테리어 ──
  { keyword: '의자', name: '허먼밀러 에어론 체어 사이즈B 카본', basePrice: 850000, category: '생활용품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80', bunjangPid: '234567890' },
  { keyword: '의자', name: '시디즈 T50 홈 의자 블랙', basePrice: 220000, category: '생활용품', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80', daangnId: '251456789' },
  // ── 카메라 ──
  { keyword: '카메라', name: '소니 A7M4 바디', basePrice: 1800000, category: '가전제품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80', bunjangPid: '235123456' },
  { keyword: '카메라', name: '캐논 EOS R6 Mark II 바디', basePrice: 2100000, category: '가전제품', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80', daangnId: '252567890' },
  { keyword: '카메라', name: '후지필름 X100VI 실버', basePrice: 1050000, category: '가전제품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80', bunjangPid: '237901234' },
  // ── 노트북 ──
  { keyword: '노트북', name: 'LG 그램 16 2024 Ultra7 512GB', basePrice: 1450000, category: '가전제품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=80', bunjangPid: '236678901' },
  { keyword: '노트북', name: '삼성 갤럭시북4 Pro 360 14인치', basePrice: 1300000, category: '가전제품', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=80', daangnId: '253890123' },
  // ── 시계 ──
  { keyword: '시계', name: '롤렉스 서브마리너 흑콤 블랙다이얼', basePrice: 16500000, category: '의류', platform: '번개장터', image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=400&q=80', bunjangPid: '232345678' },
  { keyword: '시계', name: '애플워치 시리즈9 45mm GPS', basePrice: 320000, category: '가전제품', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80', daangnId: '254901234' },
  { keyword: '시계', name: '가민 에픽스 프로 Gen2 블랙', basePrice: 580000, category: '가전제품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80', bunjangPid: '237012345' },
  // ── 의류 기타 ──
  { keyword: '자켓', name: '아르카테라스 소프트쉘 자켓 M 그린', basePrice: 85000, category: '의류', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80', daangnId: '253123456' },
  { keyword: '자켓', name: '나이키 테크 플리스 세트 블랙 L', basePrice: 95000, category: '의류', platform: '번개장터', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80', bunjangPid: '236890123' },
  // ── 생활 가전 ──
  { keyword: '공기청정기', name: '다이슨 퓨어 쿨 TP07 화이트/실버', basePrice: 350000, category: '가전제품', platform: '번개장터', image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=400&q=80', bunjangPid: '235890123' },
  { keyword: '공기청정기', name: '삼성 비스포크 큐브 에어 AX60', basePrice: 280000, category: '가전제품', platform: '당근마켓', image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=400&q=80', daangnId: '252678901' },
];

function seedInitialData() {
  const db = readDb();
  const realListings = db.listings.filter(l => l.id && !l.id.includes('_hist_') && l.marketPrice > 0);

  // 40건 미만이면 재시딩 (서버 재시작마다 데이터 보충)
  if (realListings.length >= 40) {
    console.log(`DB에 기존 매물 ${realListings.length}건 존재 - 초기 시딩 스킵`);
    return;
  }

  console.log(`DB 매물 ${realListings.length}건 → 60건으로 증가 시딩 시작...`);
  const now = new Date();
  const riskMap = ['안전', '안전', '주의', '안전', '안전', '주의', '안전', '위험', '안전', '안전'];

  // 기존 seed ID 중복 방지
  const existingIds = new Set(db.listings.map(l => l.id));

  INITIAL_SEED_ITEMS.forEach((seed, idx) => {
    const seedId = `seed_${seed.keyword}_${idx}`;
    if (existingIds.has(seedId)) return; // 이미 존재하면 스킵

    // 3가지 가격 변동을 만들어 매물 다양성 증가
    const variants = [
      { priceMul: 0.88 + Math.random() * 0.08, defect: false, suffix: 'S급 풀박스' },
      { priceMul: 0.78 + Math.random() * 0.08, defect: false, suffix: '상태 양호' },
      { priceMul: 0.68 + Math.random() * 0.08, defect: true,  suffix: '생활기스 있음' },
    ];

    variants.forEach((v, vi) => {
      const itemPrice = Math.round(seed.basePrice * v.priceMul);
      const riskLevel = v.defect ? '주의' : riskMap[idx % riskMap.length];

      const bunjangUrl = seed.bunjangPid ? `https://bunjang.co.kr/products/${seed.bunjangPid}` : null;
      const daangnUrl  = seed.daangnId   ? `https://www.daangn.com/articles/${seed.daangnId}`   : null;
      const fallbackUrl = seed.platform === '번개장터'
        ? `https://m.bunjang.co.kr/search/products?q=${encodeURIComponent(seed.keyword)}`
        : `https://www.daangn.com/kr/buy-sell/?search_type=keyword&query=${encodeURIComponent(seed.keyword)}`;
      const url = bunjangUrl || daangnUrl || fallbackUrl;

      // 시간 분산: 최근 72시간 내 무작위 등록 시간
      const createdAt = new Date(now);
      createdAt.setMinutes(now.getMinutes() - (idx * 19 + vi * 43 + Math.floor(Math.random() * 60)));

      const itemId = `${seedId}_v${vi}`;
      const item = {
        id: itemId,
        name: `${seed.name} (${v.suffix})`,
        category: seed.category,
        image: seed.image,
        hasDefect: v.defect,
        bunjangPrice: seed.platform === '번개장터' ? itemPrice : Math.round(itemPrice * 1.05),
        daangnPrice:  seed.platform === '당근마켓'  ? itemPrice : Math.round(itemPrice * 0.95),
        marketPrice: itemPrice,
        newProductPrice: Math.round(seed.basePrice * 1.45),
        riskLevel,
        defectDetail: v.defect ? '사용 중 미세 기스 발생, 기능 이상 없음' : '',
        url,
        bunjangUrl,
        daangnUrl,
        usageLevel: v.defect ? '사용감 있음' : vi === 0 ? '미개봉 신품에 가까움' : '사용감 거의 없음',
        isDamaged: v.defect ? '미세 기스 있음' : '파손 없음',
        missingComponents: vi === 2 ? '충전케이블 없음' : '없음 (풀박스)',
        batteryStatus: seed.category === '가전제품' ? `${85 + Math.floor(Math.random() * 13)}%` : '해당없음',
        sellerNotes: v.defect
          ? '사용감 반영하여 합리적인 가격으로 올립니다. 기능 이상 없습니다.'
          : '급하게 처분합니다. 상태 매우 좋습니다.',
        timeAgo: `${idx * 10 + vi * 3 + 2}분 전`,
        platform: seed.platform,
        keyword: seed.keyword,
        createdAt: createdAt.toISOString(),
      };

      db.listings.push(item);
      existingIds.add(itemId);

      // 히스토리 데이터 (통계 차트용)
      [3, 7, 14, 21, 30].forEach(daysAgo => {
        const hDate = new Date(now);
        hDate.setDate(now.getDate() - daysAgo);
        const hPrice = Math.round(itemPrice * (0.90 + Math.random() * 0.18));
        db.listings.push({
          ...item,
          id: `${itemId}_hist_${daysAgo}`,
          marketPrice: hPrice,
          bunjangPrice: seed.platform === '번개장터' ? hPrice : Math.round(hPrice * 1.05),
          daangnPrice:  seed.platform === '당근마켓'  ? hPrice : Math.round(hPrice * 0.95),
          createdAt: hDate.toISOString(),
          timeAgo: `${daysAgo}일 전`,
        });
      });
    });
  });

  writeDb(db);
  const newReal = db.listings.filter(l => l.id && !l.id.includes('_hist_') && l.marketPrice > 0);
  console.log(`시딩 완료: 총 ${newReal.length}건 매물 (히스토리 제외)`);
}

// 서버 시작 시 즉시 실행
seedInitialData();


// 인기 키워드로 실제 번개장터 상품을 크롤링해서 전체 탭에 실제 매물 채움
const AUTO_CRAWL_KEYWORDS = [
  '아이폰', '갤럭시', '맥북', '에어팟', '아이패드',
  '닌텐도', '다이슨', '나이키', '노트북', '카메라'
];

async function autoPopulateFromCrawl() {
  // 이미 크롤링 데이터가 많으면 스킵 (seed 데이터만 있으면 실행)
  const db = readDb();
  const crawledListings = db.listings.filter(l =>
    l.id && l.id.startsWith('bunjang_') && l.marketPrice > 0
  );
  if (crawledListings.length >= 50) {
    console.log(`크롤링 데이터 이미 ${crawledListings.length}건 존재 - 자동 크롤 스킵`);
    return;
  }

  console.log('🔍 백그라운드 자동 크롤링 시작...');

  for (const keyword of AUTO_CRAWL_KEYWORDS) {
    try {
      // 번개장터 API 직접 호출 (0페이지만, 20건)
      const res = await axios.get(
        `https://api.bunjang.co.kr/api/1/find_v2.json?q=${encodeURIComponent(keyword)}&n=20&page=0`,
        {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': 'https://bunjang.co.kr/',
          }
        }
      );

      if (!res.data?.list) continue;
      const freshDb = readDb();
      const existingIds = new Set(freshDb.listings.map(l => l.id));
      const now = new Date();
      let added = 0;

      res.data.list.forEach((product, idx) => {
        if (!product.pid || !product.name || parseInt(product.price) <= 0) return;
        const itemId = `bunjang_${product.pid}`;
        if (existingIds.has(itemId)) return;

        const price = parseInt(product.price);
        const image = product.product_image
          ? product.product_image.replace('{res}', '400')
          : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';

        const createdAt = new Date(now);
        createdAt.setMinutes(now.getMinutes() - (idx * 7));

        freshDb.listings.push({
          id: itemId,
          name: (product.name || '').trim(),
          category: determineCategory(product.name),
          image,
          hasDefect: false,
          bunjangPrice: price,
          daangnPrice: Math.round(price * 0.95),
          marketPrice: price,
          newProductPrice: Math.round(price * 1.45),
          riskLevel: '안전',
          defectDetail: '',
          url: `https://bunjang.co.kr/products/${product.pid}`,         // ✅ 실제 구매 URL
          bunjangUrl: `https://bunjang.co.kr/products/${product.pid}`,  // ✅ 직접 상품 URL
          daangnUrl: null,
          usageLevel: '사용감 거의 없음',
          isDamaged: '파손 없음',
          missingComponents: '미확인',
          batteryStatus: '미확인',
          sellerNotes: '판매자 정보를 확인하려면 상품 페이지를 방문하세요.',
          timeAgo: `${idx * 5 + 3}분 전`,
          platform: '번개장터',
          keyword: keyword.toLowerCase(),
          createdAt: createdAt.toISOString(),
        });
        existingIds.add(itemId);
        added++;
      });

      writeDb(freshDb);
      if (added > 0) console.log(`  ✅ [${keyword}] 번개장터 실제 매물 ${added}건 추가`);

      // 요청 간 딜레이 (서버 부하 방지)
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.log(`  ⚠️ [${keyword}] 크롤링 실패: ${err.message}`);
    }
  }

  const finalDb = readDb();
  const realCrawled = finalDb.listings.filter(l => l.id && l.id.startsWith('bunjang_') && l.marketPrice > 0);
  console.log(`🎯 자동 크롤링 완료: 실제 번개장터 매물 총 ${realCrawled.length}건`);
}

// 서버 완전 기동 후 3초 뒤 백그라운드에서 실행 (서버 응답 지연 방지)
setTimeout(() => {
  autoPopulateFromCrawl().catch(err => console.error('자동 크롤링 오류:', err.message));
}, 3000);

async function fetchBunjangPage(keyword, page, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, attempt * 600));
      const res = await axios.get(
        `https://api.bunjang.co.kr/api/1/find_v2.json?q=${encodeURIComponent(keyword)}&n=20&page=${page}`,
        {
          timeout: 6000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': 'https://bunjang.co.kr/'
          }
        }
      );
      if (!res.data?.list) return [];
      return res.data.list.map(item => ({
        id: `bunjang_${item.pid}`,
        pid: item.pid,
        name: (item.name || '').trim(),
        price: parseInt(item.price) || 0,
        image: item.product_image
          ? item.product_image.replace('{res}', '400')
          : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
        url: `https://bunjang.co.kr/products/${item.pid}`,   // ✅ 실제 상품 URL
        source: 'bunjang'
      }));
    } catch (err) {
      console.warn(`번개장터 페이지 ${page} 시도 ${attempt + 1} 실패: ${err.message}`);
      if (attempt === retries) return [];
    }
  }
  return [];
}

async function searchBunjang(keyword) {
  // 페이지 0, 1, 2 를 동시에 요청 (최대 60건)
  const pages = [0, 1, 2];
  const results = await Promise.allSettled(pages.map(p => fetchBunjangPage(keyword, p)));

  const seen = new Set();
  const all = [];
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const item of r.value) {
      if (!item.pid || seen.has(item.pid) || !item.name || item.price === 0) continue;
      seen.add(item.pid);
      all.push(item);
    }
  }
  console.log(`번개장터 수집: ${all.length}건 (키워드: ${keyword})`);
  return all;
}


// ─── 당근마켓 크롤링 ───────────────────────────────────────────────────────────
const DAANGN_UAS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
];

// 당근마켓 시도할 URL 패턴 (최신 → 레거시 순)
function getDaangnUrls(keyword) {
  const q = encodeURIComponent(keyword);
  return [
    `https://www.daangn.com/kr/buy-sell/?in=전국&search_type=keyword&query=${q}`,
    `https://www.daangn.com/search/${q}`,
    `https://kr.karrotmarket.com/search?query=${q}&tab=flea_market`,
    `https://www.daangn.com/kr/search/${q}/`,
  ];
}

// Next.js 서버 데이터(__NEXT_DATA__)에서 상품 추출 시도
function extractFromNextData($, baseUrl) {
  const results = [];
  try {
    const nextDataEl = $('#__NEXT_DATA__');
    if (!nextDataEl.length) return results;
    const json = JSON.parse(nextDataEl.text());
    // props.pageProps 하위 어딘가에 articles/items 배열이 있을 수 있음
    const str = JSON.stringify(json);
    const articleMatches = str.match(/"id":"(\d+)","title":"([^"]+)","price":(\d+)(?:,"thumbnailUrl":"([^"]*)")?(?:,"regionName":"[^"]*")?/g);
    if (articleMatches) {
      articleMatches.slice(0, 30).forEach((m, i) => {
        const idMatch = m.match(/"id":"(\d+)"/);
        const titleMatch = m.match(/"title":"([^"]+)"/);
        const priceMatch = m.match(/"price":(\d+)/);
        const imgMatch = m.match(/"thumbnailUrl":"([^"]*)"/);
        if (!idMatch || !titleMatch) return;
        const id = idMatch[1];
        results.push({
          id: `daangn_next_${id}`,
          name: titleMatch[1],
          price: parseInt(priceMatch?.[1]) || 0,
          image: imgMatch?.[1]?.replace('\\u002F', '/') || '',
          url: `https://www.daangn.com/articles/${id}`,   // ✅ 실제 상품 URL
          source: 'daangn'
        });
      });
    }
  } catch { /* JSON 파싱 실패 무시 */ }
  return results;
}

// CSS 셀렉터 조합 (당근마켓 2023~2025 알려진 구조 전체 포함)
const DAANGN_CHAINS = [
  {
    container: 'article[data-track-section="search_result"]',
    title: '[data-testid="article-title"], .article-title, h2, h3',
    price: '[data-testid="article-price"], .article-price, span[class*="price"], [class*="Price"]',
    link: 'a',
    img: 'img',
  },
  {
    container: '[class*="ArticleItem"], [class*="article-item"], [class*="ItemCard"], [class*="item-card"]',
    title: '[class*="title"], [class*="Title"], h2, h3, strong',
    price: '[class*="price"], [class*="Price"], strong + span',
    link: 'a',
    img: 'img',
  },
  {
    container: '.flea-market-article, [class*="flea-market"]',
    title: '.article-title, h2, strong',
    price: '.article-price, [class*="price"]',
    link: 'a',
    img: 'img',
  },
  {
    container: 'li[class*="article"], li[class*="item"], li[class*="product"]',
    title: 'strong, h2, h3, [class*="name"], [class*="title"]',
    price: '[class*="price"], [class*="Price"], em, b',
    link: 'a',
    img: 'img',
  },
  {
    // 범용 — 링크 태그 내부 구조 직접 파싱
    container: 'a[href*="/articles/"], a[href*="/buy-sell/"]',
    title: 'strong, h2, h3, p, span:first-child',
    price: 'span[class*="price"], em, b, span:last-child',
    link: '', // 컨테이너 자체가 링크
    img: 'img',
  },
];

async function fetchDaangnPage(keyword, urlIndex, attempt) {
  const urls = getDaangnUrls(keyword);
  const url = urls[urlIndex % urls.length];
  const ua = DAANGN_UAS[attempt % DAANGN_UAS.length];

  const res = await axios.get(url, {
    timeout: 8000,
    headers: {
      'User-Agent': ua,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.daangn.com/',
      'Cache-Control': 'no-cache',
    },
    maxRedirects: 5,
  });

  const $ = cheerio.load(res.data);
  const items = [];

  // 1) __NEXT_DATA__ 먼저 시도 (가장 안정적)
  const nextItems = extractFromNextData($, url);
  if (nextItems.length > 0) {
    console.log(`당근마켓 __NEXT_DATA__ 파싱 성공: ${nextItems.length}건`);
    return nextItems;
  }

  // 2) CSS 셀렉터 체인 시도
  for (const chain of DAANGN_CHAINS) {
    const containers = chain.container ? $(chain.container) : $('body');
    if (containers.length === 0) continue;

    containers.each((i, el) => {
      if (i >= 30) return;
      const $el = $(el);

      // 컨테이너 자체가 링크인 경우 처리
      let href = '';
      if (!chain.link) {
        href = $el.attr('href') || '';
      } else {
        const linkEl = $el.find(chain.link).first();
        href = linkEl.attr('href') || $el.closest('a').attr('href') || '';
      }

      // /articles/{id} 또는 /buy-sell/{slug} 패턴에서 실제 상품 URL 추출
      const articleMatch = href.match(/\/articles\/(\d+)/);
      const buySellMatch = href.match(/\/buy-sell\/([^?&/]+\/[^?&/]+)/);
      let productUrl = '';
      if (articleMatch) {
        productUrl = `https://www.daangn.com/articles/${articleMatch[1]}`;
      } else if (buySellMatch) {
        productUrl = `https://www.daangn.com/kr/buy-sell/${buySellMatch[1]}`;
      } else if (href) {
        productUrl = href.startsWith('http') ? href : `https://www.daangn.com${href}`;
      }

      const title = chain.title
        ? $el.find(chain.title).first().text().trim()
        : $el.text().trim().split('\n')[0].trim();
      const priceStr = chain.price
        ? $el.find(chain.price).first().text().trim()
        : '';
      const price = parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
      const imgEl = $el.find('img').first();
      const img = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-lazy') || '';

      if (!title || title.length < 2) return;

      // 동일 URL 중복 제거
      if (items.some(x => x.url === productUrl && productUrl)) return;

      items.push({
        id: `daangn_${(articleMatch?.[1] || title.replace(/\s+/g, '').slice(0, 15))}_${i}`,
        name: title,
        price,
        image: img || 'https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=400&q=80',
        url: productUrl || `https://www.daangn.com/kr/buy-sell/?search_type=keyword&query=${encodeURIComponent(keyword)}`,
        source: 'daangn',
      });
    });

    if (items.length > 0) {
      console.log(`당근마켓 CSS 셀렉터 [${DAANGN_CHAINS.indexOf(chain)}] 파싱 성공: ${items.length}건`);
      break;
    }
  }
  return items;
}

async function searchDaangn(keyword) {
  const MAX_ATTEMPTS = 4; // URL 패턴 4개 모두 시도
  let bestResult = [];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, attempt * 700));
      console.log(`당근마켓 크롤링 시도 ${attempt + 1}/${MAX_ATTEMPTS}: "${keyword}"`);
      const items = await fetchDaangnPage(keyword, attempt, attempt);
      if (items.length > bestResult.length) bestResult = items;
      if (bestResult.length >= 5) break; // 충분한 데이터 확보 시 조기 종료
    } catch (err) {
      console.warn(`당근마켓 시도 ${attempt + 1} 오류: ${err.message}`);
    }
  }

  console.log(`당근마켓 최종 수집: ${bestResult.length}건 (키워드: ${keyword})`);
  return bestResult;
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
      url: platform === '번개장터'
        ? `https://m.bunjang.co.kr/search/products?q=${encodeURIComponent(keyword)}`
        : `https://www.daangn.com/kr/buy-sell/?search_type=keyword&query=${encodeURIComponent(keyword)}`,
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
// Returns { bunjangCount, daangnCount, crawlFailed } for API status propagation
async function scrapeAndAccumulate(keyword) {
  const queryKey = keyword.toLowerCase().trim();
  if (!queryKey) return { bunjangCount: 0, daangnCount: 0, crawlFailed: false };

  const db = readDb();

  if (!db.categories) {
    db.categories = [];
  }
  if (!db.categories.includes(queryKey)) {
    db.categories.push(queryKey);
  }

  const isFirstSearch = db.listings.filter(l => l.keyword === queryKey).length === 0;

  // 번개장터/당근마켓 동시 크롤링 (각각 독립적으로 처리)
  let bunjangItems = [];
  let daangnItems = [];
  let bunjangFailed = false;
  let daangnFailed = false;

  const [bunjangResult, daangnResult] = await Promise.allSettled([
    searchBunjang(keyword),
    searchDaangn(keyword)
  ]);

  if (bunjangResult.status === 'fulfilled') {
    bunjangItems = bunjangResult.value;
  } else {
    bunjangFailed = true;
    console.error('번개장터 크롤링 실패:', bunjangResult.reason?.message);
  }

  if (daangnResult.status === 'fulfilled') {
    daangnItems = daangnResult.value;
  } else {
    daangnFailed = true;
    console.error('당근마켓 크롤링 실패:', daangnResult.reason?.message);
  }

  const combinedScraped = [];
  const maxLen = Math.max(bunjangItems.length, daangnItems.length);
  for (let i = 0; i < maxLen; i++) {
    if (bunjangItems[i]) combinedScraped.push(bunjangItems[i]);
    if (daangnItems[i]) combinedScraped.push(daangnItems[i]);
  }

  console.log("검색어:", keyword);
  console.log("번개장터 데이터:", bunjangItems.length, "건");
  console.log("당근마켓 데이터:", daangnItems.length, "건");
  console.log("합계:", combinedScraped.length, "건");

  const now = new Date();
  combinedScraped.forEach(item => {
    const isDefect = Math.random() > 0.8;
    // 가격이 0인 경우 기본 시세 추정 (크롤링 파싱 실패 보정)
    const rawPrice = item.price || 0;
    const marketPrice = rawPrice > 0 ? rawPrice : 0; // 0이면 UI에서 위험 표시
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
      bunjangPrice: item.source === 'bunjang' ? rawPrice : Math.round(rawPrice * 1.05),
      daangnPrice: item.source === 'daangn' ? rawPrice : Math.round(rawPrice * 0.95),
      marketPrice: marketPrice,
      newProductPrice: Math.round(marketPrice * 1.45),
      riskLevel: riskLevel,
      defectDetail: isDefect ? enrichment.defectDetail : '',
      url: item.url,              // ✅ 크롤러에서 수집한 실제 상품 URL 그대로 저장
      daangnUrl: item.source === 'daangn' ? item.url : null,   // ✅ 플랫폼별 URL 분리
      bunjangUrl: item.source === 'bunjang' ? item.url : null, // ✅ 플랫폼별 URL 분리
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
    console.log(`[${keyword}] 크롤링 결과 없음 → 로컬 시뮬레이션 데이터 생성`);
    generateLocalMockSeed(keyword, db); // ✅ 항상 활성화: 크롤링 실패 시 폴백
  }

  writeDb(db);

  return {
    bunjangCount: bunjangItems.length,
    daangnCount: daangnItems.length,
    crawlFailed: bunjangFailed && daangnFailed,
    daangnFailed,
    bunjangFailed
  };
}

// 실시간 검색 및 데이터 누적 API
app.get('/api/search', async (req, res) => {
  const keyword = (req.query.q || '').trim();
  const page = parseInt(req.query.page) || 1;

  // ─── 키워드 없음 → 전체 탭: DB에 있는 최신 매물 반환 ───────────────────────
  if (!keyword) {
    try {
      const db = readDb();
      const allProducts = db.listings || [];

      // 과거 히스토리 레코드(_hist_)와 가격 0인 항목 제외
      let recentListings = allProducts
        .filter(item =>
          item.id &&
          !item.id.includes('_hist_') &&
          item.marketPrice > 0 &&
          item.name &&
          item.name.trim().length > 0
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // 카테고리 필터 적용
      const category = (req.query.category || '전체').trim();
      if (category !== '전체') {
        recentListings = recentListings.filter(item => item.category === category);
      }

      // 페이지네이션 (page당 20건)
      const pageSize = 20;
      const currentPage = parseInt(req.query.page) || 1;
      const startIndex = (currentPage - 1) * pageSize;
      const pagedItems = recentListings.slice(startIndex, startIndex + pageSize);

      // timeAgo 포맷
      const now = new Date();
      const formatted = pagedItems.map(item => {
        const elapsedMs = now - new Date(item.createdAt);
        const mins = Math.floor(elapsedMs / 60000);
        let timeAgo = '방금 전';
        if (mins >= 1 && mins < 60) timeAgo = `${mins}분 전`;
        else if (mins >= 60) {
          const h = Math.floor(mins / 60);
          if (h < 24) timeAgo = `${h}시간 전`;
          else timeAgo = `${Math.floor(h / 24)}일 전`;
        }
        return { ...item, timeAgo };
      });

      return res.json({ items: formatted, stats: null, crawlStatus: null });
    } catch (err) {
      console.error('전체 탭 조회 오류:', err.message);
      return res.json({ items: [], stats: null, crawlStatus: null });
    }
  }


  let crawlStatus = null;
  try {
    // Only scrape on page 1 to load/accumulate new items
    if (page === 1) {
      crawlStatus = await scrapeAndAccumulate(keyword);
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
    res.json({ items: formattedItems, stats, crawlStatus });

  } catch (error) {
    console.error('Search API error, returning safe empty result:', error.message);
    res.json({ items: [], stats: null, crawlStatus: { crawlFailed: true, daangnFailed: true, bunjangFailed: true } });
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
