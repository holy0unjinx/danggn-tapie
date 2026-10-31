"""Extract the visible saved pages, product data, and local CSS/images."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote
import json
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
SEARCH_HTML = ROOT / "당근 중고거래.html"
SEARCH_FILES = ROOT / "당근 중고거래_files"
ARTICLE_HTML = next(ROOT.glob("*NT370E5L*.html"))
ARTICLE_FILES = next(ROOT.glob("*NT370E5L*_files"))
DATA = ROOT / "data"
PUBLIC_SNAPSHOT = ROOT / "public" / "snapshot"
PUBLIC_ARTICLE = ROOT / "public" / "article"

BUY_SELL_HREF = re.compile(
    r'href="https://www\.daangn\.com/kr/buy-sell/([^"]+)"'
)
SCRIPT = re.compile(r"<script\b[^>]*>.*?</script>", re.S | re.I)
NOSCRIPT = re.compile(r"<noscript\b[^>]*>.*?</noscript>", re.S | re.I)
SRCSET = re.compile(r'\s+srcset="[^"]*"')
SIZES = re.compile(r'\s+sizes="[^"]*"')


def article_id(slug):
    slug = unquote(slug).split("?")[0].split("#")[0].rstrip("/")
    slug = slug.rsplit("/", 1)[-1]
    return slug.rsplit("-", 1)[-1]


def rewrite_app_urls(html, *, files_from, files_to):
    html = html.replace(files_from, files_to)
    html = html.replace("https://www.daangn.com/kr/buy-sell/?q=", "/?q=")
    html = re.sub(
        r'href="https://www\.daangn\.com/kr/buy-sell/[^"]*#main-content"',
        'href="#main-content"',
        html,
    )

    def buy_sell(match):
        return f'href="/article/{article_id(match.group(1))}"'

    html = BUY_SELL_HREF.sub(buy_sell, html)
    html = html.replace("https://www.daangn.com/kr/search/buy-sell/?q=", "/?q=")
    html = html.replace("https://www.daangn.com/kr/search/buy-sell/?in=", "/?in=")
    html = html.replace(
        "https://www.daangn.com/kr/search/buy-sell/?category_id=",
        "/?category_id=",
    )
    html = html.replace("https://www.daangn.com/kr/search/buy-sell/", "/")
    html = html.replace("/kr/search/buy-sell/?q=", "/?q=")
    html = html.replace("/kr/search/buy-sell/?in=", "/?in=")
    html = html.replace("/kr/search/buy-sell/", "/")
    html = html.replace('href="https://www.daangn.com/kr/"', 'href="/"')
    html = SRCSET.sub("", html)
    html = SIZES.sub("", html)
    html = html.replace('href="/article/"', 'href="#main-content"')
    html = internalize_links(html)
    html = strip_ads(html)
    return html


KEEP_LINK = re.compile(
    r'https?://(?:www\.)?(?:youtube\.com|instagram\.com|facebook\.com)/',
    re.I,
)


def internalize_links(html):
    def href(match):
        url = match.group(1)
        if url.startswith('mailto:'):
            return match.group(0)
        if KEEP_LINK.match(url.replace('&amp;', '&')):
            return match.group(0)
        return 'href="/"'

    html = re.sub(r'href="(https?://[^"]+)"', href, html)
    html = re.sub(
        r'value="https?://(?:www\.)?(?:daangn\.com|karrotmarket\.com)[^"]*"',
        'value="/"',
        html,
    )
    return html


def strip_ads(html):
    html = re.sub(r'<div class="_4y5lbri[^"]*"[^>]*></div>', '', html)
    start = html.find('혹시 이 상품 찾으시나요?')
    related = html.find('근처 인기 중고거래')
    if start != -1 and related != -1 and start < related:
        section = html.rfind('<div class="_4y5lbrn', 0, start)
        heading = html.rfind('<section', 0, related)
        if section != -1 and heading != -1 and section < heading:
            html = html[:section] + html[heading:]
    html = re.sub(
        r'<div class="sprinkles_display_none_base__1byufe822 sprinkles_display_block_medium__1byufe828"><button class="hz29bu0[^"]*"[^>]*>당근 앱에서 보기</button></div>',
        '',
        html,
    )
    return html


class Styles(HTMLParser):
    def __init__(self, prefix):
        super().__init__()
        self.prefix = prefix
        self.names = []

    def handle_starttag(self, tag, attrs):
        if tag != "link":
            return
        values = dict(attrs)
        href = values.get("href", "")
        if values.get("rel") == "stylesheet" and href.startswith(self.prefix):
            self.names.append(href.rsplit("/", 1)[-1])


def copy_dir_files(source, dest, suffixes):
    dest.mkdir(parents=True, exist_ok=True)
    copied = 0
    for path in source.iterdir():
        if path.suffix.lower() in suffixes:
            shutil.copy2(path, dest / path.name)
            copied += 1
    return copied


def text(html, pattern, default=""):
    match = re.search(pattern, html, re.S)
    return re.sub(r"<[^>]+>", "", match.group(1)).strip() if match else default


def parse_search_products(markup):
    products = []
    for card in re.findall(r'<li class="_1k4kfb2">(.*?)</li>', markup, re.S):
        href = re.search(r'href="([^"]+)"', card)
        if not href:
            continue
        target = href.group(1)
        pid = target.rstrip("/").rsplit("/", 1)[-1]
        title = text(card, r'ntyo5jk[^>]*>([^<]+)')
        price = text(card, r'ntyo5jl[^>]*>([^<]+)')
        image = re.search(r'<img[^>]+src="([^"]+)"', card)
        region = text(card, r'class="_1588g1c0">([^<]+)')
        time_el = re.search(r"<time([^>]*)>([^<]+)</time>", card)
        datetime_value = ""
        time_label = ""
        if time_el:
            datetime_match = re.search(r'datetime="([^"]+)"', time_el.group(1))
            datetime_value = datetime_match.group(1) if datetime_match else ""
            time_label = time_el.group(2)
        products.append(
            {
                "id": pid,
                "title": title,
                "price": price,
                "image": image.group(1) if image else "",
                "images": [image.group(1)] if image else [],
                "region": region,
                "time": time_label,
                "datetime": datetime_value,
                "badge": "바로구매" if "바로구매" in card else "",
                "category": "",
                "description": "",
                "seller": None,
                "chats": 0,
                "likes": 0,
                "views": 0,
                "source": "search",
                "hasFullHtml": pid == "12ej1fz3n8r7",
            }
        )
    return products


def parse_related_products(markup, existing):
    by_id = {item["id"]: item for item in existing}
    for match in re.finditer(
        r'<a href="/article/([^"]+)" class="_4y5lbrx[^"]*"[\s\S]*?</a>',
        markup,
    ):
        pid = match.group(1).rstrip("/")
        block = match.group(0)
        title = text(block, r'f1uy1ch[^>]*>([^<]+)')
        price = text(block, r'f1uy1ci[^>]*>([^<]+)')
        region = text(
            block,
            r'seed-tag-group-item__label[^>]*>([^<]+)',
        )
        time_el = re.search(r"<time([^>]*)>([^<]+)</time>", block)
        datetime_value = ""
        time_label = ""
        if time_el:
            datetime_match = re.search(r'datetime="([^"]+)"', time_el.group(1))
            datetime_value = datetime_match.group(1) if datetime_match else ""
            time_label = time_el.group(2)
        image = re.search(r'<img[^>]+src="([^"]+)"', block)
        if not image:
            continue
        badge = ""
        if "예약중" in block:
            badge = "예약중"
        elif "판매완료" in block:
            badge = "판매완료"
        item = by_id.get(pid)
        if item:
            if not item["category"] and region:
                item.setdefault("relatedRegion", region)
            continue
        by_id[pid] = {
            "id": pid,
            "title": title,
            "price": price,
            "image": image.group(1) if image else "",
            "images": [image.group(1)] if image else [],
            "region": region,
            "time": time_label,
            "datetime": datetime_value,
            "badge": badge,
            "category": "",
            "description": "",
            "seller": None,
            "chats": 0,
            "likes": 0,
            "views": 0,
            "source": "related",
            "hasFullHtml": False,
        }
    return list(by_id.values())


def enrich_laptop(products, article_html):
    for item in products:
        if item["id"] != "12ej1fz3n8r7":
            continue
        item["category"] = "디지털기기"
        item["description"] = text(
            article_html,
            r'<p class="_4y5lbrf[^"]*">([\s\S]*?)</p>',
        )
        item["images"] = re.findall(
            r'<img class="_1wus0xp0[^"]*" src="([^"]+)"',
            article_html,
        ) or item["images"]
        if not item["images"]:
            item["images"] = re.findall(
                r'class="_1wus0xp0[^>]*>',
                article_html,
            )
        item["images"] = re.findall(
            r'<img[^>]*class="_1wus0xp0[^"]*"[^>]*src="([^"]+)"',
            article_html,
        ) or re.findall(
            r'<img[^>]*src="(/article/[^"]+\.webp)"[^>]*class="_1wus0xp0',
            article_html,
        )
        if not item["images"]:
            item["images"] = re.findall(
                r'src="(/article/(?:503e3af8|1a3d3f04|84506543|a71c8f8f|a9ddeb05|0f74474f|ce682a9d|9bd596d9|7cc93eb8)[^"]*)"',
                article_html,
            )
        seller_image = re.search(
            r'class="_1b4d5acn"[^>]*src="([^"]+)"',
            article_html,
        ) or re.search(
            r'alt="0727님의 프로필"[^>]*src="([^"]+)"',
            article_html,
        )
        item["seller"] = {
            "name": text(article_html, r'r4hjxee[^>]*>([^<]+)'),
            "region": text(
                article_html,
                r'<span class="r4hjxer[^"]*">\s*<span>([^<]+)</span>',
            ),
            "temperature": text(article_html, r'yzp7msi[^>]*>([^<]+)'),
            "image": seller_image.group(1) if seller_image else "",
        }
        chats = re.search(r"채팅 (\d+)", article_html)
        likes = re.search(r"관심 (\d+)", article_html)
        views = re.search(r"조회 (\d+)", article_html)
        item["chats"] = int(chats.group(1)) if chats else 0
        item["likes"] = int(likes.group(1)) if likes else 0
        item["views"] = int(views.group(1)) if views else 0
        item["hasFullHtml"] = True
        item["region"] = item["region"] or item["seller"].get("region", "")
    return products


search_source = SEARCH_HTML.read_text(encoding="utf-8")
search_main = search_source[
    search_source.index("<main") : search_source.index("</main>") + len("</main>")
]
search_main = SCRIPT.sub("", search_main)
search_main = rewrite_app_urls(
    search_main,
    files_from="./당근 중고거래_files/",
    files_to="/snapshot/",
)
DATA.mkdir(exist_ok=True)
(DATA / "snapshot.html").write_text(search_main, encoding="utf-8")

search_styles = Styles("./당근 중고거래_files/")
search_styles.feed(search_source[: search_source.index("<body")])

article_source = ARTICLE_HTML.read_text(encoding="utf-8")
start = article_source.index('<header class="_1463i581"')
end = article_source.rfind("</footer>") + len("</footer>")
end = article_source.index("</div>", end) + len("</div>")
article_markup = article_source[start:end]
article_markup = SCRIPT.sub("", article_markup)
article_markup = NOSCRIPT.sub("", article_markup)
article_files_prefix = "./" + ARTICLE_FILES.name + "/"
article_markup = rewrite_app_urls(
    article_markup,
    files_from=article_files_prefix,
    files_to="/article/",
)
(DATA / "article.html").write_text(article_markup, encoding="utf-8")

header_end = article_markup.index("<main")
footer_start = article_markup.index("</main>") + len("</main>")
(DATA / "article-header.html").write_text(
    article_markup[:header_end], encoding="utf-8"
)
(DATA / "article-footer.html").write_text(
    article_markup[footer_start:], encoding="utf-8"
)

article_styles = Styles(article_files_prefix)
article_styles.feed(article_source[: article_source.index("<body")])
unique_article_styles = [
    name for name in article_styles.names if name not in search_styles.names
]
(DATA / "styles.json").write_text(
    json.dumps(search_styles.names, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
(DATA / "article-styles.json").write_text(
    json.dumps(unique_article_styles, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)

copy_dir_files(SEARCH_FILES, PUBLIC_SNAPSHOT, {".css", ".webp", ".png", ".jpg", ".jpeg", ".gif", ".woff", ".woff2"})
copied_article = copy_dir_files(
    ARTICLE_FILES,
    PUBLIC_ARTICLE,
    {".css", ".webp", ".png", ".jpg", ".jpeg", ".gif"},
)

products = parse_search_products(search_main)
products = enrich_laptop(products, article_markup)
products = parse_related_products(article_markup, products)
# Re-run laptop image extraction after rewrite
for item in products:
    if item["id"] != "12ej1fz3n8r7":
        continue
    images = re.findall(
        r'<img[^>]*src="(/article/[^"]+)"[^>]*class="_1wus0xp0',
        article_markup,
    )
    if not images:
        images = re.findall(
            r'<img class="_1wus0xp0[^"]*" src="([^"]+)"',
            article_markup,
        )
    if not images:
        images = [
            src
            for src in re.findall(r'<img[^>]+src="(/article/[^"]+)"', article_markup)
            if "64a3bb12" not in src and not src.endswith("/B.webp") and "/B(" not in src
            and "img_app_download" not in src
        ]
        # keep first 9 carousel images
        images = images[:9]
    item["images"] = images
    if images:
        item["image"] = images[0]
    seller_image = re.search(
        r'class="_1b4d5acn"[^>]*src="([^"]+)"',
        article_markup,
    ) or re.search(
        r'src="(/article/64a3bb12[^"]+)"',
        article_markup,
    )
    if seller_image:
        item["seller"]["image"] = seller_image.group(1)

(DATA / "articles.json").write_text(
    json.dumps(products, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)

print(
    f"search {len(search_main)} chars, "
    f"article {len(article_markup)} chars, "
    f"{len(search_styles.names)} search css, "
    f"{len(unique_article_styles)} article css, "
    f"{copied_article} article files, "
    f"{len(products)} products"
)
