from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ResponsavelViewSet, LocalViewSet, AmbienteViewSet,
    MicrocontroladorViewSet, SensorViewSet, HistoricoViewSet,
    HistoricosRecentesView
)

router = DefaultRouter()
router.register(r"responsaveis", ResponsavelViewSet)
router.register(r"locais", LocalViewSet)
router.register(r"ambientes", AmbienteViewSet)
router.register(r"microcontroladores", MicrocontroladorViewSet)
router.register(r"sensores", SensorViewSet)
router.register(r"historicos", HistoricoViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("historicos-recentes/", HistoricosRecentesView.as_view(), name="historicos-recentes"),
]

