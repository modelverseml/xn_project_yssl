from django.urls import path
from .views import FetchView, ListView, DetailView, VisualizationDataView,FetchPreviewView

urlpatterns = [
    path("fetch/", FetchView.as_view(), name="fetch"),
    path("list/", ListView.as_view(), name="list"),
    path("detail/<uuid:doc_id>/", DetailView.as_view(), name="detail"),
    path("visualization-data/", VisualizationDataView.as_view(), name="visualization-data"),
    path("fetch-preview/", FetchPreviewView.as_view(), name="fetch-preview"),
]
