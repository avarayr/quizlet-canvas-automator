import cheerio from 'cheerio';
import clipboard from 'clipboardy';
import express from 'express';
import fetch from 'node-fetch';
import { compareTwoStrings } from 'string-similarity';
const app = express();

app.use(express.json());
// cors
// Access-Control-Allow-Headers header
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, sentry-trace'
  );

  next();
});

async function getURLs(question: string): Promise<Set<string>> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(
    `"${question}" site:quizlet.com`
  )}`;
  // set headers to mimick a real browser
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      dnt: '1',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'Upgrade-Insecure-Requests': '1',
    },
  });

  const html = await response.text();

  // link format
  // <a data-testid="result-title-a" class="result__a js-result-title-link" rel="noopener" href="https://quizlet.com/593330470/mis-380-all-quiz-questions-flash-cards/">MIS 380 - All Quiz Questions Flashcards | Quizlet</a>
  // extract the href
  const regex = /href="([^"]+)"/gi;
  // find all matches
  const matches: Set<string> = new Set();
  let match: RegExpExecArray;

  while ((match = regex.exec(html))) {
    const href = match[1];
    if (href.startsWith('https://quizlet.com/')) {
      matches.add(href);
    }
  }
  if (matches.size === 0) {
    console.log('no matches');
    console.log(html);
  }

  return matches;
}

function cleanString(question: string) {
  let clean = question.replace(/[^\w\s]/gi, '');
  // remove all whitespace
  clean = clean.replace(/\s/g, '');
  return clean.toLowerCase().trim();
}
async function waitFor(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function getAnswer(question: string) {
  // remove all punctuation and whitespace from the question
  const cleanQuestion = cleanString(question);

  const urls = await getURLs(question);
  for (const url of urls) {
    const response = await fetch(url);
    const text = await response.text();
    clipboard.writeSync(text);
    const $ = cheerio.load(text);
    const allElements = $('.SetPageTerms-term');
    const comparisons = [];
    for (const element of allElements) {
      const terms = $(element).find('.TermText');
      const [definition, answer] = terms;
      const definitionText = $(definition).text();
      const answerText = $(answer).text();
      // remove all punctuation from the definition
      const cleanDefinition = cleanString(definitionText);
      const similarity = compareTwoStrings(cleanDefinition, cleanQuestion);
      comparisons.push({
        definition: definitionText,
        answer: answerText,
        similarity,
      });
    }
    if (comparisons.length > 0) {
      comparisons.sort((a, b) => b.similarity - a.similarity);
      const bestMatch = comparisons[0];
      console.log(comparisons.slice(0, 3));
      if (bestMatch.similarity > 0.6) {
        return bestMatch.answer;
      }
    }
    waitFor(1000);
    console.log('waiting...');
  }
  console.log('no matches');
  return '';
}

app.get('/api/getAnswer', async (req, res) => {
  const { question } = req.query;
  if (!question || typeof question !== 'string') {
    res.status(400).send('question is required');
    return;
  }
  const answer = await getAnswer(question);
  res.json({ answer });
});

app.listen(8080, () => {
  console.log('Listening on port 8080');
  console.log('http://localhost:8080/api/getAnswer');
});
