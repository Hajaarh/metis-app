import streamlit as st
from dotenv import load_dotenv

load_dotenv()

st.set_page_config(page_title="Scribe", layout="wide")

pages = [
    st.Page("ui/page_import.py", title="Importer une réunion", default=True),
    st.Page("ui/page_meetings.py", title="Réunions"),
    st.Page("ui/page_benchmark.py", title="Benchmark"),
]

st.navigation(pages).run()
