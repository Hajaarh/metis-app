# metis-app

Maquette Streamlit de transcription de réunions (Gladia).

## Prérequis

- Python + `pip install -r requirements.txt`
- `ffmpeg` / `ffprobe` dans le PATH : l'audio est converti en mono avant l'envoi à Gladia
- Copier `.env.example` en `.env` et renseigner les clés

## Lancer la mquette

```
cd ./maquette
streamlit run app.py
```

## Docker

```
docker compose up --build
```

- `http://localhost:8501` — maquette Streamlit
- `http://localhost:3000` — front Next.js (dev)
- `http://localhost:8000` — API FastAPI (essaie `/health`)
