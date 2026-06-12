"""
SEO Command Centre — Backend
Weddings By Mark (perfectweddingsbymark.uk)
Self-contained ethical SEO toolkit. No paid external APIs.
"""
from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import json
import logging
import uuid
from pathlib import Path
from datetime import datetime, timezone, date, timedelta
from typing import List, Optional, Dict, Any
from urllib.parse import urlparse, urljoin
from collections import Counter

import httpx
from bs4 import BeautifulSoup
from pydantic import BaseModel, Field, ConfigDict

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="SEO Command Centre")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("seo")


# ---------------------------------------------------------------------------
# Static data: target locations and SEO checklist
# ---------------------------------------------------------------------------
TARGET_LOCATIONS: List[Dict[str, Any]] = [
    {"region": "Lancashire", "towns": [
        "Preston", "Blackpool", "Lancaster", "Blackburn", "Burnley", "Chorley",
        "Lytham St Annes", "Clitheroe", "Morecambe", "Fleetwood", "Accrington",
        "Ormskirk", "Skelmersdale", "Nelson", "Colne", "Darwen", "Kirkham",
        "Garstang", "Leyland",
    ]},
    {"region": "Greater Manchester", "towns": [
        "Manchester", "Stockport", "Salford", "Bolton", "Bury", "Oldham",
        "Rochdale", "Wigan", "Altrincham", "Sale", "Didsbury", "Cheadle",
        "Hale", "Ramsbottom", "Marple", "Stretford", "Worsley",
    ]},
    {"region": "Wirral", "towns": [
        "Birkenhead", "Wallasey", "Heswall", "West Kirby", "Hoylake",
        "Bebington", "Bromborough", "Neston", "Moreton", "Prenton",
    ]},
    {"region": "North Wales", "towns": [
        "Wrexham", "Conwy", "Llandudno", "Bangor", "Caernarfon", "Rhyl",
        "Prestatyn", "Colwyn Bay", "Mold", "Ruthin", "Holyhead",
        "Betws-y-Coed", "Abergele", "Denbigh", "Llangollen", "Beaumaris",
    ]},
    {"region": "Staffordshire", "towns": [
        "Stafford", "Stoke-on-Trent", "Lichfield", "Tamworth",
        "Burton upon Trent", "Cannock", "Newcastle-under-Lyme", "Leek",
        "Uttoxeter", "Rugeley", "Stone", "Biddulph",
    ]},
]

SEO_TASKS = [
    # Technical
    {"id": "ssl", "title": "HTTPS / SSL certificate active", "category": "Technical", "weight": 3},
    {"id": "gsc", "title": "Submit sitemap.xml to Google Search Console", "category": "Technical", "weight": 3},
    {"id": "robots", "title": "robots.txt configured and crawlable", "category": "Technical", "weight": 2},
    {"id": "canonical", "title": "Canonical tags on every page", "category": "Technical", "weight": 2},
    {"id": "mobile", "title": "Mobile-responsive design verified", "category": "Technical", "weight": 3},
    {"id": "compress", "title": "All images compressed (< 200KB)", "category": "Technical", "weight": 2},
    {"id": "lazy", "title": "Lazy loading on images", "category": "Technical", "weight": 1},
    {"id": "cache", "title": "Browser caching enabled", "category": "Technical", "weight": 1},
    {"id": "minify", "title": "CSS / JS minified", "category": "Technical", "weight": 1},
    {"id": "broken", "title": "Fix broken links (run audit monthly)", "category": "Technical", "weight": 2},
    # On-page
    {"id": "title-tags", "title": "Unique title tags (50-60 chars) per page", "category": "On-page", "weight": 3},
    {"id": "meta-desc", "title": "Unique meta descriptions (150-160 chars)", "category": "On-page", "weight": 3},
    {"id": "h1", "title": "Single H1 with primary keyword on every page", "category": "On-page", "weight": 3},
    {"id": "headings", "title": "Structured H2 / H3 hierarchy", "category": "On-page", "weight": 2},
    {"id": "alt", "title": "Descriptive alt text on every image", "category": "On-page", "weight": 2},
    {"id": "internal-links", "title": "Internal linking between related pages", "category": "On-page", "weight": 2},
    {"id": "slugs", "title": "Keyword-rich URL slugs", "category": "On-page", "weight": 2},
    {"id": "schema", "title": "LocalBusiness + WeddingPhotographer schema deployed", "category": "On-page", "weight": 3},
    {"id": "semantic", "title": "Semantic HTML5 throughout", "category": "On-page", "weight": 1},
    {"id": "og", "title": "Open Graph + Twitter card tags set", "category": "On-page", "weight": 2},
    # Content
    {"id": "blog-weekly", "title": "Publish 1 blog post per week", "category": "Content", "weight": 3},
    {"id": "location-pages", "title": "Create location pages for all target towns", "category": "Content", "weight": 3},
    {"id": "faq", "title": "FAQ section with FAQ schema", "category": "Content", "weight": 2},
    {"id": "testimonials", "title": "Couple testimonials with Review schema", "category": "Content", "weight": 2},
    {"id": "about", "title": "About page with E-E-A-T signals (experience, awards)", "category": "Content", "weight": 2},
    {"id": "gallery", "title": "Couples gallery with optimised alt + filenames", "category": "Content", "weight": 2},
    {"id": "venue-guides", "title": "Wedding venue guide posts (per town/region)", "category": "Content", "weight": 3},
    {"id": "seasonal", "title": "Seasonal content (e.g. 'Best autumn weddings')", "category": "Content", "weight": 1},
    {"id": "pricing", "title": "Transparent pricing / packages page", "category": "Content", "weight": 2},
    {"id": "contact", "title": "Contact page with NAP + map embed", "category": "Content", "weight": 2},
    # Local SEO
    {"id": "gbp", "title": "Google Business Profile claimed + verified", "category": "Local", "weight": 3},
    {"id": "nap", "title": "Consistent NAP across web (Name, Address, Phone)", "category": "Local", "weight": 3},
    {"id": "directories", "title": "Listed on Bridebook, Hitched, Guides For Brides", "category": "Local", "weight": 3},
    {"id": "reviews", "title": "Get 5+ Google reviews in first month", "category": "Local", "weight": 3},
    {"id": "map", "title": "Embed Google Map on contact page", "category": "Local", "weight": 1},
    {"id": "local-schema", "title": "LocalBusiness schema with geo coordinates", "category": "Local", "weight": 2},
    {"id": "yell", "title": "Yell.com listing claimed", "category": "Local", "weight": 1},
    {"id": "bing", "title": "Bing Places for Business set up", "category": "Local", "weight": 1},
    {"id": "gbp-category", "title": "GBP categories include 'Wedding Photographer'", "category": "Local", "weight": 2},
    {"id": "gbp-posts", "title": "Post weekly on Google Business Profile", "category": "Local", "weight": 2},
    # Authority
    {"id": "venue-partnerships", "title": "Backlinks from 10+ wedding venues", "category": "Authority", "weight": 3},
    {"id": "guest-posts", "title": "Guest post on wedding blogs (quarterly)", "category": "Authority", "weight": 2},
    {"id": "real-weddings", "title": "Featured in real wedding magazines", "category": "Authority", "weight": 2},
    {"id": "supplier-network", "title": "Cross-links with florists / planners / venues", "category": "Authority", "weight": 2},
    {"id": "photog-dirs", "title": "Submitted to photographer directories", "category": "Authority", "weight": 1},
    {"id": "press", "title": "Add press / 'as featured in' logos", "category": "Authority", "weight": 1},
    {"id": "review-schema", "title": "AggregateRating schema implemented", "category": "Authority", "weight": 2},
    {"id": "shareable", "title": "Create shareable assets (style guides / checklists)", "category": "Authority", "weight": 1},
    {"id": "email", "title": "Build email list (lead magnet)", "category": "Authority", "weight": 1},
    {"id": "pinterest", "title": "Pinterest profile optimised for wedding boards", "category": "Authority", "weight": 2},
]


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class AuditRequest(BaseModel):
    url: str


class AuditResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    url: str
    final_url: str
    fetched_at: str
    status_code: int
    score: int
    grade: str
    summary: Dict[str, Any]
    checks: List[Dict[str, Any]]
    recommendations: List[str]


class SchemaRequest(BaseModel):
    business_name: str = "Weddings By Mark"
    website: str = "https://perfectweddingsbymark.uk"
    description: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    postcode: Optional[str] = None
    country: str = "GB"
    price_range: str = "££"
    image_url: Optional[str] = None
    areas_served: List[str] = []
    rating_value: Optional[float] = None
    review_count: Optional[int] = None


class LocationPageRequest(BaseModel):
    town: str
    region: str
    business_name: str = "Weddings By Mark"
    website: str = "https://perfectweddingsbymark.uk"
    photographer_name: str = "Mark"


class MetaRequest(BaseModel):
    page_type: str  # home, location, gallery, about, contact, pricing, blog
    primary_keyword: str
    location: Optional[str] = None
    business_name: str = "Weddings By Mark"


class KeywordRequest(BaseModel):
    text: str
    target_keywords: List[str] = []


class CompareRequest(BaseModel):
    your_url: str
    competitor_url: str


class TaskToggle(BaseModel):
    completed: bool


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
USER_AGENT = (
    "Mozilla/5.0 (compatible; SEOCommandCentre/1.0; +https://perfectweddingsbymark.uk)"
)


def normalise_url(url: str) -> str:
    url = url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL required")
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url


async def fetch(url: str) -> Dict[str, Any]:
    """Fetch a URL and return raw + parsed data."""
    url = normalise_url(url)
    async with httpx.AsyncClient(
        timeout=20.0, follow_redirects=True, headers={"User-Agent": USER_AGENT}
    ) as cx:
        r = await cx.get(url)
        html = r.text
        soup = BeautifulSoup(html, "lxml")

        # Also try robots.txt + sitemap.xml on the same host
        parsed = urlparse(str(r.url))
        base = f"{parsed.scheme}://{parsed.netloc}"
        robots = None
        sitemap = None
        try:
            rb = await cx.get(f"{base}/robots.txt")
            if rb.status_code == 200 and "html" not in rb.headers.get("content-type", "").lower():
                robots = rb.text[:5000]
        except Exception:
            pass
        try:
            sm = await cx.get(f"{base}/sitemap.xml")
            if sm.status_code == 200:
                sitemap = True
        except Exception:
            pass

    return {
        "status_code": r.status_code,
        "final_url": str(r.url),
        "html": html,
        "soup": soup,
        "headers": dict(r.headers),
        "robots": robots,
        "sitemap": sitemap,
        "size_bytes": len(html.encode("utf-8")),
        "base": base,
    }


def grade_for(score: int) -> str:
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    if score >= 50:
        return "E"
    return "F"


def analyse(data: Dict[str, Any]) -> Dict[str, Any]:
    soup: BeautifulSoup = data["soup"]
    final_url: str = data["final_url"]

    checks: List[Dict[str, Any]] = []
    recs: List[str] = []

    def add(label, status, detail, points, max_points, category="On-page"):
        checks.append({
            "label": label, "status": status, "detail": detail,
            "points": points, "max": max_points, "category": category,
        })

    # HTTPS
    is_https = final_url.startswith("https://")
    add("HTTPS / SSL", "pass" if is_https else "fail",
        "Site loaded over HTTPS" if is_https else "Site is not on HTTPS",
        4 if is_https else 0, 4, "Technical")
    if not is_https:
        recs.append("Enable HTTPS — Google treats HTTPS as a ranking signal.")

    # Title
    title_tag = soup.find("title")
    title_text = title_tag.get_text(strip=True) if title_tag else ""
    tlen = len(title_text)
    if tlen == 0:
        add("Title tag", "fail", "Missing <title>", 0, 6, "On-page")
        recs.append("Add a unique <title> tag (50-60 characters) with your primary keyword.")
    elif 30 <= tlen <= 65:
        add("Title tag", "pass", f"{tlen} chars — '{title_text}'", 6, 6, "On-page")
    else:
        add("Title tag", "warn",
            f"{tlen} chars — aim for 50-60. '{title_text[:80]}'",
            3, 6, "On-page")
        recs.append(f"Adjust title length to 50-60 chars (currently {tlen}).")

    # Meta description
    md = soup.find("meta", attrs={"name": re.compile("^description$", re.I)})
    md_text = (md.get("content") or "").strip() if md else ""
    mlen = len(md_text)
    if mlen == 0:
        add("Meta description", "fail", "Missing meta description", 0, 5, "On-page")
        recs.append("Add a meta description (150-160 chars) with a clear call-to-action.")
    elif 120 <= mlen <= 170:
        add("Meta description", "pass", f"{mlen} chars", 5, 5, "On-page")
    else:
        add("Meta description", "warn",
            f"{mlen} chars — aim for 150-160", 3, 5, "On-page")
        recs.append(f"Tweak meta description to 150-160 chars (currently {mlen}).")

    # H1
    h1s = soup.find_all("h1")
    if len(h1s) == 0:
        add("H1 heading", "fail", "No H1 found", 0, 5, "On-page")
        recs.append("Add a single H1 containing your primary keyword.")
    elif len(h1s) == 1:
        h1_text = h1s[0].get_text(strip=True)
        add("H1 heading", "pass", f"'{h1_text[:80]}'", 5, 5, "On-page")
    else:
        add("H1 heading", "warn", f"{len(h1s)} H1 tags — should be exactly 1", 2, 5, "On-page")
        recs.append(f"Reduce H1 count to 1 (currently {len(h1s)}).")

    # H2 structure
    h2_count = len(soup.find_all("h2"))
    if h2_count >= 2:
        add("Heading hierarchy", "pass", f"{h2_count} H2 sections", 3, 3, "On-page")
    else:
        add("Heading hierarchy", "warn", f"Only {h2_count} H2 — add more structure", 1, 3, "On-page")
        recs.append("Break content into clear H2 sections to help Google understand topics.")

    # Canonical
    can = soup.find("link", rel=lambda v: v and "canonical" in v)
    if can and can.get("href"):
        add("Canonical URL", "pass", can.get("href"), 3, 3, "Technical")
    else:
        add("Canonical URL", "fail", "Missing canonical link", 0, 3, "Technical")
        recs.append("Add <link rel='canonical'> to each page to avoid duplicate content issues.")

    # Viewport (mobile)
    vp = soup.find("meta", attrs={"name": "viewport"})
    if vp:
        add("Mobile viewport", "pass", vp.get("content", ""), 4, 4, "Technical")
    else:
        add("Mobile viewport", "fail", "No viewport meta tag", 0, 4, "Technical")
        recs.append("Add <meta name='viewport' content='width=device-width, initial-scale=1'>.")

    # Open Graph
    og = soup.find_all("meta", attrs={"property": re.compile("^og:")})
    if len(og) >= 4:
        add("Open Graph tags", "pass", f"{len(og)} OG tags found", 3, 3, "On-page")
    elif og:
        add("Open Graph tags", "warn", f"{len(og)} OG tags — add og:title, description, image, url", 1, 3, "On-page")
        recs.append("Complete Open Graph tags (og:title, og:description, og:image, og:url).")
    else:
        add("Open Graph tags", "fail", "No OG tags found", 0, 3, "On-page")
        recs.append("Add Open Graph tags for better social sharing.")

    # Twitter card
    tw = soup.find("meta", attrs={"name": re.compile("twitter:card")})
    if tw:
        add("Twitter card", "pass", tw.get("content", ""), 2, 2, "On-page")
    else:
        add("Twitter card", "warn", "Missing twitter:card", 0, 2, "On-page")

    # Images alt
    imgs = soup.find_all("img")
    no_alt = [i for i in imgs if not (i.get("alt") or "").strip()]
    if not imgs:
        add("Image ALT text", "warn", "No images on page", 0, 5, "On-page")
    elif len(no_alt) == 0:
        add("Image ALT text", "pass", f"All {len(imgs)} images have alt", 5, 5, "On-page")
    else:
        pct = round(100 * (len(imgs) - len(no_alt)) / len(imgs))
        pts = round(5 * pct / 100)
        add("Image ALT text", "warn" if pct >= 50 else "fail",
            f"{len(no_alt)} of {len(imgs)} images missing alt ({pct}% covered)",
            pts, 5, "On-page")
        recs.append(f"Add descriptive alt text to {len(no_alt)} images.")

    # Schema / structured data
    ld = soup.find_all("script", type="application/ld+json")
    types_found = []
    for s in ld:
        try:
            j = json.loads(s.string or "{}")
            if isinstance(j, list):
                for item in j:
                    if isinstance(item, dict) and "@type" in item:
                        types_found.append(item["@type"])
            elif isinstance(j, dict):
                if "@type" in j:
                    types_found.append(j["@type"])
                if "@graph" in j:
                    for item in j["@graph"]:
                        if isinstance(item, dict) and "@type" in item:
                            types_found.append(item["@type"])
        except Exception:
            pass

    types_str = ", ".join(str(t) for t in types_found) if types_found else "none"
    if any("Photographer" in str(t) or "LocalBusiness" in str(t) for t in types_found):
        add("Structured data (JSON-LD)", "pass", f"Found: {types_str}", 6, 6, "On-page")
    elif types_found:
        add("Structured data (JSON-LD)", "warn", f"Found {types_str} — add LocalBusiness/Photographer", 3, 6, "On-page")
        recs.append("Add LocalBusiness + Photographer schema (use the Schema Generator).")
    else:
        add("Structured data (JSON-LD)", "fail", "No JSON-LD schema detected", 0, 6, "On-page")
        recs.append("Add LocalBusiness + Photographer JSON-LD schema — biggest single fix for local SEO.")

    # robots.txt
    if data["robots"]:
        add("robots.txt", "pass", "Present and readable", 2, 2, "Technical")
    else:
        add("robots.txt", "warn", "Not found at /robots.txt", 0, 2, "Technical")
        recs.append("Add a robots.txt file (allow crawling, link to sitemap.xml).")

    # sitemap.xml
    if data["sitemap"]:
        add("sitemap.xml", "pass", "Present at /sitemap.xml", 3, 3, "Technical")
    else:
        add("sitemap.xml", "fail", "Not found at /sitemap.xml", 0, 3, "Technical")
        recs.append("Create sitemap.xml and submit it to Google Search Console.")

    # lang
    html_tag = soup.find("html")
    lang = (html_tag.get("lang") if html_tag else "") or ""
    if lang:
        add("HTML lang attribute", "pass", lang, 1, 1, "Technical")
    else:
        add("HTML lang attribute", "warn", "Missing <html lang=…>", 0, 1, "Technical")

    # favicon
    favicon = soup.find("link", rel=lambda v: v and "icon" in v)
    if favicon:
        add("Favicon", "pass", favicon.get("href", "set"), 1, 1, "Technical")
    else:
        add("Favicon", "warn", "Missing favicon link", 0, 1, "Technical")

    # Page weight
    kb = data["size_bytes"] / 1024
    if kb <= 1024:
        add("Page weight (HTML)", "pass", f"{kb:.1f} KB", 2, 2, "Technical")
    elif kb <= 2048:
        add("Page weight (HTML)", "warn", f"{kb:.1f} KB — trim where possible", 1, 2, "Technical")
        recs.append(f"Page HTML is {kb:.0f}KB — consider trimming embedded CSS/JS.")
    else:
        add("Page weight (HTML)", "fail", f"{kb:.1f} KB — too heavy", 0, 2, "Technical")
        recs.append(f"Page HTML is {kb:.0f}KB — split into smaller chunks.")

    # Word count
    body_text = soup.get_text(" ", strip=True)
    words = len(re.findall(r"\b\w+\b", body_text))
    if words >= 300:
        add("Content length", "pass", f"{words} words", 3, 3, "Content")
    elif words >= 150:
        add("Content length", "warn", f"{words} words — aim 300+", 1, 3, "Content")
        recs.append(f"Add more content — {words} words is thin. Aim for 300+.")
    else:
        add("Content length", "fail", f"Only {words} words", 0, 3, "Content")
        recs.append(f"Page has only {words} words — add substantial content.")

    # Internal links
    parsed = urlparse(final_url)
    host = parsed.netloc
    internal = 0
    external = 0
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:"):
            continue
        absolute = urljoin(final_url, href)
        if urlparse(absolute).netloc == host:
            internal += 1
        else:
            external += 1
    if internal >= 5:
        add("Internal linking", "pass", f"{internal} internal links", 3, 3, "On-page")
    else:
        add("Internal linking", "warn", f"Only {internal} internal links", 1, 3, "On-page")
        recs.append("Add more internal links between related pages (e.g. gallery → location pages).")

    # Compute totals
    total_points = sum(c["points"] for c in checks)
    total_max = sum(c["max"] for c in checks)
    score = round(100 * total_points / total_max) if total_max else 0

    summary = {
        "title": title_text,
        "title_length": tlen,
        "meta_description": md_text,
        "meta_description_length": mlen,
        "h1_count": len(h1s),
        "h2_count": h2_count,
        "image_count": len(imgs),
        "images_missing_alt": len(no_alt),
        "internal_links": internal,
        "external_links": external,
        "word_count": words,
        "schemas_found": types_found,
        "has_robots": bool(data["robots"]),
        "has_sitemap": bool(data["sitemap"]),
        "https": is_https,
        "page_size_kb": round(kb, 1),
    }

    return {
        "score": score,
        "grade": grade_for(score),
        "summary": summary,
        "checks": checks,
        "recommendations": recs,
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"app": "SEO Command Centre", "owner": "Weddings By Mark"}


@api_router.get("/dashboard")
async def dashboard():
    # latest audit
    latest = await db.audits.find_one({}, {"_id": 0}, sort=[("fetched_at", -1)])
    history = await db.audits.find({}, {"_id": 0, "id": 1, "url": 1, "score": 1,
                                        "grade": 1, "fetched_at": 1}
                                   ).sort("fetched_at", -1).to_list(10)

    # tasks progress
    completed = await db.tasks_completed.find({}, {"_id": 0}).to_list(1000)
    completed_ids = {t["task_id"] for t in completed if t.get("completed")}
    total_weight = sum(t["weight"] for t in SEO_TASKS)
    done_weight = sum(t["weight"] for t in SEO_TASKS if t["id"] in completed_ids)
    completion_pct = round(100 * done_weight / total_weight) if total_weight else 0

    # streak (consecutive days with a checked task)
    streak = 0
    if completed:
        dates = sorted({c["completed_on"][:10] for c in completed if c.get("completed_on")}, reverse=True)
        today = date.today()
        for i, d_str in enumerate(dates):
            d = datetime.strptime(d_str, "%Y-%m-%d").date()
            if (today - d).days == i:
                streak += 1
            else:
                break

    by_category = {}
    for t in SEO_TASKS:
        cat = t["category"]
        by_category.setdefault(cat, {"total": 0, "done": 0})
        by_category[cat]["total"] += 1
        if t["id"] in completed_ids:
            by_category[cat]["done"] += 1

    return {
        "latest_audit": latest,
        "audit_history": history,
        "completion_pct": completion_pct,
        "tasks_done": len(completed_ids),
        "tasks_total": len(SEO_TASKS),
        "streak_days": streak,
        "by_category": by_category,
    }


@api_router.post("/audit", response_model=AuditResult)
async def run_audit(req: AuditRequest):
    try:
        data = await fetch(req.url)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Could not fetch URL: {e}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audit failed: {e}")

    result = analyse(data)
    audit = AuditResult(
        url=req.url,
        final_url=data["final_url"],
        fetched_at=datetime.now(timezone.utc).isoformat(),
        status_code=data["status_code"],
        score=result["score"],
        grade=result["grade"],
        summary=result["summary"],
        checks=result["checks"],
        recommendations=result["recommendations"],
    )
    doc = audit.model_dump()
    await db.audits.insert_one(doc)
    return audit


@api_router.get("/audits")
async def list_audits(limit: int = 25):
    rows = await db.audits.find({}, {"_id": 0}).sort("fetched_at", -1).to_list(limit)
    return rows


@api_router.get("/audits/{audit_id}")
async def get_audit(audit_id: str):
    row = await db.audits.find_one({"id": audit_id}, {"_id": 0})
    if not row:
        raise HTTPException(404, "Not found")
    return row


@api_router.delete("/audits/{audit_id}")
async def delete_audit(audit_id: str):
    r = await db.audits.delete_one({"id": audit_id})
    return {"deleted": r.deleted_count}


@api_router.post("/schema")
async def schema_generator(req: SchemaRequest):
    """Generate LocalBusiness + Photographer JSON-LD."""
    photographer: Dict[str, Any] = {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "additionalType": "https://schema.org/Photograph",
        "name": req.business_name,
        "url": req.website,
        "priceRange": req.price_range,
        "image": req.image_url or req.website,
    }
    if req.description:
        photographer["description"] = req.description
    if req.phone:
        photographer["telephone"] = req.phone
    if req.email:
        photographer["email"] = req.email

    address: Dict[str, Any] = {"@type": "PostalAddress", "addressCountry": req.country}
    if req.street:
        address["streetAddress"] = req.street
    if req.city:
        address["addressLocality"] = req.city
    if req.region:
        address["addressRegion"] = req.region
    if req.postcode:
        address["postalCode"] = req.postcode
    if len(address) > 2:
        photographer["address"] = address

    if req.areas_served:
        photographer["areaServed"] = [
            {"@type": "City", "name": a} for a in req.areas_served
        ]

    if req.rating_value and req.review_count:
        photographer["aggregateRating"] = {
            "@type": "AggregateRating",
            "ratingValue": req.rating_value,
            "reviewCount": req.review_count,
        }

    return {
        "json_ld": photographer,
        "script_tag": f'<script type="application/ld+json">\n{json.dumps(photographer, indent=2)}\n</script>',
    }


@api_router.get("/locations")
async def get_locations():
    return {"regions": TARGET_LOCATIONS}


@api_router.post("/location-page")
async def generate_location_page(req: LocationPageRequest):
    """Generate an SEO-optimised location page (Markdown + meta)."""
    t = req.town
    r = req.region
    n = req.business_name
    site = req.website
    title = f"Wedding Photographer in {t} | {n}"
    if len(title) > 65:
        title = f"Wedding Photographer {t} | {n}"
    meta = (
        f"Award-winning wedding photographer covering {t} and {r}. "
        f"Natural, candid wedding photography by {req.photographer_name}. "
        f"View portfolio & enquire today."
    )
    if len(meta) > 168:
        meta = meta[:165].rsplit(" ", 1)[0] + "…"

    slug = re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")
    slug = f"wedding-photographer-{slug}"

    h1 = f"Wedding Photographer in {t}"

    body = f"""# {h1}

Capturing unforgettable wedding days across **{t}** and the wider **{r}** area, {n} brings a relaxed, documentary style to every couple's story. Whether you're celebrating at a historic country house, a coastal venue, or an intimate church ceremony, {req.photographer_name} blends in to capture the real moments — the laughter, the tears, the looks only you two share.

## Why couples in {t} choose {n}

- **Local knowledge** — Mark knows the best light, hidden corners and timing tricks for {t}'s most loved venues.
- **Documentary first** — minimal posing, maximum feeling. Your day, your way.
- **Full-day coverage** — from morning prep to the first dance and beyond.
- **Beautifully edited gallery** — delivered in a private online gallery you can share with family in days, not months.
- **Trusted across {r}** — couples from all over {r} have trusted Mark with their day.

## Wedding venues we love in & around {t}

{n} has photographed weddings at venues right across {t} and {r}. From barn weddings to grand estates, country pubs to coastal hideaways, every venue brings its own magic. Get in touch and let's talk about your venue — chances are Mark has shot there before.

## What's included

Every {t} wedding package from {n} includes:

1. A no-pressure pre-wedding consultation
2. Full-day photographic coverage (timings to suit you)
3. Hundreds of professionally edited high-resolution images
4. A private online gallery to share with friends and family
5. Print release so you can order prints, albums and gifts anywhere

## Frequently asked questions

**How far in advance should I book a wedding photographer in {t}?**
Most {t} couples book 12-18 months ahead, especially for peak summer Saturdays. Don't worry if your date is closer though — get in touch and we'll check availability.

**Do you travel beyond {t}?**
Absolutely. {n} covers all of {r}, plus surrounding counties. Travel within the area is included.

**Can we see a full {t} wedding gallery?**
Yes — drop Mark a message and he'll send over recent full-day galleries from weddings near {t}.

## Ready to chat?

If you're getting married in **{t}** or anywhere across **{r}**, {req.photographer_name} would love to hear about your day. [Enquire now]({site}/contact) and let's start the story.
"""

    # Build per-page schema (LocalBusiness with areaServed)
    schema = {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "name": n,
        "url": f"{site}/{slug}",
        "areaServed": {"@type": "City", "name": t, "containedInPlace": {"@type": "AdministrativeArea", "name": r}},
        "serviceType": "Wedding Photography",
        "priceRange": "££",
    }

    return {
        "town": t,
        "region": r,
        "slug": slug,
        "title": title,
        "title_length": len(title),
        "meta_description": meta,
        "meta_length": len(meta),
        "h1": h1,
        "markdown": body,
        "schema_jsonld": schema,
        "schema_tag": f'<script type="application/ld+json">\n{json.dumps(schema, indent=2)}\n</script>',
    }


@api_router.post("/meta")
async def meta_optimise(req: MetaRequest):
    kw = req.primary_keyword.strip()
    loc = (req.location or "").strip()
    bn = req.business_name

    templates = {
        "home": [
            f"{kw} | {bn} – Documentary Wedding Photography",
            f"{bn} – {kw} Across the North West & Wales",
        ],
        "location": [
            f"{kw} in {loc} | {bn}" if loc else f"{kw} | {bn}",
            f"{loc} {kw} – Natural, Documentary Style | {bn}" if loc else f"{kw} | {bn}",
        ],
        "gallery": [
            f"Wedding Gallery | {bn} – Real Couples, Real Moments",
            f"Recent Weddings | {bn} {kw}",
        ],
        "about": [
            f"About {bn} | Wedding Photographer Behind the Lens",
            f"Meet Mark | {bn} – Documentary Wedding Photographer",
        ],
        "contact": [
            f"Contact {bn} | Enquire About Your {kw}",
            f"Book {bn} | {kw} Enquiries",
        ],
        "pricing": [
            f"Wedding Photography Pricing | {bn}",
            f"{bn} Packages & Pricing | {kw}",
        ],
        "blog": [
            f"{kw} | {bn} Wedding Blog",
            f"{kw} Tips & Real Weddings | {bn}",
        ],
    }
    desc_templates = {
        "home": f"Award-winning {kw.lower()} by {bn}. Natural, documentary-style coverage across Lancashire, Manchester, Wirral, North Wales & Staffordshire. View portfolio & enquire today.",
        "location": (
            f"Wedding photographer covering {loc} and the surrounding area. "
            f"Relaxed, candid {kw.lower()} by {bn}. See recent {loc} weddings and enquire today."
            if loc else
            f"{kw} by {bn}. Documentary style, natural coverage. View galleries and enquire today."
        ),
        "gallery": f"Browse real wedding galleries from {bn}. Beautiful, candid {kw.lower()} from venues across the North West and Wales.",
        "about": f"Meet the photographer behind {bn}. Documentary wedding photography, real stories, relaxed shoots. Read Mark's story and get in touch.",
        "contact": f"Get in touch with {bn} to check availability for your wedding. Quick response, friendly chat — no pressure. Enquire today.",
        "pricing": f"Transparent {kw.lower()} pricing from {bn}. Full-day packages, beautifully edited galleries, no hidden fees. View pricing & enquire.",
        "blog": f"Wedding planning tips, real weddings and inspiration from {bn}. Read the blog for venue ideas, planning advice and recent shoots.",
    }
    titles = templates.get(req.page_type, templates["home"])
    description = desc_templates.get(req.page_type, desc_templates["home"])
    if len(description) > 168:
        description = description[:165].rsplit(" ", 1)[0] + "…"

    return {
        "titles": [{"text": t, "length": len(t)} for t in titles],
        "description": {"text": description, "length": len(description)},
        "tips": [
            "Keep title under 60 chars so Google doesn't truncate it.",
            "Put primary keyword near the start of the title.",
            "Use a unique meta description per page — never duplicate.",
            "Include a soft call-to-action (Enquire, View, Discover).",
        ],
    }


STOPWORDS = set("""a an the and or but if while of for to with on in at by from as is are was were be been being this that these those it its i you he she they we them us our your their my his her not no do does did have has had can could should would shall will may might must about into over under up down out so very then than once just only also too more most some any all""".split())


@api_router.post("/keyword-density")
async def keyword_density(req: KeywordRequest):
    text = re.sub(r"<[^>]+>", " ", req.text)
    words = re.findall(r"[a-zA-Z][a-zA-Z'-]+", text.lower())
    total = len(words)
    if total == 0:
        return {"total_words": 0, "single": [], "bigrams": [], "trigrams": [], "targets": []}

    filtered = [w for w in words if w not in STOPWORDS and len(w) > 2]
    singles = Counter(filtered).most_common(15)
    bigrams = Counter(zip(words, words[1:])).most_common(50)
    bigrams = [(" ".join(b), c) for b, c in bigrams if not (b[0] in STOPWORDS and b[1] in STOPWORDS)][:15]
    trigrams = Counter(zip(words, words[1:], words[2:])).most_common(80)
    trigrams = [(" ".join(t), c) for t, c in trigrams if not all(w in STOPWORDS for w in t)][:15]

    def density(count: int) -> float:
        return round(100 * count / total, 2)

    target_results = []
    text_lower = " ".join(words)
    for kw in req.target_keywords:
        kwl = kw.lower().strip()
        if not kwl:
            continue
        count = text_lower.count(kwl)
        d = density(count * len(kwl.split()))
        status = "good" if 0.5 <= d <= 3.0 else ("low" if d < 0.5 else "high")
        target_results.append({"keyword": kw, "count": count, "density": d, "status": status})

    return {
        "total_words": total,
        "unique_words": len(set(filtered)),
        "single": [{"term": w, "count": c, "density": density(c)} for w, c in singles],
        "bigrams": [{"term": w, "count": c, "density": density(c * 2)} for w, c in bigrams],
        "trigrams": [{"term": w, "count": c, "density": density(c * 3)} for w, c in trigrams],
        "targets": target_results,
    }


@api_router.post("/compare")
async def compare(req: CompareRequest):
    try:
        a_data, b_data = await _safe_fetch(req.your_url), await _safe_fetch(req.competitor_url)
    except Exception as e:
        raise HTTPException(502, str(e))
    a = analyse(a_data)
    b = analyse(b_data)
    return {
        "your": {"url": req.your_url, "final_url": a_data["final_url"], "score": a["score"],
                 "grade": a["grade"], "summary": a["summary"]},
        "competitor": {"url": req.competitor_url, "final_url": b_data["final_url"], "score": b["score"],
                       "grade": b["grade"], "summary": b["summary"]},
    }


async def _safe_fetch(url: str):
    return await fetch(url)


@api_router.get("/tasks")
async def list_tasks():
    completed = await db.tasks_completed.find({}, {"_id": 0}).to_list(1000)
    done_map = {t["task_id"]: t for t in completed}
    items = []
    for t in SEO_TASKS:
        d = done_map.get(t["id"])
        items.append({
            **t,
            "completed": bool(d and d.get("completed")),
            "completed_on": d.get("completed_on") if d else None,
        })
    return {"tasks": items}


@api_router.post("/tasks/{task_id}/toggle")
async def toggle_task(task_id: str, body: TaskToggle):
    if not any(t["id"] == task_id for t in SEO_TASKS):
        raise HTTPException(404, "Unknown task")
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.tasks_completed.update_one(
        {"task_id": task_id},
        {"$set": {
            "task_id": task_id,
            "completed": body.completed,
            "completed_on": now_iso if body.completed else None,
        }},
        upsert=True,
    )
    return {"task_id": task_id, "completed": body.completed, "completed_on": now_iso if body.completed else None}


@api_router.get("/regions/coverage-plan")
async def coverage_plan():
    """Returns a 30-day rollout plan for the location pages."""
    plan = []
    day = 1
    for region in TARGET_LOCATIONS:
        for town in region["towns"]:
            plan.append({
                "day": day,
                "region": region["region"],
                "town": town,
                "slug": f"wedding-photographer-{re.sub(r'[^a-z0-9]+', '-', town.lower()).strip('-')}",
                "title": f"Wedding Photographer in {town} | Weddings By Mark"[:65],
            })
            day += 1
    return {"plan": plan, "total_pages": len(plan)}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db():
    client.close()
