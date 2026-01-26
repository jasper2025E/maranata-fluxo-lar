export interface BibleVerse {
  text: string;
  reference: string;
}

const verses: BibleVerse[] = [
  // Fé e Confiança
  { text: "Porque eu sei os planos que tenho para vocês, diz o Senhor, planos de paz e não de mal, para dar-lhes um futuro e uma esperança.", reference: "Jeremias 29:11" },
  { text: "Tudo posso naquele que me fortalece.", reference: "Filipenses 4:13" },
  { text: "O Senhor é o meu pastor, nada me faltará.", reference: "Salmo 23:1" },
  { text: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.", reference: "Provérbios 3:5" },
  { text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus.", reference: "Isaías 41:10" },
  { text: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.", reference: "Salmo 37:5" },
  { text: "O Senhor é a minha luz e a minha salvação; a quem temerei?", reference: "Salmo 27:1" },
  { text: "Mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias.", reference: "Isaías 40:31" },
  
  // Sabedoria e Direção
  { text: "O princípio da sabedoria é o temor do Senhor, e o conhecimento do Santo é prudência.", reference: "Provérbios 9:10" },
  { text: "Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.", reference: "Salmo 119:105" },
  { text: "Se algum de vocês tem falta de sabedoria, peça-a a Deus, que a todos dá livremente.", reference: "Tiago 1:5" },
  { text: "Bem-aventurado o homem que acha sabedoria, e o homem que adquire conhecimento.", reference: "Provérbios 3:13" },
  { text: "Ensina-nos a contar os nossos dias, para que alcancemos coração sábio.", reference: "Salmo 90:12" },
  { text: "Instrui o menino no caminho em que deve andar, e até quando envelhecer não se desviará dele.", reference: "Provérbios 22:6" },
  
  // Força e Coragem
  { text: "Seja forte e corajoso! Não se apavore nem desanime, pois o Senhor, o seu Deus, estará com você por onde você andar.", reference: "Josué 1:9" },
  { text: "O Senhor é a minha força e o meu escudo; nele o meu coração confia, e dele recebo ajuda.", reference: "Salmo 28:7" },
  { text: "Quando passares pelas águas, estarei contigo; e quando pelos rios, eles não te submergirão.", reference: "Isaías 43:2" },
  { text: "O Senhor é o meu rochedo, a minha fortaleza e o meu libertador.", reference: "Salmo 18:2" },
  { text: "Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum, porque tu estás comigo.", reference: "Salmo 23:4" },
  
  // Amor e Graça
  { text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", reference: "João 3:16" },
  { text: "Mas Deus prova o seu amor para conosco, em que Cristo morreu por nós, sendo nós ainda pecadores.", reference: "Romanos 5:8" },
  { text: "O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.", reference: "1 Coríntios 13:4" },
  { text: "A graça do Senhor Jesus Cristo seja com todos vós.", reference: "Apocalipse 22:21" },
  { text: "Misericordioso e piedoso é o Senhor, longânimo e grande em benignidade.", reference: "Salmo 103:8" },
  
  // Paz e Descanso
  { text: "Deixo-vos a paz, a minha paz vos dou; não vo-la dou como o mundo a dá.", reference: "João 14:27" },
  { text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", reference: "Mateus 11:28" },
  { text: "E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos pensamentos em Cristo Jesus.", reference: "Filipenses 4:7" },
  { text: "Em paz me deitarei e logo dormirei, porque só tu, Senhor, me fazes habitar em segurança.", reference: "Salmo 4:8" },
  { text: "Tu conservarás em paz aquele cuja mente está firme em ti, porque ele confia em ti.", reference: "Isaías 26:3" },
  
  // Trabalho e Diligência
  { text: "E tudo quanto fizerdes, fazei-o de todo o coração, como ao Senhor e não aos homens.", reference: "Colossenses 3:23" },
  { text: "Comete ao Senhor as tuas obras, e os teus pensamentos serão estabelecidos.", reference: "Provérbios 16:3" },
  { text: "A mão dos diligentes dominará, mas os preguiçosos serão sujeitos a trabalhos forçados.", reference: "Provérbios 12:24" },
  { text: "Não nos cansemos de fazer o bem, pois no tempo próprio colheremos, se não desanimarmos.", reference: "Gálatas 6:9" },
  { text: "Portanto, meus amados irmãos, sede firmes e constantes, sempre abundantes na obra do Senhor.", reference: "1 Coríntios 15:58" },
  
  // Gratidão e Louvor
  { text: "Este é o dia que o Senhor fez; regozijemo-nos e alegremo-nos nele.", reference: "Salmo 118:24" },
  { text: "Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco.", reference: "1 Tessalonicenses 5:18" },
  { text: "Ó Senhor, tu és o meu Deus; exaltar-te-ei e louvarei o teu nome.", reference: "Isaías 25:1" },
  { text: "Louvai ao Senhor, porque ele é bom; porque a sua benignidade dura para sempre.", reference: "Salmo 136:1" },
  { text: "Bendize, ó minha alma, ao Senhor, e tudo o que há em mim bendiga o seu santo nome.", reference: "Salmo 103:1" },
  
  // Esperança e Futuro
  { text: "Porque para Deus nada é impossível.", reference: "Lucas 1:37" },
  { text: "E eis que estou convosco todos os dias, até a consumação dos séculos.", reference: "Mateus 28:20" },
  { text: "Ora, o Deus de esperança vos encha de todo o gozo e paz no vosso crer.", reference: "Romanos 15:13" },
  { text: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.", reference: "Romanos 8:28" },
  { text: "Eis que faço novas todas as coisas.", reference: "Apocalipse 21:5" },
  
  // Liderança e Serviço
  { text: "Aquele que quiser tornar-se grande entre vós, será esse o que vos sirva.", reference: "Mateus 20:26" },
  { text: "Apascenta as minhas ovelhas.", reference: "João 21:17" },
  { text: "Os lábios do justo apascentam a muitos, mas os tolos morrem por falta de entendimento.", reference: "Provérbios 10:21" },
  { text: "Antes, sede uns para com os outros benignos, misericordiosos, perdoando-vos uns aos outros.", reference: "Efésios 4:32" },
  { text: "Ninguém tem maior amor do que este: de dar alguém a sua vida pelos seus amigos.", reference: "João 15:13" },
];

export function getRandomVerse(): BibleVerse {
  const randomIndex = Math.floor(Math.random() * verses.length);
  return verses[randomIndex];
}

export default verses;
