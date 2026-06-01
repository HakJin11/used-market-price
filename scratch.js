import axios from 'axios';
import * as cheerio from 'cheerio';

async function testDaangn() {
  try {
    const res = await axios.get('https://www.daangn.com/search/맥북');
    const $ = cheerio.load(res.data);
    const items = [];
    $('.flea-market-article').each((i, el) => {
      if (i >= 5) return;
      items.push({
        name: $(el).find('.article-title').text().trim(),
        price: $(el).find('.article-price').text().trim(),
      });
    });
    console.log('Daangn:', items.length > 0 ? items : 'Failed to find items. Checking HTML...');
  } catch(e) { console.error('Daangn error', e.message); }
}

async function testBunjang() {
  try {
    const res = await axios.get('https://api.bunjang.co.kr/api/1/find_v2.json?q=맥북&n=5');
    console.log('Bunjang:', res.data.list ? res.data.list.map(i=>i.name) : 'No list');
  } catch(e) { console.error('Bunjang error', e.message); }
}

testDaangn();
testBunjang();
