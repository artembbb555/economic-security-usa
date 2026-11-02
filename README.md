# Економічна безпека США — GitHub Pages

Автор: Токар · Рік: 2026 · Країна: США (USA).

## Зміст

- `index.html`: головна, інформація про автора й проєкт.
- `analysis.html`: інтерактивні таблиці, динаміка, пороги, висновки та джерела.
- `app.js`: дані WDI США 2023–2024, формули, класифікація, графіки SVG, CSV-експорт.
- `styles.css`: адаптивний дизайн без фреймворків.

Зафіксований зріз World Bank WDI від 02.11.2026. Дані вбудовані у `app.js`, тому США працює без інтернету; інші країни (опціональний режим) потребують доступного World Bank API. Значення деяких часових точок округлені, тому числові співвідношення побудовані із явно зазначених заокруглених значень. Для будь-якого коефіцієнта чисельник та знаменник беруться за один рік.

Для цього іспиту використовується **тільки США**. Не змінюйте країну під час захисту. Результати та пороги мають бути ті самі, що в PDF `Токар_Теорія.pdf`. Офіційні дані можуть пізніше переглядатися, тому історичні числові оцінки у звіті відповідають даті 02.11.2026.

### До здачі

Автор має дописати повне ПІБ та **реальні контактні дані** у `index.html`. Для додавання контактів використовуйте власні дані; не публікуйте приватні відомості, які не хочете розкривати.

### Публікація GitHub Pages

1. Створіть публічний GitHub-репозиторій (наприклад `economic-security-usa`).
2. Завантажте *файли з цієї папки* в корінь репозиторію.
3. GitHub → Settings → Pages → Deploy from a branch → `main` і `/(root)` → Save.
4. Перевірте у приватній вкладці `https://USERNAME.github.io/economic-security-usa/` та `/analysis.html`.
5. Лише після цього створіть `Токар_Посилання.pdf` з реальним відкритим URL сайту й URL репозиторію.

### Першоджерела

Світовий банк World Development Indicators: `AG.YLD.CREL.KG`, `SP.DYN.LE00.FE.IN`, `SP.DYN.LE00.MA.IN`, `SP.DYN.IMRT.FE.IN`, `SP.DYN.IMRT.MA.IN`, `NE.EXP.GNFS.ZS`, `NE.IMP.GNFS.ZS`, `GB.XPD.RSDV.GD.ZS`, `SI.DST.10TH.10`, `SI.DST.FRST.10`, `GC.DOD.TOTL.GD.ZS`.

Перевірка окремих значень:
- https://data.worldbank.org/indicator/AG.YLD.CREL.KG?locations=US
- https://data.worldbank.org/indicator/GB.XPD.RSDV.GD.ZS?locations=US
- https://data.worldbank.org/indicator/SI.DST.10TH.10?locations=US
- https://data.worldbank.org/indicator/SI.DST.FRST.10?locations=US
- https://fred.stlouisfed.org/series/DEBTTLUSA188A
- https://genderdata.worldbank.org/en/indicator/sp-dyn-le00-in
- https://macrovedia.com/series/210f014c2c329147/
- https://macrovedia.com/series/647415058e722985/
- https://app.indexbox.io/indicators/symbol/exports-of-goods-and-services-percent-of-gdp-united-states/
- https://app.indexbox.io/indicators/symbol/imports-of-goods-and-services-percent-of-gdp-united-states/

Порогові шкали відтворено зі скриншотів екзаменаційного файлу, наданих користувачем. Застосовано шість рівнів від «Абсолютна небезпека» до «Оптимальний». Без ваг не обчислюється інтегральний бал.
