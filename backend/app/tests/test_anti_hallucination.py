from app.tests.verification import elements_inventes, est_ancre_dans_le_transcript


TRANSCRIPT = (
    "Intervenant A: On propose le pack annuel a cinq mille euros. "
    "Intervenant B: D'accord, Julien va envoyer le contrat pour signature."
)


def test_intitule_ancre_dans_le_transcript_est_valide():
    assert est_ancre_dans_le_transcript("envoyer le contrat pour signature", TRANSCRIPT) is True


def test_intitule_avec_mot_invente_est_detecte():
    assert est_ancre_dans_le_transcript("envoyer le contrat avant noel", TRANSCRIPT) is False


def test_elements_inventes_liste_les_mots_absents_du_transcript():
    assert elements_inventes("envoyer le contrat avant noel", TRANSCRIPT) == {"avant", "noel"}


def test_elements_inventes_vide_si_rien_n_est_invente():
    assert elements_inventes("envoyer le contrat", TRANSCRIPT) == set()


def test_elements_inventes_ignore_les_differences_d_accent():
    assert elements_inventes("les tarifs affiches", "les tarifs affiches sur le site") == set()
    assert elements_inventes("les tarifs affichés", "les tarifs affiches sur le site") == set()
