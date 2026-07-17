#!/usr/bin/env python3
"""Scrape FAQ Q&A pairs from live Cabinet Plouton expertise pages."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

PAGES: list[tuple[str, str]] = [
    ("droit-penal", "https://www.jplouton-avocat.fr/defense-penale/droit-penal"),
    ("proces-criminel", "https://www.jplouton-avocat.fr/defense-penale/proces-criminel"),
    ("trafic-de-stupefiants", "https://www.jplouton-avocat.fr/defense-penale/trafic-de-stupefiant"),
    ("violences-conjugales-et-feminicides", "https://www.jplouton-avocat.fr/defense-penale/violences-conjugales-et-feminicides"),
    ("droit-penal-des-affaires", "https://www.jplouton-avocat.fr/defense-penale/droit-penal-des-affaires"),
    ("victimes-de-delits-ou-crimes", "https://www.jplouton-avocat.fr/indemnisation-des-victimes/victimes-de-delits-ou-crimes"),
    ("accidents-de-la-route", "https://www.jplouton-avocat.fr/indemnisation-des-victimes/accidents-de-la-route"),
    ("droit-et-accidents-du-travail", "https://www.jplouton-avocat.fr/indemnisation-des-victimes/droit-et-accidents-du-travail"),
    ("accidents-et-erreurs-medicales", "https://www.jplouton-avocat.fr/indemnisation-des-victimes/accidents-et-erreurs-medicales"),
    ("accidents-de-la-vie-courante", "https://www.jplouton-avocat.fr/indemnisation-des-victimes/accidents-de-la-vie-courante"),
    ("droit-assurances-particuliers-professionnels", "https://www.jplouton-avocat.fr/droit-des-contrats-et-des-personnes/droit-assurances-particuliers-professionnels"),
    ("defense-des-consommateurs", "https://www.jplouton-avocat.fr/droit-des-contrats-et-des-personnes/defense-des-consommateurs"),
    ("droit-de-la-famille", "https://www.jplouton-avocat.fr/droit-des-contrats-et-des-personnes/droit-de-la-famille"),
    ("divorce", "https://www.jplouton-avocat.fr/droit-des-contrats-et-des-personnes/droit-de-la-famille/avocat-divorce-bordeaux"),
]

EXTRACT_JS = """
() => {
  const faqHeading = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
    .find(h => /FAQ|Foire Aux Questions/i.test(h.textContent));
  if (!faqHeading) return { items: [], method: 'none' };

  // Wix accordion pattern (comp-mozuj2q22 question container + comp-mozuj2q5 answer)
  const wixContainers = [...document.querySelectorAll('[class*="comp-mozuj2q22-container"]')];
  if (wixContainers.length > 0) {
    const items = wixContainers.map(container => {
      const questionEl = container.querySelector('h3');
      const answerEl = container.querySelector('[class*="comp-mozuj2q5"]');
      return {
        question: questionEl?.textContent?.trim() || '',
        answer: answerEl?.textContent?.trim() || '',
      };
    }).filter(i => i.question && i.answer);
    if (items.length > 0) return { items, method: 'wix-accordion' };
  }

  // Fallback: click each h3 accordion trigger and read expanded content
  const h3Questions = [...document.querySelectorAll('h3')].filter(h => h.textContent.includes('?'));
  const items = [];

  for (const h3 of h3Questions) {
    const question = h3.textContent.trim();
    let answer = '';

    const container = h3.closest('[class*="comp-mozuj2q22-container"]')
      || h3.parentElement?.parentElement;
    if (container) {
      const answerEl = container.querySelector('[class*="comp-mozuj2q5"]')
        || [...container.children].find(c => c !== h3.parentElement && c.textContent.trim().length > 50);
      answer = answerEl?.textContent?.trim() || '';
    }

    if (!answer) {
      const clickTarget = h3.closest('button') || h3.parentElement;
      if (clickTarget) clickTarget.click();
      const panel = h3.parentElement?.nextElementSibling
        || h3.closest('[role="region"]')
        || h3.parentElement?.parentElement?.querySelector('p, div:not(:has(h3))');
      answer = panel?.textContent?.trim() || '';
    }

    if (question && answer && answer !== question) {
      items.push({ question, answer });
    }
  }

  return { items, method: 'h3-fallback' };
}
"""


def scrape_faq(page) -> list[dict[str, str]]:
    page.wait_for_load_state("networkidle", timeout=30000)
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.wait_for_timeout(1500)

    faq_heading = page.locator("h1, h2, h3, h4, h5, h6").filter(
        has_text=re.compile(r"FAQ|Foire Aux Questions", re.I)
    )
    if faq_heading.count() > 0:
        faq_heading.first.scroll_into_view_if_needed()
        page.wait_for_timeout(500)

    result = page.evaluate(EXTRACT_JS)
    items = result.get("items", [])

    return [
        {"question": item["question"], "answer": item["answer"], "sousExpertise": ""}
        for item in items
    ]


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    output_dir = repo_root / "contenu" / "faq"
    output_dir.mkdir(parents=True, exist_ok=True)

    counts: dict[str, int] = {}
    empty: list[str] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
        )
        page = context.new_page()

        for slug, url in PAGES:
            print(f"Scraping {slug}...", file=sys.stderr)
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=60000)
                items = scrape_faq(page)
            except Exception as exc:
                print(f"  ERROR: {exc}", file=sys.stderr)
                items = []

            output_path = output_dir / f"{slug}.json"
            output_path.write_text(
                json.dumps(items, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            counts[slug] = len(items)
            if len(items) == 0:
                empty.append(slug)
            print(f"  -> {len(items)} items saved to {output_path.name}", file=sys.stderr)

        browser.close()

    print("\n=== Summary ===", file=sys.stderr)
    for slug, count in counts.items():
        print(f"  {slug}: {count}", file=sys.stderr)
    if empty:
        print(f"\nPages with 0 FAQs: {', '.join(empty)}", file=sys.stderr)
    else:
        print("\nAll pages have FAQs.", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
