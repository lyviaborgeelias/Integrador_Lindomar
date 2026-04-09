from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Responsavel, Local, Ambiente, Microcontrolador, Sensor, Historico

admin.site.register(Usuario, UserAdmin)
admin.site.register(Responsavel)
admin.site.register(Local)
admin.site.register(Ambiente)
admin.site.register(Microcontrolador)
admin.site.register(Sensor)
admin.site.register(Historico)