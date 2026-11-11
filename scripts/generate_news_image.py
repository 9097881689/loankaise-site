#!/usr/bin/env python3
from __future__ import annotations

"""
LoanKaise.in — 100% Logo-Free Editorial Finance News Image Generator
Generates crisp 1200x675 WebP editorial featured images with zero competitor logos.
Uses curated royalty-free financial photography + headless Chrome Devanagari typography & charts.
"""

import argparse
import hashlib
import html
import os
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
CACHE_BG_DIR = ROOT / "scripts" / "cache_bg"
CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Curated watermark-free, logo-free high-res Unsplash finance photography
CATEGORY_PHOTOS = {
    "banking-rbi": [
        "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?auto=format&fit=crop&w=1400&q=85",
        "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?auto=format&fit=crop&w=1400&q=85",
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1400&q=85",
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1400&q=85",
    ],
    "markets": [
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1400&q=85",
        "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1400&q=85",
        "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=1400&q=85",
        "https://images.unsplash.com/photo-1535320903710-d993d3d77d29?auto=format&fit=crop&w=1400&q=85",
    ],
    "loans-emi": [
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=85",
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1400&q=85",
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=85",
        "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1400&q=85",
    ],
    "personal-finance": [
        "https://images.unsplash.com/photo-1579621970795-87facc2f976d?auto=format&fit=crop&w=1400&q=85",
        "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=1400&q=85",
        "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1400&q=85",
        "https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?auto=format&fit=crop&w=1400&q=85",
    ],
    "mutual-funds": [
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=85",
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=85",
        "https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&w=1400&q=85",
    ],
    "tax-saving": [
        "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1400&q=85",
        "https://images.unsplash.com/photo-1586486855514-8c633cc6fd38?auto=format&fit=crop&w=1400&q=85",
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=85",
    ],
    "business": [
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=85",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1400&q=85",
        "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1400&q=85",
    ],
}

CATEGORY_META = {
    "banking-rbi": {"label": "बैंकिंग & RBI", "accent": "#0ea5e9", "bg": "#062c69"},
    "markets": {"label": "शेयर बाज़ार & गोल्ड", "accent": "#10b981", "bg": "#052e16"},
    "loans-emi": {"label": "लोन & EMI अपडेट", "accent": "#f59e0b", "bg": "#451a03"},
    "personal-finance": {"label": "पर्सनल फाइनेंस", "accent": "#38bdf8", "bg": "#0c4a6e"},
    "mutual-funds": {"label": "म्यूचुअल फंड & SIP", "accent": "#34d399", "bg": "#064e3b"},
    "tax-saving": {"label": "टैक्स & बचत", "accent": "#a78bfa", "bg": "#2e1065"},
    "business": {"label": "बिज़नेस & इकोनॉमी", "accent": "#fb7185", "bg": "#4c0519"},
}


def download_cached_bg(url: str) -> Path | None:
    CACHE_BG_DIR.mkdir(parents=True, exist_ok=True)
    h = hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]
    dest = CACHE_BG_DIR / f"{h}.jpg"
    if dest.exists() and dest.stat().st_size > 10_000:
        return dest
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"},
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = resp.read()
        if len(data) > 10_000:
            dest.write_bytes(data)
            return dest
    except Exception as e:
        print(f"[img-gen] BG download failed ({url}): {e}", file=sys.stderr)
    return None


def clean_source_image(source_url: str, tmp_dir: Path) -> Path | None:
    """
    If a source image URL is explicitly requested, downloads and strips outer 14%
    margins where publisher logos/banners usually sit, avoiding all third-party logos.
    """
    if not source_url or not source_url.startswith("http"):
        return None
    try:
        req = urllib.request.Request(
            source_url,
            headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
        if len(data) < 12_000:
            return None
        raw_path = tmp_dir / "raw_src.img"
        raw_path.write_bytes(data)
        im = Image.open(raw_path).convert("RGB")
        w, h = im.size
        if w < 450 or h < 250:
            return None
        # Crop out outer 14% margins to strip top/bottom/corner channel logos & banners
        crop_box = (int(w * 0.14), int(h * 0.14), int(w * 0.86), int(h * 0.86))
        im = im.crop(crop_box).resize((1200, 675), Image.Resampling.LANCZOS)
        clean_path = tmp_dir / "clean_src.jpg"
        im.save(clean_path, "JPEG", quality=90)
        return clean_path
    except Exception:
        return None


def generate_image(slug: str, title: str, category: str, output_path: Path, source_image: str = "") -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cat = category if category in CATEGORY_META else "personal-finance"
    meta = CATEGORY_META[cat]
    photos = CATEGORY_PHOTOS.get(cat, CATEGORY_PHOTOS["personal-finance"])
    idx = int(hashlib.md5(slug.encode("utf-8")).hexdigest(), 16) % len(photos)

    with tempfile.TemporaryDirectory() as tmp:
        tmp_dir = Path(tmp)
        bg_path = download_cached_bg(photos[idx])
        if bg_path is None:
            # Try another photo from pool
            for p in photos:
                bg_path = download_cached_bg(p)
                if bg_path:
                    break

        # Also check if we got a clean background; if not create gradient fallback via PIL
        bg_data_uri = ""
        if bg_path and bg_path.exists():
            import base64
            bg_b64 = base64.b64encode(bg_path.read_bytes()).decode("ascii")
            bg_data_uri = f"data:image/jpeg;base64,{bg_b64}"

        safe_title = html.escape(title.strip())
        if len(safe_title) > 95:
            safe_title = safe_title[:92].rsplit(" ", 1)[0] + "..."
        safe_label = html.escape(meta["label"])
        accent = meta["accent"]
        deep_bg = meta["bg"]

        # Build crisp 1200x675 editorial HTML card rendered via headless Chrome
        html_doc = f"""<!doctype html>
<html lang="hi">
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 1200px;
    height: 675px;
    overflow: hidden;
    position: relative;
    font-family: "Kohinoor Devanagari", "Noto Sans Devanagari", -apple-system, BlinkMacSystemFont, sans-serif;
    background: linear-gradient(135deg, {deep_bg} 0%, #091326 100%);
    color: #fff;
  }}
  .bg-photo {{
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: brightness(0.46) contrast(1.08) saturate(1.1);
  }}
  .scrim {{
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, rgba(6, 15, 36, 0.92) 0%, rgba(6, 20, 48, 0.78) 55%, rgba(6, 20, 48, 0.35) 100%);
  }}
  .accent-bar {{
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 8px;
    background: linear-gradient(90deg, #0757d5, {accent}, #10b981);
  }}
  .grid-lines {{
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 48px 48px;
  }}
  .chart-svg {{
    position: absolute;
    right: 36px;
    bottom: 24px;
    width: 440px;
    height: 240px;
    opacity: 0.35;
  }}
  .content {{
    position: relative;
    z-index: 2;
    height: 100%;
    padding: 58px 68px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }}
  .top-row {{
    display: flex;
    align-items: center;
    justify-content: space-between;
  }}
  .cat-pill {{
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.12);
    border: 1.5px solid {accent};
    color: #fff;
    padding: 10px 22px;
    border-radius: 999px;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 0.02em;
    backdrop-filter: blur(8px);
  }}
  .dot {{
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: {accent};
    box-shadow: 0 0 14px {accent};
  }}
  .brand-pill {{
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: rgba(7, 87, 213, 0.85);
    border: 1px solid rgba(255,255,255,0.28);
    padding: 10px 20px;
    border-radius: 14px;
    font-size: 21px;
    font-weight: 800;
  }}
  .rupee {{
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: #10b981;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
  }}
  .headline-box {{
    max-width: 960px;
  }}
  .headline {{
    font-size: 52px;
    line-height: 1.28;
    font-weight: 800;
    color: #ffffff;
    text-shadow: 0 4px 24px rgba(0, 0, 0, 0.55);
  }}
  .bottom-row {{
    display: flex;
    align-items: center;
    gap: 24px;
    font-size: 20px;
    color: #cbd5e1;
    font-weight: 600;
  }}
  .divider {{
    width: 80px;
    height: 5px;
    border-radius: 99px;
    background: {accent};
    margin-bottom: 22px;
  }}
</style>
</head>
<body>
  {f'<img class="bg-photo" src="{bg_data_uri}" alt="" />' if bg_data_uri else ''}
  <div class="scrim"></div>
  <div class="grid-lines"></div>
  <div class="accent-bar"></div>
  <svg class="chart-svg" viewBox="0 0 440 240" fill="none">
    <path d="M10 210 L85 165 L145 180 L225 110 L295 130 L375 45 L430 20" stroke="{accent}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 210 L85 165 L145 180 L225 110 L295 130 L375 45 L430 20 L430 235 L10 235 Z" fill="{accent}" fill-opacity="0.22"/>
    <circle cx="375" cy="45" r="8" fill="#fff"/>
    <circle cx="225" cy="110" r="6" fill="#fff"/>
  </svg>
  <div class="content">
    <div class="top-row">
      <div class="cat-pill"><span class="dot"></span><span>{safe_label}</span></div>
      <div class="brand-pill"><span class="rupee">₹</span><span>LoanKaise.in</span></div>
    </div>
    <div class="headline-box">
      <div class="divider"></div>
      <h1 class="headline">{safe_title}</h1>
    </div>
    <div class="bottom-row">
      <span>ताज़ा फाइनेंस विश्लेषण • हिंदी न्यूज़ डेस्क</span>
    </div>
  </div>
</body>
</html>"""

        html_file = tmp_dir / "card.html"
        png_file = tmp_dir / "card.png"
        html_file.write_text(html_doc, encoding="utf-8")

        if os.path.exists(CHROME_BIN):
            subprocess.run(
                [
                    CHROME_BIN,
                    "--headless=new",
                    "--disable-gpu",
                    "--no-sandbox",
                    f"--screenshot={png_file}",
                    "--window-size=1200,675",
                    f"file://{html_file}",
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=20,
            )

        if png_file.exists() and png_file.stat().st_size > 15_000:
            im = Image.open(png_file).convert("RGB")
            im.save(output_path, "WEBP", quality=85, method=6)
            return output_path

        # Fallback: Pillow clean stock crop (no competitor logos)
        if bg_path and bg_path.exists():
            im = Image.open(bg_path).convert("RGB").resize((1200, 675), Image.Resampling.LANCZOS)
            im.save(output_path, "WEBP", quality=84)
            return output_path

        # Final solid gradient fallback
        im = Image.new("RGB", (1200, 675), (7, 45, 110))
        im.save(output_path, "WEBP", quality=84)
        return output_path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--slug", required=True)
    parser.add_argument("--title", required=True)
    parser.add_argument("--category", default="personal-finance")
    parser.add_argument("--output", required=True)
    parser.add_argument("--source-image", default="")
    args = parser.parse_args()

    out = generate_image(args.slug, args.title, args.category, Path(args.output), args.source_image)
    print(str(out))


if __name__ == "__main__":
    main()
