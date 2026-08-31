import { Callout, Disclaimer, H2, LegalPage, LegalTable, PlainLi, SrcLi } from "@/app/legal/_helpers";

export default function EntreprisesPage() {
  return (
    <LegalPage
      title="Notice à destination des entreprises clientes"
      subtitle="Vos obligations en tant que responsable de traitement"
    >
      <H2>1. Qui est responsable de quoi</H2>
      <p className="text-[12.5px] text-foreground/70 leading-relaxed">
        Cette répartition n&apos;est pas un choix contractuel : elle découle de la définition légale du responsable
        de traitement, qui est celui qui décide des finalités et des moyens.
      </p>
      <LegalTable
        headers={["", "Votre entreprise", "Métis"]}
        rows={[
          [
            <strong key="r1a">Rôle</strong>,
            <span key="r1b" className="text-foreground">Responsable de traitement</span>,
            <span key="r1c" className="text-foreground">Sous-traitant</span>,
          ],
          [
            <strong key="r2a">Fondement</strong>,
            <span key="r2b" className="text-foreground">RGPD art. 4.7</span>,
            <span key="r2c" className="text-foreground">RGPD art. 4.8 et art. 28</span>,
          ],
          [
            <strong key="r3a">Décide</strong>,
            <span key="r3b" className="text-foreground">Pourquoi et comment les réunions sont enregistrées, qui y a accès, combien de temps les données sont conservées</span>,
            <span key="r3c" className="text-foreground">Ne décide rien,traite les données sur votre instruction documentée</span>,
          ],
          [
            <strong key="r4a">Doit</strong>,
            <span key="r4b" className="text-foreground">Choisir la base légale, informer les salariés, consulter le CSE, tenir le registre, réaliser l&apos;analyse d&apos;impact</span>,
            <span key="r4c" className="text-foreground">Fournir un outil conforme, sécuriser les données, documenter ses traitements, supprimer ou restituer les données en fin de contrat</span>,
          ],
        ]}
      />

      <H2>2. Pourquoi vous ne pouvez pas vous appuyer sur le consentement de vos salariés</H2>
      <p className="text-[13px] text-foreground leading-relaxed">
        Le RGPD exige que le consentement soit libre. Or, entre un employeur et un salarié, il existe un lien
        de subordination : le salarié n&apos;est pas réellement libre de refuser une demande de son employeur sans
        craindre de conséquence.
      </p>
      <p className="text-[13px] text-foreground leading-relaxed">
        Le RGPD qualifie cette situation de déséquilibre manifeste et considère qu&apos;un consentement obtenu dans
        ce contexte n&apos;est pas un fondement juridique valable.
      </p>
      <ul className="space-y-2">
        <SrcLi src="RGPD art. 4.11" desc="le consentement doit être libre, spécifique, éclairé et univoque. Les quatre conditions sont cumulatives." />
        <SrcLi src="RGPD considérant 43" desc="le consentement ne constitue pas un fondement juridique valable en cas de déséquilibre manifeste entre la personne concernée et le responsable de traitement." />
      </ul>
      <Callout>
        Vous devez donc vous appuyer sur l&apos;intérêt légitime (RGPD art. 6.1.f), ce qui vous impose des
        obligations spécifiques, détaillées ci-après.
      </Callout>

      <H2>3. Ce que vous devez faire avant tout déploiement</H2>
      <ol className="space-y-4 list-decimal list-outside pl-5">
        <li className="text-[13px] text-foreground leading-relaxed">
          <strong className="text-foreground">Documenter un test de mise en balance.</strong> Vous devez démontrer
          par écrit que votre intérêt à enregistrer les réunions ne porte pas une atteinte disproportionnée aux
          droits et libertés de vos salariés. Ce document doit exister avant le déploiement.{" "}
          <span className="text-[11.5px] font-medium text-foreground/70">RGPD art. 6.1.f et art. 5.2</span>
        </li>
        <li className="text-[13px] text-foreground leading-relaxed">
          <strong className="text-foreground">Consulter le CSE. </strong> L&apos;introduction de nouvelles technologies
          et la mise en place de moyens permettant un contrôle de l&apos;activité des salariés font l&apos;objet d&apos;une
          information-consultation préalable du comité social et économique.{" "}
          <span className="text-[11.5px] font-medium text-foreground/70">Code du travail art. L2312-8 et art. L2312-38</span>
        </li>
        <li className="text-[13px] text-foreground leading-relaxed">
          <strong className="text-foreground">Informer individuellement les salariés. </strong> Aucune information
          concernant un salarié ne peut être collectée par un dispositif qui ne lui a pas été préalablement porté
          à connaissance. L&apos;information doit préciser la finalité, la base légale, les destinataires, la durée
          de conservation et les modalités d&apos;exercice des droits.{" "}
          <span className="text-[11.5px] font-medium text-foreground/70">Code du travail art. L1222-4 · RGPD art. 12 à 14</span>
        </li>
        <li className="text-[13px] text-foreground leading-relaxed">
          <strong className="text-foreground">Inscrire le traitement à votre registre. </strong> Chaque finalité
          doit y figurer : captation, transcription, analyse, rattachement client, tableau de bord.{" "}
          <span className="text-[11.5px] font-medium text-foreground/70">RGPD art. 30</span>
        </li>
        <li className="text-[13px] text-foreground leading-relaxed">
          <strong className="text-foreground">Évaluer la nécessité d&apos;une analyse d&apos;impact (AIPD). </strong> Le
          traitement combine plusieurs critères de risque,usage innovant, suivi systématique, croisement de
          données, volume potentiellement important. Deux critères suffisent à rendre l&apos;analyse obligatoire.{" "}
          <span className="text-[11.5px] font-medium text-foreground/70">RGPD art. 35 · lignes directrices CEPD du 4 octobre 2017</span>
        </li>
        <li className="text-[13px] text-foreground leading-relaxed">
          <strong className="text-foreground">Définir vos durées de conservation et les documenter. </strong>{" "}
          <span className="text-[11.5px] font-medium text-foreground/70">RGPD art. 5.1.e</span>
        </li>
      </ol>

      <H2>4. Attention particulière : les métriques de suivi individuel</H2>
      <p className="text-[13px] text-foreground leading-relaxed">
        Le tableau de bord Métis calcule la répartition du temps de parole et le suivi nominatif des actions
        par personne rattachée. Leur usage dans un contexte salarié transforme un outil de productivité en
        dispositif de contrôle de l&apos;activité. Cela renforce vos obligations : consultation préalable du CSE et
        information spécifique des salariés sur cette finalité précise.
      </p>
      <ul className="space-y-2">
        <SrcLi src="RGPD art. 4.4" desc="le profilage désigne tout traitement automatisé consistant à évaluer des aspects personnels relatifs à une personne physique, notamment son rendement au travail ou son comportement." />
        <SrcLi src="Code du travail art. L1222-4" desc="obligation d'information préalable." />
        <SrcLi src="Code du travail art. L2312-38" desc="information-consultation préalable du CSE sur les moyens ou techniques permettant un contrôle de l'activité des salariés." />
      </ul>

      <H2>5. Le rattachement d&apos;une réunion à une personne</H2>
      <p className="text-[13px] text-foreground leading-relaxed">
        Métis permet de rattacher une réunion à un client ou à une personne, puis de centraliser l&apos;ensemble
        des réunions la concernant. Une transcription diarisée seule n&apos;identifie personne. Mais regrouper toutes
        les réunions d&apos;une même personne recrée une identification indirecte par croisement, et fait naître une
        finalité nouvelle,suivre une personne dans le temps n&apos;est pas transcrire une réunion.
      </p>
      <ul className="space-y-2">
        <SrcLi src="RGPD art. 4.1" desc="est une donnée personnelle toute information se rapportant à une personne identifiée ou identifiable, directement ou indirectement." />
        <SrcLi src="RGPD considérant 26" desc="l'identification s'apprécie au regard de l'ensemble des moyens raisonnablement susceptibles d'être utilisés, y compris par croisement." />
        <SrcLi src="CJUE, arrêt Breyer, C-582/14 (19 octobre 2016)" desc="une donnée peut être personnelle dès lors qu'elle permet, par croisement, de remonter à une personne." />
        <SrcLi src="RGPD art. 4.2" desc="le simple stockage d'un lien constitue déjà un traitement." />
        <SrcLi src="RGPD art. 5.1.b" desc="chaque finalité doit être déterminée, explicite et légitime." />
      </ul>
      <Callout>
        Il vous appartient donc de définir une base légale et une durée de conservation propres à cette
        finalité de centralisation, distinctes de celles de la transcription.
      </Callout>

      <H2>6. Les droits de vos salariés</H2>
      <p className="text-[13px] text-foreground leading-relaxed">
        Vos salariés conservent l&apos;intégralité de leurs droits, y compris lorsque le traitement repose sur
        l&apos;intérêt légitime. Vous devez pouvoir y répondre sous un mois.
      </p>
      <LegalTable
        headers={["Droit", "Portée", "Source"]}
        rows={[
          [
            <strong key="d1">Information</strong>,
            <span key="p1" className="text-foreground">Être informé avant tout enregistrement</span>,
            <span key="s1" className="text-[11.5px] font-medium text-foreground/70">RGPD art. 12 à 14 · C. trav. L1222-4</span>,
          ],
          [
            <strong key="d2">Opposition</strong>,
            <span key="p2" className="text-foreground">S&apos;opposer au traitement, motif tiré de sa situation particulière,droit renforcé lorsque la base légale est l&apos;intérêt légitime</span>,
            <span key="s2" className="text-[11.5px] font-medium text-foreground/70">RGPD art. 21</span>,
          ],
          [
            <strong key="d3">Accès</strong>,
            <span key="p3" className="text-foreground">Obtenir communication des données traitées le concernant</span>,
            <span key="s3" className="text-[11.5px] font-medium text-foreground/70">RGPD art. 15</span>,
          ],
          [
            <strong key="d4">Rectification</strong>,
            <span key="p4" className="text-foreground">Faire corriger une information inexacte</span>,
            <span key="s4" className="text-[11.5px] font-medium text-foreground/70">RGPD art. 16</span>,
          ],
          [
            <strong key="d5">Effacement</strong>,
            <span key="p5" className="text-foreground">Demander la suppression des données le concernant</span>,
            <span key="s5" className="text-[11.5px] font-medium text-foreground/70">RGPD art. 17</span>,
          ],
          [
            <strong key="d6">Limitation</strong>,
            <span key="p6" className="text-foreground">Demander le gel temporaire du traitement</span>,
            <span key="s6" className="text-[11.5px] font-medium text-foreground/70">RGPD art. 18</span>,
          ],
          [
            <strong key="d7">Portabilité</strong>,
            <span key="p7" className="text-foreground">Recevoir ses données dans un format structuré et réutilisable</span>,
            <span key="s7" className="text-[11.5px] font-medium text-foreground/70">RGPD art. 20</span>,
          ],
          [
            <strong key="d8">Réclamation</strong>,
            <span key="p8" className="text-foreground">Saisir la CNIL</span>,
            <span key="s8" className="text-[11.5px] font-medium text-foreground/70">RGPD art. 77</span>,
          ],
        ]}
      />

      <H2>7. Ce qui relève de votre responsabilité, et non de celle de Métis</H2>
      <p className="text-[13px] text-foreground leading-relaxed">
        Métis intervient exclusivement en qualité de sous-traitant. Il met à votre disposition un outil
        conforme et une documentation, mais il ne peut ni vérifier ni garantir la manière dont vous
        l&apos;utilisez. En cas de manquement, la responsabilité vous incombe en tant que responsable de traitement.
      </p>
      <p className="text-[13px] text-foreground leading-relaxed">Métis ne peut notamment pas garantir :</p>
      <ul className="space-y-2.5">
        <PlainLi>que vous ayez consulté votre CSE avant le déploiement ;</PlainLi>
        <PlainLi>que vos salariés aient été effectivement informés ;</PlainLi>
        <PlainLi>que votre test de mise en balance existe et soit documenté ;</PlainLi>
        <PlainLi>que la base légale que vous avez retenue soit adaptée à votre situation ;</PlainLi>
        <PlainLi>que vos utilisateurs aient réellement informé les participants avant d&apos;enregistrer ;</PlainLi>
        <PlainLi>que l&apos;attestation cochée par un organisateur corresponde à la réalité.</PlainLi>
      </ul>

      <H2>8. Ce que Métis garantit de son côté</H2>
      <ul className="space-y-2">
        <SrcLi src="Art. 28.3.a" desc="un traitement conforme à vos instructions documentées." />
        <SrcLi src="Art. 28.3.b" desc="la confidentialité des personnes autorisées à traiter les données." />
        <SrcLi src="Art. 28.3.c et art. 32" desc="des mesures de sécurité adaptées au risque." />
        <SrcLi src="Art. 28.2 et 28.4" desc="le recours à des sous-traitants ultérieurs,Gladia pour la transcription, Mistral pour l'analyse,encadrés par contrat." />
        <SrcLi src="Art. 28.3.e" desc="l'assistance dans la réponse aux demandes d'exercice des droits." />
        <SrcLi src="Art. 28.3.g" desc="la suppression ou la restitution des données en fin de prestation." />
        <SrcLi src="Chap. V" desc="un hébergement intégralement européen, sans transfert hors Union." />
        <SrcLi src="Art. 5.1.c et 5.1.e" desc="la suppression de l'audio brut dès que le compte rendu est produit." />
        <SrcLi src="Art. 25" desc="une conception intégrant la protection des données dès l'origine." />
      </ul>

      <H2>9. Sanctions encourues en cas de manquement</H2>
      <LegalTable
        headers={["Manquement", "Sanction", "Source"]}
        rows={[
          [
            <span key="m1" className="text-foreground">Violation des principes, bases légales ou droits des personnes</span>,
            <span key="s1" className="text-foreground">Jusqu&apos;à 20 000 000 € ou 4 % du chiffre d&apos;affaires mondial annuel</span>,
            <span key="ref1" className="text-[11.5px] font-medium text-foreground/70">RGPD art. 83.5</span>,
          ],
          [
            <span key="m2" className="text-foreground">Manquement aux obligations du responsable de traitement</span>,
            <span key="s2" className="text-foreground">Jusqu&apos;à 10 000 000 € ou 2 % du chiffre d&apos;affaires mondial annuel</span>,
            <span key="ref2" className="text-[11.5px] font-medium text-foreground/70">RGPD art. 83.4</span>,
          ],
          [
            <span key="m3" className="text-foreground">Dommage causé à une personne concernée</span>,
            <span key="s3" className="text-foreground">Droit à réparation du préjudice matériel ou moral</span>,
            <span key="ref3" className="text-[11.5px] font-medium text-foreground/70">RGPD art. 82</span>,
          ],
          [
            <span key="m4" className="text-foreground">Enregistrement sans consentement par un de vos collaborateurs</span>,
            <span key="s4" className="text-foreground">1 an d&apos;emprisonnement et 45 000 € d&apos;amende,responsabilité pénale personnelle de son auteur</span>,
            <span key="ref4" className="text-[11.5px] font-medium text-foreground/70">Code pénal art. 226-1 et art. 121-1</span>,
          ],
          [
            <span key="m5" className="text-foreground">Absence d&apos;information des salariés</span>,
            <span key="s5" className="text-foreground">Dispositif inopposable, preuves écartées en contentieux prud&apos;homal</span>,
            <span key="ref5" className="text-[11.5px] font-medium text-foreground/70">Code du travail art. L1222-4</span>,
          ],
          [
            <span key="m6" className="text-foreground">Absence de consultation du CSE</span>,
            <span key="s6" className="text-foreground">Délit d&apos;entrave, et suspension possible du dispositif</span>,
            <span key="ref6" className="text-[11.5px] font-medium text-foreground/70">Code du travail art. L2312-8 et L2317-1</span>,
          ],
        ]}
      />

      <Disclaimer>
        Cette notice est un document d&apos;information. Elle ne constitue pas un avis juridique et ne dispense pas
        votre entreprise de faire valider son déploiement par son DPO ou par un conseil spécialisé.
      </Disclaimer>
    </LegalPage>
  );
}
