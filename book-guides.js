(() => {
  const K=window.ETO_KNOWLEDGE;if(!K)return;
  const t=(ru,en,et)=>({ru,en,et});
  const labels={
    textbook:t('Учебник / систематическое изложение','Textbook / systematic account','Õpik / süstemaatiline käsitlus'),
    popular:t('Популярное изложение','Popular account','Populaarteaduslik käsitlus'),
    narrative:t('Клинические истории / эссе','Clinical narratives / essays','Kliinilised lood / esseed'),
    fiction:t('Художественная литература','Fiction','Ilukirjandus'),
    atlas:t('Атлас / учебные иллюстрации','Atlas / learning illustrations','Atlas / õppeillustratsioonid'),
    classic:t('Классический теоретический труд','Classic theoretical work','Klassikaline teoreetiline teos'),
    practice:t('Практическое руководство','Practice guide','Praktiline käsiraamat'),
    unspecified:t('Уточни автора и издание','Confirm author and edition','Täpsusta autor ja väljaanne')
  };
  const lenses={
    textbook:t('После раздела объясни механизм и его ограничения. Клинические рекомендации сверяй с актуальными руководствами.','After a section, explain the mechanism and its limits. Check clinical recommendations against current guidelines.','Pärast osa lugemist selgita mehhanismi ja piiranguid. Kliinilisi soovitusi võrdle ajakohaste juhistega.'),
    popular:t('Отделяй сильный пример от общего вывода. Проверь, какое исследование поддерживает центральный тезис.','Separate a vivid example from a general conclusion. Check which study supports the central claim.','Erista ilmekat näidet üldisest järeldusest. Kontrolli, milline uuring toetab põhiväidet.'),
    narrative:t('История помогает увидеть опыт человека. Она не оценивает распространённость явления или эффективность лечения.','A story can illuminate a person’s experience. It does not estimate prevalence or treatment effectiveness.','Lugu aitab mõista inimese kogemust. See ei hinda nähtuse levimust ega ravi tõhusust.'),
    fiction:t('Используй для обсуждения отношений, границ и этики. Сюжет не является клиническим доказательством.','Use it to discuss relationships, boundaries and ethics. A plot is not clinical evidence.','Kasuta suhete, piiride ja eetika arutamiseks. Süžee ei ole kliiniline tõend.'),
    atlas:t('Закрой подписи, найди ориентиры и объясни соседство структур. Затем проверь себя на другом ракурсе.','Cover the labels, identify landmarks and explain spatial relations. Then test yourself from another view.','Kata nimetused, leia orientiirid ja selgita ruumilisi seoseid. Seejärel kontrolli end teisest vaatenurgast.'),
    classic:t('Разделяй исторический контекст, понятия автора и современные эмпирические данные.','Distinguish historical context, the author’s concepts and contemporary empirical evidence.','Erista ajaloolist konteksti, autori mõisteid ja tänapäevaseid empiirilisi andmeid.'),
    practice:t('Спроси, для какой задачи и аудитории предложен метод. Пример техники не заменяет подготовку и оценку ситуации.','Ask which task and audience the method addresses. An example technique does not replace training and assessment.','Küsi, millise ülesande ja sihtrühma jaoks meetod mõeldud on. Tehnika näide ei asenda ettevalmistust ja olukorra hindamist.'),
    unspecified:t('В исходном списке автор не указан. До уточнения не приписываем книге конкретные тезисы.','The supplied list does not specify an author. No specific claims are attributed to this book until clarified.','Esitatud nimekirjas puudub autor. Kuni täpsustamiseni ei omistata raamatule konkreetseid väiteid.')
  };
  const groups={popular:[3,13,14,15,28,29,30,31,32,33],narrative:[20,22,23,24,25,26],fiction:[21],atlas:[34,40,41,42],classic:[4,5,8,17,18,27],practice:[16,45],unspecified:[12]};
  for(const b of K.books){const n=Number(b.id.split('-')[1]),kind=Object.keys(groups).find(k=>groups[k].includes(n))||'textbook';b.status='owned';b.format=kind;b.formatLabel=labels[kind];b.readingLens=lenses[kind]}
  const additions={
    workshop:t('Практикум по библиотеке','Library workshop','Raamatukogu praktikum'),
    workshopText:t('10 маршрутов, задачи с объяснениями, заметки к чтению и четыре интерактива.','10 routes, explained exercises, reading notes and four interactive activities.','10 rada, selgitustega ülesanded, lugemismärkmed ja neli interaktiivset tegevust.'),
    authorUnknown:t('Автор не указан — требуется уточнение','Author not specified — clarification needed','Autor pole märgitud – vajab täpsustamist'),
    noBooks:t('Книги не найдены. Измени запрос или выбери другую тему.','No books found. Change your query or topic.','Raamatuid ei leitud. Muuda otsingut või teemat.')
  };
  for(const lang of ['ru','en','et'])for(const [key,value] of Object.entries(additions))K.ui[lang][key]=value[lang];
})();
