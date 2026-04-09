from datetime import timedelta
from django.utils import timezone
from rest_framework import viewsets, generics
from rest_framework.permissions import IsAuthenticated
from .models import (Responsavel, Local, Ambiente, Microcontrolador, Sensor, Historico)
from .serializers import (ResponsavelSerializer, LocalSerializer, AmbienteSerializer, MicrocontroladorSerializer, SensorSerializer, HistoricoSerializer)
from .permissions import IsAdminOrReadOnlyByTipo

class ResponsavelViewSet(viewsets.ModelViewSet):
    queryset = Responsavel.objects.all()
    serializer_class = ResponsavelSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnlyByTipo]

class LocalViewSet(viewsets.ModelViewSet):
    queryset = Local.objects.all()
    serializer_class = LocalSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnlyByTipo]

class AmbienteViewSet(viewsets.ModelViewSet):
    queryset = Ambiente.objects.select_related("local", "responsavel").all()
    serializer_class = AmbienteSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnlyByTipo]

class MicrocontroladorViewSet(viewsets.ModelViewSet):
    queryset = Microcontrolador.objects.select_related("ambiente").all()
    serializer_class = MicrocontroladorSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnlyByTipo]
    filterset_fields = ["modelo", "status", "ambiente"]

class SensorViewSet(viewsets.ModelViewSet):
    queryset = Sensor.objects.select_related("mic", "mic__ambiente").all()
    serializer_class = SensorSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnlyByTipo]
    filterset_fields = ["sensor", "status", "mic"]
    search_fields = ["sensor", "mic__mac_address"]
    ordering_fields = ["id"]

class HistoricoViewSet(viewsets.ModelViewSet):
    queryset = Historico.objects.select_related("sensor").all()
    serializer_class = HistoricoSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnlyByTipo]
    filterset_fields = ["sensor", "timestamp"]
    ordering_fields = ["timestamp", "valor"]

class HistoricosRecentesView(generics.ListAPIView):
    serializer_class = HistoricoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        ultimas_24h = timezone.now() - timedelta(hours=24)
        return Historico.objects.filter(timestamp__gte=ultimas_24h).order_by("-timestamp")