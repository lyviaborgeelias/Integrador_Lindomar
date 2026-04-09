from django.db import models
from django.contrib.auth.models import AbstractUser

class Usuario(AbstractUser):
    TIPO_CHOICES = (
        ("ADMIN", "Administrador"),
        ("USER", "Usuário"),
    )

    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default="USER")
    telefone = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.username
    
class Responsavel(models.Model):
    nome = models.CharField(max_length=150)

    def __str__(self):
        return self.nome
    
class Local(models.Model):
    local = models.CharField(max_length=150, unique=True)

    def __str__(self):
        return self.local

class Ambiente(models.Model):
    local = models.ForeignKey(Local, on_delete=models.CASCADE, related_name="ambientes")
    descricao = models.CharField(max_length=200)
    responsavel = models.ForeignKey(Responsavel, on_delete=models.CASCADE, related_name="ambientes")

    def __str__(self):
        return self.descricao

class Microcontrolador(models.Model):
    MODELO_CHOICES = (
        ("ESP32", "ESP32"),
        ("ESP8266", "ESP8266")
    )

    modelo = models.CharField(max_length=20, choices=MODELO_CHOICES)
    mac_address = models.CharField(max_length=17, unique=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    status = models.BooleanField(default=True)
    ambiente = models.ForeignKey(Ambiente, on_delete=models.CASCADE, related_name="microcontroladores")

    def __str__(self):
        return f"{self.modelo} - {self.mac_address}"

class Sensor(models.Model):
    SENSOR_CHOICES = (
        ("temperatura", "Temperatura"),
        ("luminosidade", "Luminosidade"),
        ("umidade", "Umidade"),
        ("contador", "Contador")
    )

    UNIDADE_CHOICES = (
        ("ºC", "ºC"),
        ("%", "%"),
        ("lux", "lux"),
        ("uni", "uni")
    )

    sensor = models.CharField(max_length=20, choices=SENSOR_CHOICES)
    unidade_med = models.CharField(max_length=10, choices=UNIDADE_CHOICES)
    mic = models.ForeignKey(Microcontrolador, on_delete=models.CASCADE, related_name="sensores")
    status = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.sensor} - MIC {self.mic.id}"

class Historico(models.Model):
    sensor = models.ForeignKey(Sensor, on_delete=models.CASCADE, related_name="historicos")
    valor = models.FloatField()
    timestamp = models.DateTimeField()

    def __str__(self):
        return f"{self.sensor.sensor} - {self.valor} - {self.timestamp}"
    