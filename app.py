import streamlit as st
from dotenv import load_dotenv

load_dotenv(override=True)

st.set_page_config(page_title="Scribe", layout="wide")

pages = {
    "Maquette": [
        st.Page("ui/page_maquette_accueil.py", title="Accueil du parcours", default=True),
        st.Page("ui/page_dictaphone.py", title="Mode dictaphone"),
        st.Page("ui/page_visio.py", title="Mode visio"),
    ],
    "Outils de test": [
        st.Page("ui/page_import.py", title="Importer une réunion"),
        st.Page("ui/page_meetings.py", title="Réunions"),
        st.Page("ui/page_benchmark.py", title="Benchmark"),
    ],
}

st.navigation(pages).run()
