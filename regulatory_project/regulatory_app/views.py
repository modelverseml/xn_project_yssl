# webapp/views.py
import os
from django.views import View
from django.http import JsonResponse, HttpResponseBadRequest
from django.shortcuts import render, get_object_or_404
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from .models import RemoteDocument
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from . import utils
from uuid import uuid4

CHUNK_THRESHOLD = 2000000  # if text > ~2MB, store to file instead of DB field


@method_decorator(csrf_exempt, name='dispatch')
class FetchPreviewView(View):
    """
    Preview fetched or user-entered text with NLP metrics computed on summarized text.
    """
    def post(self, request, *args, **kwargs):
        import json
        try:
            body = json.loads(request.body.decode())
            text = body.get("text")
            url = body.get("url", None)
        except Exception:
            return HttpResponseBadRequest("Invalid request")

        if not text and not url:
            return HttpResponseBadRequest("Provide either URL or text")

        # Fetch text from URL if provided
        if url and not text:
            result = utils.scrape_page_text(url)
            if result.get("status") != "ok":
                return JsonResponse({"error": "scrape_failed", "detail": result.get("error")}, status=400)
            text = result.get("text") or ""
            title = result.get("title") or url
        else:
            title = "User Input"

        # Summarize the text
        summarized_text = utils.summarize_text(text)

        # Compute metrics on summarized text
        tags = utils.generate_tags(summarized_text)
        entities = utils.extract_entities_hf(summarized_text)
        severity = utils.compute_severity(summarized_text, tags)
        probability = utils.compute_probability(tags)

        return JsonResponse({
            "url": url,
            "title": title,
            "text": summarized_text,
            "tags": tags,
            "entities": entities,
            "severity": severity,
            "probability": probability
        })

@method_decorator(csrf_exempt, name='dispatch')
class FetchView(View):
    """
    Save text to RemoteDocument.
    Metrics are based on summarized text.
    """
    def post(self, request, *args, **kwargs):
        import json
        try:
            body = json.loads(request.body.decode())
            text = body.get("text")
            url = body.get("url", None)
            title = body.get("title", "User Input")
        except Exception:
            return HttpResponseBadRequest("Invalid request")

        if not text:
            return HttpResponseBadRequest("No text provided")

        # Compute metrics on summarized text
        summarized_text = utils.summarize_text(text)
        tags = utils.generate_tags(summarized_text)
        severity = utils.compute_severity(summarized_text, tags)
        probability = utils.compute_probability(tags)
        entities = utils.extract_entities_hf(summarized_text)

        size = len(text.encode("utf-8"))

        # Check if document exists
        if url:
            doc, created = RemoteDocument.objects.get_or_create(url=url, defaults={'source': title})
        else:
            doc, created = RemoteDocument.objects.get_or_create(raw_text=text[:50], defaults={'source': title})

        doc.source = title
        doc.content_size = size

        if size > CHUNK_THRESHOLD:
            filename = f"fetched/{doc.id}/{uuid4().hex}.txt"
            default_storage.save(filename, ContentFile(text.encode("utf-8")))
            with default_storage.open(filename, "rb") as f:
                doc.content_file.save(os.path.basename(filename), f, save=False)
            doc.raw_text = None
        else:
            doc.raw_text = text
            if doc.content_file:
                doc.content_file.delete(save=False)

        # Save metrics based on summarized text
        doc.entities = entities
        doc.tags = tags
        doc.severity = severity
        doc.probability = probability
        doc.save()

        return JsonResponse({
            "id": str(doc.id),
            "url": doc.url,
            "source": doc.source,
            "tags": doc.tags,
            "severity": doc.severity,
            "probability": doc.probability,
            "created": created
        }, status=201)

class ListView(View):
    """
    GET: returns list of saved docs (paginated via ?page= & ?page_size=)
    Returns simplified content for list page: id, source, snippet, tags, severity, probability, created_at
    """
    def get(self, request, *args, **kwargs):
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("page_size", 20))
        qs = RemoteDocument.objects.all()
        total = qs.count()
        start = (page-1)*page_size
        end = start + page_size
        items = []
        for doc in qs[start:end]:
            snippet = (doc.raw_text or "")[:500]
            if not snippet and doc.content_file:
                try:
                    with doc.content_file.open("r", encoding="utf-8") as f:
                        snippet = f.read(500)
                except Exception:
                    snippet = ""
            items.append({
                "id": str(doc.id),
                "source": doc.source,
                "snippet": snippet,
                "tags": doc.tags or [],
                "severity": doc.severity,
                "probability": doc.probability,
                "created_at": doc.created_at.isoformat(),
            })
        return JsonResponse({"total": total, "page": page, "page_size": page_size, "items": items})


class DetailView(View):
    """
    GET /detail/<id>/  -> full saved document and metadata
    """
    def get(self, request, doc_id, *args, **kwargs):
        doc = get_object_or_404(RemoteDocument, pk=doc_id)
        full_text = doc.raw_text or ""
        if not full_text and doc.content_file:
            try:
                with doc.content_file.open("r", encoding="utf-8") as f:
                    full_text = f.read()
            except Exception:
                full_text = ""
        return JsonResponse({
            "id": str(doc.id),
            "url": doc.url,
            "source": doc.source,
            "text": full_text,
            "entities": doc.entities or [],
            "tags": doc.tags or [],
            "severity": doc.severity,
            "probability": doc.probability,
            "created_at": doc.created_at.isoformat(),
        })


class VisualizationDataView(View):
    """
    GET: return aggregated data needed for frontend visualizations:
      - source_counts
      - tags_by_source matrix
      - severity/probability points
      - word frequencies (for wordcloud)
      - timeline severity series
      - network edges (for network graph)
    """
    def get(self, request, *args, **kwargs):
        from collections import Counter, defaultdict
        docs = RemoteDocument.objects.all()
        source_counts = Counter(d.source for d in docs)
        # tags by source
        tags_by_source = defaultdict(Counter)
        severity_points = []
        all_texts = []
        timeline = []
        network_nodes = []
        network_edges = []
        for idx, d in enumerate(docs):
            src = d.source or d.url
            tags = d.tags or []
            for t in tags:
                tags_by_source[src][t] += 1
                network_edges.append({"reg": f"Reg_{idx}", "tag": t})
            severity_points.append({"severity": d.severity or 0, "probability": d.probability or 0, "source": src})
            text = d.raw_text or ""
            if not text and d.content_file:
                try:
                    with d.content_file.open("r", encoding="utf-8") as f:
                        text = f.read(20000)
                except Exception:
                    text = ""
            all_texts.append(text)
            timeline.append({"index": idx, "severity": d.severity or 0})
            network_nodes.append({"id": f"Reg_{idx}", "label": src, "type": "regulation"})
        # simple word frequency from all_texts
        from collections import Counter
        import re
        words = re.findall(r"\w{3,}", " ".join(all_texts).lower())
        word_freq = Counter(words).most_common(200)

        return JsonResponse({
            "source_counts": dict(source_counts),
            "tags_by_source": {k: dict(v) for k, v in tags_by_source.items()},
            "severity_points": severity_points,
            "word_freq": word_freq,
            "timeline": timeline,
            "network_edges": network_edges,
            "network_nodes": network_nodes,
        })
