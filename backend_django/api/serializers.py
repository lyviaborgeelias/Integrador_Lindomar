from rest_framework import serializers
from .models import (Usuario, Responsavel, Local, Ambiente, Microcontrolador, Sensor, Historico)

class ResponsavelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Responsavel
        fields = "__all__"

class LocalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Local
        fields = "__all__"

class AmbienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ambiente
        fields = "__all__"

class MicrocontroladorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Microcontrolador
        fields = "__all__"

class SensorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sensor
        fields = "__all__"

class HistoricoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Historico
        fields = "__all__"
    
    def validate(self, attrs):
        sensor = attrs["sensor"]

        if not sensor.status:
            raise serializers.ValidationError("Não é permitido registrar medições para sensor inativo.")
        if not sensor.mic.status:
            raise serializers.ValidationError("Não é permitido registrar medições para microcontrolador inativo.")
        return attrs

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ["id", "username", "email", "tipo", "telefone"]