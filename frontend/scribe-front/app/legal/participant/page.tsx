import Link from "next/link";
import { SrcLi } from "@/app/legal/_helpers";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[680px] mx-auto px-4 sm:px-8 py-12">
        <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground mb-6">
          Metis · Conformité
        </p>
        {children}
      </div>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[15px] font-semibold text-foreground mt-8 mb-3">{children}</h2>;
}

function PlainLi({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-[13px] text-foreground leading-relaxed">
      <span className="mt-[7px] w-1 h-1 rounded-full shrink-0 bg-muted-foreground/40" />
      <span>{children}</span>
    </li>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4 text-[13px] leading-relaxed bg-accent border border-border text-foreground">
      {children}
    </div>
  );
}

function LegalTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-[12.5px] border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left text-[11px] uppercase tracking-wide font-medium text-muted-foreground py-2.5 px-4"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i < rows.length - 1 ? "border-b border-border/40" : ""}>
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 px-4 text-foreground align-top leading-relaxed">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ParticipantPage() {
  return (
    <Shell>
      <h1 className="text-2xl font-semibold text-foreground mb-1">
        Notice d&apos;information et de consentement
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Destinée aux participants d&apos;une réunion enregistrée avec Métis
      </p>
      <div className="h-px bg-border mb-8" />

      <div className="space-y-5">
        <H2>1. Ce qui va se passer pendant cette réunion</H2>
        <p className="text-[13px] text-foreground leading-relaxed">
          La réunion à laquelle vous participez est enregistrée avec Métis. Concrètement :
        </p>
        <ul className="space-y-2.5">
          <PlainLi>L&apos;audio de la réunion est capté.</PlainLi>
          <PlainLi>
            Il est transformé en texte (transcription), et chaque prise de parole est attribuée à un
            « Intervenant » (Intervenant A, Intervenant B…) sans chercher à identifier qui vous êtes à partir
            de votre voix.
          </PlainLi>
          <PlainLi>
            Un compte rendu est ensuite généré : résumé, décisions, actions à suivre.
          </PlainLi>
          <PlainLi>L&apos;audio brut est supprimé dès que ce compte rendu est produit.</PlainLi>
        </ul>

        <H2>2. Qui est responsable de ce traitement</H2>
        <p className="text-[13px] text-foreground leading-relaxed">
          La personne qui a lancé l&apos;enregistrement (l&apos;organisateur de la réunion, ou l&apos;entreprise qui a
          déployé Métis) est responsable de ce traitement de vos données. Métis traite les données pour son
          compte, en tant que prestataire technique.
        </p>

        <H2>3. Vos droits</H2>
        <LegalTable
          headers={["Droit", "Ce que ça veut dire"]}
          rows={[
            [
              <strong key="d1">Information</strong>,
              <span key="p1" className="text-foreground">Savoir que vous êtes enregistré, pourquoi, et combien de temps les données seront gardées,c&apos;est l&apos;objet de cette notice.</span>,
            ],
            [
              <strong key="d2">Opposition</strong>,
              <span key="p2" className="text-foreground">Vous pouvez refuser d&apos;être enregistré. Si vous refusez, l&apos;organisateur doit s&apos;abstenir de vous enregistrer.</span>,
            ],
            [
              <strong key="d3">Accès</strong>,
              <span key="p3" className="text-foreground">Vous pouvez demander à voir ce qui a été enregistré et traité vous concernant.</span>,
            ],
            [
              <strong key="d4">Rectification</strong>,
              <span key="p4" className="text-foreground">Vous pouvez demander à corriger une information vous concernant.</span>,
            ],
            [
              <strong key="d5">Effacement</strong>,
              <span key="p5" className="text-foreground">Vous pouvez demander la suppression des données vous concernant.</span>,
            ],
            [
              <strong key="d6">Portabilité</strong>,
              <span key="p6" className="text-foreground">Vous pouvez demander une copie des données dans un format réutilisable.</span>,
            ],
          ]}
        />
        <p className="text-[12.5px] text-foreground leading-relaxed">
          Pour exercer ces droits, contactez l&apos;organisateur de la réunion ou l&apos;entreprise qui a mis en place
          Métis. Une réponse doit vous être apportée sous un mois.
        </p>

        <H2>4. Comment on vous informe et recueille votre accord</H2>
        <LegalTable
          headers={["Contexte", "Comment"]}
          rows={[
            [
              <strong key="c1">Réunion en visioconférence</strong>,
              <span key="p1" className="text-foreground">Vous recevez un lien avant la réunion. En cliquant, vous voyez ces informations et vous cochez pour accepter ou refuser, avant de rejoindre la réunion. Si vous arrivez en retard, vous avez accès au même lien.</span>,
            ],
            [
              <strong key="c2">Réunion en présentiel</strong>,
              <span key="p2" className="text-foreground">L&apos;organisateur vous informe à l&apos;oral avant de démarrer l&apos;enregistrement. Votre accord ou refus est recueilli oralement.</span>,
            ],
          ]}
        />

        <H2>5. Si vous n&apos;êtes pas d&apos;accord</H2>
        <p className="text-[13px] text-foreground leading-relaxed">
          Vous pouvez refuser à tout moment, avant ou pendant la réunion. Un refus doit être respecté :
          l&apos;organisateur n&apos;est pas autorisé à vous enregistrer si vous vous êtes opposé.
        </p>
        <Callout>
          Si malgré votre refus vous êtes enregistré, la loi ne protège plus la personne qui a fait
          l&apos;enregistrement : c&apos;est elle qui est en tort, pas vous.
        </Callout>

        <H2>6. Ce que dit la loi</H2>
        <ul className="space-y-2">
          <SrcLi src="RGPD, articles 12 à 14" desc="vous devez être informé avant que vos données soient traitées." />
          <SrcLi src="RGPD, article 15" desc="droit d'accès à vos données." />
          <SrcLi src="RGPD, article 16" desc="droit de rectification." />
          <SrcLi src="RGPD, article 17" desc="droit à l'effacement." />
          <SrcLi src="RGPD, article 20" desc="droit à la portabilité." />
          <SrcLi src="RGPD, article 21" desc="droit d'opposition." />
          <SrcLi src="RGPD, article 12.3" desc="délai d'un mois pour vous répondre." />
          <SrcLi
            src="Code pénal, article 226-1"
            desc="enregistrer les paroles d'une personne à titre privé, sans son consentement, est puni d'un an d'emprisonnement et 45 000 € d'amende. Si vous êtes informé et que vous ne vous opposez pas alors que vous le pouviez, la loi considère votre consentement comme acquis,mais un refus explicite de votre part annule cette présomption."
          />
          <SrcLi
            src="Code du travail, article L1222-4"
            desc="si vous êtes salarié, votre employeur doit vous informer avant de mettre en place un dispositif comme Métis."
          />
        </ul>

        <p className="text-[11.5px] text-muted-foreground leading-relaxed border-t border-border pt-6 mt-2">
          Vous pouvez également adresser une réclamation à la{" "}
          <a
            href="https://www.cnil.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            CNIL
          </a>{" "}
          si vous estimez que vos droits n&apos;ont pas été respectés.
        </p>

        <div className="pt-2">
          <Link
            href="/"
            className="text-[12px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </Shell>
  );
}
