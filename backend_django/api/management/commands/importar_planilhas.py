from pathlib import Path

import pandas as pd
from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import (
    Local,
    Responsavel,
    Ambiente,
    Microcontrolador,
    Sensor,
    Historico,
)


class Command(BaseCommand):
    help = "Importa as planilhas de locais, responsáveis, ambientes, microcontroladores, sensores e históricos."

    def add_arguments(self, parser):
        parser.add_argument(
            "--pasta",
            type=str,
            default="population",
            help="Pasta onde estão as planilhas .xlsx",
        )
        parser.add_argument(
            "--limpar",
            action="store_true",
            help="Apaga os dados antes de importar novamente",
        )

    def handle(self, *args, **options):
        pasta = Path(options["pasta"])
        limpar = options["limpar"]

        arquivos = {
            "locais": pasta / "01 - locais.xlsx",
            "responsaveis": pasta / "02 - responsaveis.xlsx",
            "ambientes": pasta / "03 - ambientes.xlsx",
            "microcontroladores": pasta / "04 - microcontroladores.xlsx",
            "sensores": pasta / "05-sensores.xlsx",
            "historicos": pasta / "06 - historicos.xlsx",
        }

        for nome, caminho in arquivos.items():
            if not caminho.exists():
                self.stdout.write(self.style.ERROR(f"Arquivo não encontrado: {caminho}"))
                return

        try:
            with transaction.atomic():
                if limpar:
                    self.limpar_dados()

                self.importar_locais(arquivos["locais"])
                self.importar_responsaveis(arquivos["responsaveis"])
                self.importar_ambientes(arquivos["ambientes"])
                self.importar_microcontroladores(arquivos["microcontroladores"])
                self.importar_sensores(arquivos["sensores"])
                self.importar_historicos(arquivos["historicos"])

            self.stdout.write(self.style.SUCCESS("Importação concluída com sucesso."))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Erro na importação: {e}"))
            raise

    def limpar_dados(self):
        self.stdout.write(self.style.WARNING("Apagando dados existentes..."))
        Historico.objects.all().delete()
        Sensor.objects.all().delete()
        Microcontrolador.objects.all().delete()
        Ambiente.objects.all().delete()
        Responsavel.objects.all().delete()
        Local.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("Dados apagados com sucesso."))

    def importar_locais(self, arquivo):
        df = pd.read_excel(arquivo)

        total = 0
        for index, row in df.iterrows():
            nome_local = str(row["local"]).strip()

            if not nome_local or nome_local.lower() == "nan":
                continue

            local_id = index + 1

            Local.objects.update_or_create(
                id=local_id,
                defaults={
                    "local": nome_local,
                },
            )
            total += 1

        self.stdout.write(self.style.SUCCESS(f"Locais importados: {total}"))

    def importar_responsaveis(self, arquivo):
        df = pd.read_excel(arquivo)

        total = 0
        for index, row in df.iterrows():
            nome = str(row["responsavel"]).strip()

            if not nome or nome.lower() == "nan":
                continue

            responsavel_id = index + 1

            Responsavel.objects.update_or_create(
                id=responsavel_id,
                defaults={
                    "nome": nome,
                },
            )
            total += 1

        self.stdout.write(self.style.SUCCESS(f"Responsáveis importados: {total}"))

    def importar_ambientes(self, arquivo):
        df = pd.read_excel(arquivo)

        total = 0
        for index, row in df.iterrows():
            local_id = int(row["local"])
            descricao = str(row["descricao"]).strip()
            responsavel_id = int(row["responsavel"])

            local = Local.objects.get(id=local_id)
            responsavel = Responsavel.objects.get(id=responsavel_id)

            ambiente_id = index + 1

            Ambiente.objects.update_or_create(
                id=ambiente_id,
                defaults={
                    "local": local,
                    "descricao": descricao,
                    "responsavel": responsavel,
                },
            )
            total += 1

        self.stdout.write(self.style.SUCCESS(f"Ambientes importados: {total}"))

    def importar_microcontroladores(self, arquivo):
        df = pd.read_excel(arquivo)

        total = 0
        for index, row in df.iterrows():
            ambiente = Ambiente.objects.get(id=int(row["ambiente"]))
            mic_id = index + 1

            Microcontrolador.objects.update_or_create(
                id=mic_id,
                defaults={
                    "modelo": str(row["modelo"]).strip(),
                    "mac_address": str(row["mac_address"]).strip(),
                    "latitude": float(row["latitude"]),
                    "longitude": float(row["longitude"]),
                    "status": bool(row["status"]),
                    "ambiente": ambiente,
                },
            )
            total += 1

        self.stdout.write(self.style.SUCCESS(f"Microcontroladores importados: {total}"))

    def importar_sensores(self, arquivo):
        df = pd.read_excel(arquivo)

        total = 0
        for index, row in df.iterrows():
            mic = Microcontrolador.objects.get(id=int(row["mic"]))
            sensor_nome = str(row["sensor"]).strip().lower()
            sensor_id = index + 1

            Sensor.objects.update_or_create(
                id=sensor_id,
                defaults={
                    "sensor": sensor_nome,
                    "unidade_med": str(row["unidade_med"]).strip(),
                    "mic": mic,
                    "status": bool(row["status"]),
                },
            )
            total += 1

        self.stdout.write(self.style.SUCCESS(f"Sensores importados: {total}"))

    def importar_historicos(self, arquivo):
        df = pd.read_excel(arquivo)

        total = 0
        for _, row in df.iterrows():
            sensor = Sensor.objects.get(id=int(row["sensor"]))

            Historico.objects.create(
                sensor=sensor,
                valor=float(row["valor"]),
                timestamp=row["timestamp"],
            )
            total += 1

        self.stdout.write(self.style.SUCCESS(f"Históricos importados: {total}"))