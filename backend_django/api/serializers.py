from rest_framework import serializers
from .models import Usuario, Responsavel, Local, Ambiente, Microcontrolador, Sensor, Historico


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ["id", "username", "email", "tipo", "telefone"]


class ResponsavelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Responsavel
        fields = "__all__"


class LocalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Local
        fields = "__all__"


class AmbienteSerializer(serializers.ModelSerializer):
    local_nome = serializers.CharField(source="local.local", read_only=True)
    responsavel_nome = serializers.CharField(source="responsavel.nome", read_only=True)

    class Meta:
        model = Ambiente
        fields = ["id", "local", "local_nome", "descricao", "responsavel", "responsavel_nome"]


class MicrocontroladorSerializer(serializers.ModelSerializer):
    ambiente_descricao = serializers.CharField(source="ambiente.descricao", read_only=True)

    class Meta:
        model = Microcontrolador
        fields = [
            "id",
            "modelo",
            "mac_address",
            "latitude",
            "longitude",
            "status",
            "ambiente",
            "ambiente_descricao",
        ]

class SensorSerializer(serializers.ModelSerializer):
    mic_mac_address = serializers.CharField(source="mic.mac_address", read_only=True)
    mic_modelo = serializers.CharField(source="mic.modelo", read_only=True)
    ambiente_descricao = serializers.CharField(source="mic.ambiente.descricao", read_only=True)

    class Meta:
        model = Sensor
        fields = [
            "id",
            "sensor",
            "unidade_med",
            "mic",
            "mic_modelo",
            "mic_mac_address",
            "ambiente_descricao",
            "status",
        ]

class HistoricoSerializer(serializers.ModelSerializer):
    sensor_nome = serializers.CharField(source="sensor.sensor", read_only=True)
    unidade_med = serializers.CharField(source="sensor.unidade_med", read_only=True)
    mic_id = serializers.IntegerField(source="sensor.mic.id", read_only=True)
    ambiente_descricao = serializers.CharField(source="sensor.mic.ambiente.descricao", read_only=True)

    class Meta:
        model = Historico
        fields = [
            "id",
            "sensor",
            "sensor_nome",
            "unidade_med",
            "mic_id",
            "ambiente_descricao",
            "valor",
            "timestamp",
        ]

    def validate(self, attrs):
        sensor = attrs["sensor"]

        if not sensor.status:
            raise serializers.ValidationError("Não é permitido registrar medições para sensor inativo.")

        if not sensor.mic.status:
            raise serializers.ValidationError("Não é permitido registrar medições para microcontrolador inativo.")

        return attrs