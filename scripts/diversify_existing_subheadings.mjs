import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'news-posts.json');

const posts = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

let modifiedCount = 0;

for (const post of posts) {
  let content = post.content || '';
  if (!content) continue;

  const originalContent = content;
  const title = post.title || '';
  const category = post.category || 'finance';

  // 1. First Heading: Replace "पूरा मामला क्या है?"
  const topicMatch = title.split(/[:|—–-]/)[0].trim();
  const shortSubject = topicMatch.length > 40 ? topicMatch.slice(0, 38) + '...' : topicMatch;

  const firstHeadingReplacements = [
    `<h2>${shortSubject}: घटनाक्रम और इनसाइड स्टोरी</h2>`,
    `<h2>क्या है पूरा घटनाक्रम और इसकी मुख्य वजह?</h2>`,
    `<h2>फैसले और बदलाव के पीछे की पूरी कहानी</h2>`,
    `<h2>इस बड़े घटनाक्रम की विस्तृत पृष्ठभूमि</h2>`,
  ];
  const firstChoice = firstHeadingReplacements[Math.abs(hashString(title)) % firstHeadingReplacements.length];
  content = content.replace(/<h2>(?:पूरा मामला क्या है\??(?:\s*(?:\/|और)\s*[^<]*)?|क्या है पूरा मामला\??)<\/h2>/gi, firstChoice);

  // 2. Second Heading: Replace "मुख्य बातें"
  const secondHeadingReplacements = [
    `<h2>मुख्य आंकड़े, तथ्य और प्रमुख बिंदु</h2>`,
    `<h2>इस रिपोर्ट के 5 सबसे महत्वपूर्ण निष्कर्ष</h2>`,
    `<h2>डेटा और आंकड़ों की नज़र से अहम बातें</h2>`,
    `<h2>मुख्य खुलासे और बाज़ार के तथ्य</h2>`,
  ];
  const secondChoice = secondHeadingReplacements[(Math.abs(hashString(title)) + 1) % secondHeadingReplacements.length];
  content = content.replace(/<h2>(?:मुख्य बातें(?:\s*\([^)]*\))?|Key Highlights)<\/h2>/gi, secondChoice);

  // 3. Third Heading: Replace "आम आदमी... असर"
  let thirdChoice = `<h2>निवेशकों और आम जनता के लिए इसका क्या मतलब है?</h2>`;
  if (category === 'loans-emi' || /लोन|emi|महंगाई|ब्याज/i.test(title)) {
    thirdChoice = `<h2>आपकी EMI, होम लोन और मासिक बजट पर कितना असर?</h2>`;
  } else if (category === 'markets' || /शेयर|बाज़ार|स्टॉक|nifty|sensex|nvidia/i.test(title)) {
    thirdChoice = `<h2>शेयर बाज़ार, रिटेल निवेशकों और पोर्टफोलियो पर असर</h2>`;
  } else if (category === 'banking-rbi' || /rbi|bank|बैंक|खाता/i.test(title)) {
    thirdChoice = `<h2>बैंक ग्राहकों और खाताधारकों की जेब पर सीधा प्रभाव</h2>`;
  } else if (category === 'tax-saving' || /tax|टैक्स|itr/i.test(title)) {
    thirdChoice = `<h2>टैक्सपेयर्स और बचत योजनाओं पर क्या पड़ेगा प्रभाव?</h2>`;
  }
  content = content.replace(/<h2>(?:आम आदमी[^<]*पर क्या असर पड़ेगा\??|निवेशकों[^<]*असर\??)<\/h2>/gi, thirdChoice);

  // 4. Fourth Heading: Replace "आगे क्या ध्यान रखें?"
  const fourthHeadingReplacements = [
    `<h2>विशेषज्ञों की सलाह और आगे की सटीक वित्तीय रणनीति</h2>`,
    `<h2>आने वाले दिनों में क्या रणनीति अपनानी चाहिए?</h2>`,
    `<h2>ग्राहकों और निवेशकों के लिए 4 ज़रूरी सावधानियां</h2>`,
    `<h2>बाज़ार के जानकारों की राय और भविष्य का रोडमैप</h2>`,
  ];
  const fourthChoice = fourthHeadingReplacements[(Math.abs(hashString(title)) + 2) % fourthHeadingReplacements.length];
  content = content.replace(/<h2>(?:आगे क्या ध्यान रखें\??|आगे की रणनीति\??)<\/h2>/gi, fourthChoice);

  if (content !== originalContent) {
    post.content = content;
    modifiedCount++;
  }
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

if (modifiedCount > 0) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2), 'utf8');
  console.log(`Updated subheadings across ${modifiedCount} articles in data/news-posts.json.`);
} else {
  console.log('No articles needed subheadings update.');
}
