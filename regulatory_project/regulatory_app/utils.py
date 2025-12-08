import requests
from bs4 import BeautifulSoup
import re
from transformers import pipeline, AutoTokenizer
import logging

logger = logging.getLogger(__name__)

# ========== Summarization ==========
summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6", device=0)

# ========== Scraper ==========
def scrape_page_text(url, timeout=15):
    try:
        resp = requests.get(url, timeout=timeout, headers={'User-Agent': 'Mozilla/5.0'})
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        title = soup.title.get_text(strip=True) if soup.title else url
        text = soup.get_text(separator=" ", strip=True)
        text = re.sub(r"\s+", " ", text)
        return {"title": title, "text": text, "status": "ok"}
    except Exception as e:
        logger.exception("Scrape failed for %s", url)
        return {"title": None, "text": "", "status": "error", "error": str(e)}

# ========== Tagging & heuristics ==========
def generate_tags(text):
    text_l = text.lower()
    tags = []
    if any(k in text_l for k in ["copyright", "royalty", "moral rights"]):
        tags.append("Copyright")
    if any(k in text_l for k in ["broadcast", "radio", "streaming"]):
        tags.append("Broadcasting")
    if any(k in text_l for k in ["music", "socan", "licence", "license"]):
        tags.append("Music Licensing")
    if any(k in text_l for k in ["arts", "artist", "heritage"]):
        tags.append("Arts & Culture")
    if any(k in text_l for k in ["safety", "performance"]):
        tags.append("Live Performance Safety")
    if not tags:
        tags.append("General")
    return list(dict.fromkeys(tags))

def compute_severity(text, tags):
    score = 1.0
    tl = text.lower()
    if "prohibited" in tl: score += 2
    if "liable" in tl: score += 2
    if "penalty" in tl: score += 2
    if "Broadcasting" in tags: score += 1
    if "Copyright" in tags: score += 1
    return min(score, 10.0)

def compute_probability(tags):
    if "Broadcasting" in tags: return 0.75
    if "Music Licensing" in tags: return 0.70
    if "Copyright" in tags: return 0.65
    return 0.40

# ========== NER ==========
_NER_PIPELINE = None
def get_ner_pipeline():
    global _NER_PIPELINE
    if _NER_PIPELINE is None:
        _NER_PIPELINE = pipeline("ner", model="dbmdz/bert-large-cased-finetuned-conll03-english", grouped_entities=True)
    return _NER_PIPELINE

def extract_entities_hf(text, max_chars=30000):
    if not text:
        return []
    try:
        p = get_ner_pipeline()
        chunk = text[:max_chars]
        ents = p(chunk)
        return [(ent.get('word'), ent.get('entity_group')) for ent in ents]
    except Exception:
        logger.exception("NER failed")
        return []

# ========== Summarization ==========
def summarize_text(text, max_tokens=1024, chunk_size=4000, overlap=500):
    """
    Summarize very long text efficiently:
    - Splits text into overlapping chunks to avoid losing context
    - Summarizes each chunk
    - Combines summaries
    - Optionally recursively summarizes combined summary if still too long
    """
    if not text:
        return ""

    # Step size for sliding window
    step = chunk_size - overlap

    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        start += step

    # Summarize each chunk
    summaries = []
    for chunk in chunks:
        result = summarizer(chunk, max_length=max_tokens, min_length=50, do_sample=False)
        summaries.append(result[0]['summary_text'])

    # Combine chunk summaries
    combined_summary = " ".join(summaries)

    # If combined summary is still too long, summarize again recursively
    # if len(combined_summary) > chunk_size:
    #     return summarize_text_full(combined_summary, max_tokens=max_tokens, chunk_size=chunk_size, overlap=overlap)
    
    return combined_summary.strip()