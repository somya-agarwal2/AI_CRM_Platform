import requests
from app import create_app
from app.models import Journey, db

app = create_app()
with app.app_context():
    journeys = Journey.query.all()
    for j in journeys:
        print(f"Activating {j.name}")
        requests.post(f"http://localhost:5000/api/journeys/{j.id}/activate")
