import re
import unicodedata

MOTS_VIDES = {
    "le", "la", "les", "de", "des", "du", "un", "une", "et", "a", "au", "aux",
    "en", "pour", "sur", "avec", "que", "qui", "est", "sont", "ce", "cette",
    "ces", "on", "il", "elle", "d", "l", "va", "ete",
}


def sans_accents(texte: str) -> str:
    decompose = unicodedata.normalize("NFKD", texte)
    return "".join(caractere for caractere in decompose if not unicodedata.combining(caractere))


def mots_significatifs(texte: str) -> set:
    mots = re.findall(r"[a-z]+", sans_accents(texte.lower()))
    return {mot for mot in mots if mot not in MOTS_VIDES and len(mot) > 2}


def elements_inventes(texte_produit: str, transcript_source: str) -> set:
    return mots_significatifs(texte_produit) - mots_significatifs(transcript_source)


def est_ancre_dans_le_transcript(texte_produit: str, transcript_source: str) -> bool:
    return len(elements_inventes(texte_produit, transcript_source)) == 0
