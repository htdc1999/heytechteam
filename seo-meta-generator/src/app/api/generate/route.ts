import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 1. Scrape with Playwright
    let browser;
    let textContent = '';
    try {
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {
            console.warn(`Playwright navigation timeout for ${url}, but proceeding.`);
        });
        
        textContent = await page.evaluate(() => {
            const elementsToRemove = document.querySelectorAll('script, style, noscript, nav, footer, header, iframe');
            elementsToRemove.forEach(el => el.remove());
            return document.body.innerText;
        });
    } catch (scrapeError) {
        console.error('Scraping error:', scrapeError);
        return NextResponse.json({ error: 'Failed to scrape the URL' }, { status: 500 });
    } finally {
        if (browser) await browser.close();
    }

    if (!textContent || textContent.trim().length === 0) {
        return NextResponse.json({ error: 'Could not extract content from the URL' }, { status: 400 });
    }

    // 2. Claude AI Generation
    const prompt = `
You are an expert SEO specialist. Analyze the following webpage text and perform these tasks:
1. Identify the most relevant and powerful focus keyword for this page (1-3 words).
2. Write a highly optimized SEO meta description for this page. 
Constraints for meta description:
- Maximum 155 characters.
- Proper grammar and compelling copy.
- MUST include the exact focus keyword in the first half (first 50%) of the description.

Output your result in valid JSON format ONLY, like this:
{
  "focusKeyword": "your keyword here",
  "metaDescription": "your meta description here"
}

Webpage text:
${textContent.substring(0, 15000)}
`;

    const response = await anthropic.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 300,
        system: "You are an AI that strictly outputs valid JSON.",
        messages: [
            {
                role: "user",
                content: prompt
            }
        ]
    });

    const aiText = response.content[0].type === 'text' ? response.content[0].text : '';
    
    try {
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        const result = JSON.parse(jsonMatch ? jsonMatch[0] : aiText);
        
        return NextResponse.json(result);
    } catch (parseError) {
        console.error("Failed to parse Claude response:", aiText);
        return NextResponse.json({ error: 'Failed to generate valid SEO data from content' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
