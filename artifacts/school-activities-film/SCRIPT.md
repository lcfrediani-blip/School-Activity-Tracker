# FuoriClasse — Video di presentazione

## Trattamento

- **Promessa:** FuoriClasse rende visibile tutto il percorso extrascolastico dello studente, dalle ore registrate al monitoraggio del professore.
- **Identità:** crema caldo, blu notte, corallo tenue e tipografia sans geometrica; il blu dà struttura, il corallo segnala attività e momenti di passaggio.
- **Hero:** un telefono astratto composto dagli stessi moduli dell’app; il telefono si apre, si scompone in schede e si ricompone nel lockup finale.
- **Movimento:** scale-through del telefono, card che si impilano e si scompongono, contatori guidati dal tempo di scena, aperture circolari e split verticali.
- **Arco:** aggancio immediato sul nome e sul gesto di registrare; crescita attraverso ore e attività; allargamento alla vista del professore; chiusura calma sul brand.
- **Payoff:** la pila di schermate del percorso diventa un’unica forma circolare che riapre il primo frame, rendendo il loop intenzionale.
- **Formato:** 9:16 verticale, pensato per una visualizzazione su smartphone.
- **Audio:** base strumentale leggera e ritmica, senza voce e senza effetti sonori dedicati.

## Timeline

| Shot | Tempo | Focus | Movimento dominante | Passaggio |
| --- | --- | --- | --- | --- |
| 01 | 0.00–4.50s | Il percorso prende forma | Telefono in scala + tre pop di card | Il cerchio dell’icona diventa il contatore |
| 02 | 4.50–9.00s | Le ore diventano un riepilogo | Odometer a scatti + arco che si completa | L’arco ruota e diventa la card attività |
| 03 | 9.00–14.00s | Registrare è semplice | Form che si compone per split | La riga data si espande in una lista |
| 04 | 14.00–20.00s | Il professore vede il gruppo | Pila di profili + camera pull-back | La griglia si comprime in un anello |
| 05 | 20.00–25.00s | Un posto per il percorso | Lockup centrato + ring loop | L’anello torna al cerchio iniziale |

## Shot 01 — 0.00–4.50s — “IL TUO PERCORSO”

- **Scopo:** far capire entro il primo secondo che il soggetto è un’app mobile per seguire il percorso scolastico oltre le lezioni.
- **Testo esatto:** `FUORICLASSE` a 0.35s; `Il tuo percorso, oltre i banchi.` a 1.15s; `ore · attività · crescita` a 3.05s.
- **Composizione:** sfondo crema pieno; telefono blu notte grande, leggermente ruotato, centrato nella metà bassa; tre card corallo entrano dai bordi con icone lineari.
- **Idea visiva:** il telefono non scivola soltanto: si apre da un piccolo rettangolo verticale a una schermata completa, come se il percorso si stesse rivelando.
- **Coreografia:** 0.00–0.35s un piccolo ring corallo pulsa; 0.20–0.90s il telefono scala da 0.72 a 1.00 con un breve overshoot; 0.55–1.20s il nome si rivela per maschera verticale; 1.30–2.10s arrivano tre card con pop sfalsati; 2.30–3.40s la rotazione del telefono si assesta e la sottolineatura si traccia; 3.40–4.50s il ring del telefono cresce fino a riempire il frame.
- **Handoff:** il ring finale mantiene il centro e diventa l’arco del contatore nello Shot 02; il campo crema non viene lasciato vuoto.
- **Tecnica:** Framer Motion, clip-path circolare, card CSS, icone SVG inline, nessun asset fotografico.
- **Suono:** apertura della base musicale, ritmo leggero; nessun beat dichiarato come sincronizzato.

## Shot 02 — 4.50–9.00s — “OGNI ORA CONTA”

- **Scopo:** rendere concreta la promessa con il totale delle ore.
- **Testo esatto:** `OGNI ORA CONTA.` a 4.75s; `12h` a 5.40s; `di attività registrate` a 6.35s; `Il tuo riepilogo cresce con te.` a 7.35s.
- **Composizione:** sfondo blu notte; grande card crema centrata, arco corallo dietro il numero, mini-card di attività disposte in diagonale sui bordi.
- **Idea visiva:** il numero è un odometro che passa per quattro stati, mentre l’arco diventa una lancetta e poi una cornice.
- **Coreografia:** 0.00–0.45s il cerchio ereditato si chiude in arco; 0.30–1.60s il contatore passa `0` → `3` → `7` → `12`; 0.70–2.20s l’arco ruota di 180° e si completa; 1.70–2.60s due mini-card si agganciano alla card principale; 2.80–3.70s la frase di supporto entra dal basso; 3.70–4.50s la card si apre verticalmente e rivela la prima riga del form successivo.
- **Handoff:** la riga crema che si apre è la riga “Tipologia attività” dello Shot 03; il blu notte resta come fascia laterale per il match cut.
- **Tecnica:** timer di scena per il contatore, transform e clip-path, nessun layout reflow.
- **Suono:** parte centrale della base, più presente ma ancora morbida.

## Shot 03 — 9.00–14.00s — “REGISTRA. RICORDA. CRESCI.”

- **Scopo:** mostrare che registrare un’esperienza richiede pochi dati, senza reintrodurre una scelta a chip.
- **Testo esatto:** `REGISTRA.` a 9.30s; `RICORDA.` a 10.00s; `CRESCI.` a 10.70s; `Tipologia attività` a 11.65s; `Data · Luogo · Ore` a 12.75s.
- **Composizione:** sfondo corallo; una form crema alta occupa il centro, con titolo in alto e tre righe visibili; il testo principale è fuori dalla form nella parte superiore.
- **Idea visiva:** il form si compone come un nastro piegato: la prima riga entra orizzontalmente, le altre due si rivelano da sotto, mostrando la progressione senza simulare un tap interattivo.
- **Coreografia:** 0.00–0.40s il campo corallo arriva con split verticale; 0.25–1.05s le tre parole compaiono una alla volta in una colonna; 0.90–1.65s la form ruota da -4° a 0° e si mette a fuoco; 1.45–2.35s la prima riga si scrive con una barra di accento; 2.35–3.15s data, luogo e ore si allineano; 3.15–4.00s la card si solleva e lascia una scia blu; 4.00–5.00s la scia si allarga in più righe, preparando la lista dei profili.
- **Handoff:** la scia blu attraversa la stessa coordinata verticale della lista nello Shot 04; il movimento continua senza wipe generico.
- **Tecnica:** split clip-path, piccola rotazione, righe CSS, maschere di testo, linee SVG.
- **Suono:** il ritmo si apre brevemente durante la composizione del form.

## Shot 04 — 14.00–20.00s — “UNA VISTA PER IL PROFESSORE”

- **Scopo:** comunicare che l’area Professore permette di vedere tutti gli alunni e aprire il dettaglio delle attività.
- **Testo esatto:** `UNA VISTA PER IL PROFESSORE` a 14.25s; `Tutti gli alunni` a 15.10s; `attività registrate` a 16.15s; `Monitoraggio` a 18.00s.
- **Composizione:** sfondo crema; quattro card profilo corallo/blu entrano come pila verticale nella metà centrale; un pannello blu più grande si apre dietro con il titolo Monitoraggio.
- **Idea visiva:** la singola riga dello Shot 03 si moltiplica in persone, poi la camera arretra per mostrare il gruppo completo.
- **Coreografia:** 0.00–0.70s la prima card attraversa la scia e si ferma; 0.45–1.60s altre tre card si impilano con offset verticale e rotazioni opposte; 1.30–2.40s il pannello blu cresce dietro di loro; 2.10–3.20s la camera fa pull-back e rivela l’intestazione; 3.20–4.10s appaiono due micro-righe di attività dentro il pannello; 4.10–5.20s le card orbitano verso un anello centrale; 5.20–6.00s l’anello si stabilizza e porta il colore blu al fondo dello Shot 05.
- **Handoff:** l’anello centrale diventa il contorno del lockup finale; la camera non taglia su un campo vuoto.
- **Tecnica:** profondità CSS, transform parent, card con z-index, arco SVG e pull-back di gruppo.
- **Suono:** piccolo sollevamento musicale verso la chiusura.

## Shot 05 — 20.00–25.00s — “TUTTO IN UN POSTO”

- **Scopo:** chiudere con un nome memorabile e un messaggio semplice.
- **Testo esatto:** `FUORICLASSE` a 20.70s; `Il tuo percorso, tutto in un posto.` a 21.65s; `Cresci oltre i banchi.` a 23.05s.
- **Composizione:** sfondo blu notte; lockup crema centrato, ring corallo grande dietro, tre piccoli segni corallo si assestano come costellazione.
- **Idea visiva:** le attività e i profili non spariscono: si comprimono nello stesso ring che ha aperto il film.
- **Coreografia:** 0.00–0.80s l’anello ereditato si espande e si semplifica; 0.50–1.35s il wordmark entra in due blocchi, `FUORI` e `CLASSE`, con distanza che si riduce; 1.35–2.25s la frase principale si rivela dall’alto; 2.25–3.25s tre segni corallo arrivano dall’esterno e si fermano; 3.25–4.40s il ring pulsa una volta e il sottotitolo compare; 4.40–5.00s il ring cresce fino a diventare il piccolo cerchio corallo del primo frame, pronto al loop.
- **Handoff:** il piccolo cerchio finale coincide con il ring di apertura, senza dissolvenza su una schermata vuota.
- **Tecnica:** wordmark in due span, maschera circolare, pulsazione controllata, chiusura cromatica.
- **Suono:** chiusura risolta della base musicale; il loop torna all’inizio.

## Verifica di varietà

- Gli shot adiacenti cambiano almeno due dimensioni: campo cromatico, scala del soggetto, composizione e meccanica dominante.
- Ogni shot ha un evento dopo l’entrata iniziale: contatore, righe del form, pull-back della camera, pulsazione del lockup.
- Il testo resta dentro la safe area centrale del 9:16.
- Nessun finale di shot lascia un campo vuoto: ogni chiusura porta un ring, una riga o una card nello shot successivo.
- Nessun elemento della composizione è interattivo; i controlli di anteprima restano esterni al film.