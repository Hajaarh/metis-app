# scribe-app

Maquette Streamlit de transcription de réunions (Gladia).

## Prérequis

- Python + `pip install -r requirements.txt`
- `ffmpeg` / `ffprobe` dans le PATH : l'audio est converti en mono avant l'envoi à Gladia
- Copier `.env.example` en `.env` et renseigner les clés

## Lancer

```
streamlit run app.py
```
