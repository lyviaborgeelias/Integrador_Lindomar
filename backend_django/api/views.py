from datetime import timedelta
from django.utils import timezone
from rest_framework import viewsets, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Responsavel, Local, Ambiente, Microcontrolador, Sensor, Historico
from .serializers import (
    UsuarioSerializer,
    ResponsavelSerializer,
    LocalSerializer,
    AmbienteSerializer,
    MicrocontroladorSerializer,
    SensorSerializer,
    HistoricoSerializer,
)
from .permissions import IsAdminOrReadOnlyByTipo


class MeView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UsuarioSerializer

    def get(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class ResponsavelViewSet(viewsets.ModelViewSet):
    queryset = Responsavel.objects.all().order_by("id")
    serializer_class = ResponsavelSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnlyByTipo]
    search_fields = ["nome"]
    ordering_fields = ["id", "nome"]


class LocalViewSet(viewsets.ModelViewSet):
    queryset = Local.objects.all().order_by("id")
    serializer_class = LocalSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnlyByTipo]
    search_fields = ["local"]
    ordering_fields = ["id", "local"]


class AmbienteViewSet(viewsets.ModelViewSet):
    queryset = Ambiente.objects.select_related("local", "responsavel").all().order_by("id")
    serializer_class = AmbienteSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnlyByTipo]
    filterset_fields = ["local", "responsavel"]
    search_fields = ["descricao", "local__local", "responsavel__nome"]
    ordering_fields = ["id", "descricao"]


class MicrocontroladorViewSet(viewsets.ModelViewSet):
    queryset = Microcontrolador.objects.select_related("ambiente").all().order_by("id")
    serializer_class = MicrocontroladorSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnlyByTipo]
    filterset_fields = ["modelo", "status", "ambiente"]
    search_fields = ["modelo", "mac_address", "ambiente__descricao"]
    ordering_fields = ["id", "modelo", "mac_address"]


class SensorViewSet(viewsets.ModelViewSet):
    queryset = Sensor.objects.select_related("mic", "mic__ambiente").all().order_by("id")
    serializer_class = SensorSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnlyByTipo]
    filterset_fields = ["sensor", "status", "mic"]
    search_fields = ["sensor", "mic__mac_address", "mic__ambiente__descricao"]
    ordering_fields = ["id", "sensor"]



class HistoricoViewSet(viewsets.ModelViewSet):
    queryset = Historico.objects.select_related(
        "sensor", "sensor__mic", "sensor__mic__ambiente"
    ).all().order_by("-timestamp")
    serializer_class = HistoricoSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnlyByTipo]
    filterset_fields = ["sensor"]
    search_fields = ["sensor__sensor", "sensor__mic__ambiente__descricao"]
    ordering_fields = ["timestamp", "valor", "id"]

    def get_queryset(self):
        queryset = super().get_queryset()

        data_inicio = self.request.query_params.get("data_inicio")
        data_fim = self.request.query_params.get("data_fim")
        sensor = self.request.query_params.get("sensor")
        status_sensor = self.request.query_params.get("status_sensor")
        horas = self.request.query_params.get("horas")

        if sensor:
            queryset = queryset.filter(sensor_id=sensor)

        if horas:
            try:
                horas = int(horas)
                limite = timezone.now() - timedelta(hours=horas)
                queryset = queryset.filter(timestamp__gte=limite)
            except ValueError:
                pass
        else:
            if data_inicio:
                queryset = queryset.filter(timestamp__date__gte=data_inicio)

            if data_fim:
                queryset = queryset.filter(timestamp__date__lte=data_fim)

        if status_sensor in ["true", "false"]:
            queryset = queryset.filter(sensor__status=(status_sensor == "true"))

        return queryset