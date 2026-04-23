py -m venv env
env\scripts\activate
pip install -r requirements.txt
py manage.py makemigrations
py manage.py migrate
py manage.py createsuperuser

-- Para importar os dados dos arquivos xlsx --
python manage.py importar_planilhas
-- Se quiser limpar e importar tudo de novo --
python manage.py importar_planilhas --limpar

superusuario: senai
senha: 123

usuario padrao: usuario1
senha: 123

nome do banco: api_smart
