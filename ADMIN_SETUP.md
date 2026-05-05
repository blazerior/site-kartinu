# Админка — настройка

Тонкий фронтенд на GitHub Pages + GitHub Actions, который добавляет/удаляет картины и сам заливает изменения на FTP.

## Что произойдёт под капотом

1. Вы открываете `https://<owner>.github.io/<repo>/admin/`
2. Логинитесь по GitHub username + Personal Access Token (PAT)
3. На вкладке «Добавить»: выбираете серию, прикрепляете файл, заполняете поля → жмёте Submit
4. Браузер кодирует файл в base64 и кладёт его в репозиторий в папку `_uploads/` (через GitHub Contents API)
5. Браузер отправляет `repository_dispatch` событие → стартует workflow
6. Workflow:
   - Парсит payload
   - Перемещает файл из `_uploads/` в `images/<Название картины>.<ext>`
   - Добавляет блок `<article class="work-item">` в нужный `series-X.html`
   - Добавляет блок `<div class="card">` в `index.html`
   - Перенумеровывает все работы в серии, обновляет счётчик
   - Перестраивает `data/index.json` (для дропдаунов фронта)
   - Заливает изменённые файлы по FTP
   - Коммитит и пушит изменения в репозиторий

## Один раз: настройка репо

### 1. Секрет в GitHub Actions

`Settings → Secrets and variables → Actions → New repository secret`

| Имя | Значение |
|---|---|
| `FTP_PASSWORD` | пароль FTP-юзера `ekater3com` |

(Логин, хост, порт и корневая папка прописаны в workflow.)

### 2. Включить GitHub Pages для папки `admin/`

Один из двух вариантов:

**A. Из ветки main, путь `/admin`**
   - `Settings → Pages → Build and deployment → Source: Deploy from a branch`
   - Branch: `main`, Folder: `/admin` (если такого варианта нет — используйте `/(root)` и тогда путь будет `https://<owner>.github.io/<repo>/admin/`)

**B. Через workflow** — если хотите оставить корень репо для основного сайта.

Если основной сайт уже задеплоен с GitHub Pages, просто откройте `…/admin/`.

### 3. Создать Fine-grained PAT

`https://github.com/settings/personal-access-tokens/new`

- **Resource owner**: ваш аккаунт
- **Repository access**: Only select repositories → выберите этот репо
- **Permissions** → Repository permissions:
  - **Contents**: Read and write
  - **Actions**: Read and write
  - **Metadata**: Read (включится автоматически)
- Срок действия — на ваше усмотрение (можно «No expiration» для удобства, либо ротация раз в N месяцев)

Сохраните токен — он показывается **один раз**.

### 4. Прогнать workflow один раз вручную

При первом запуске нужно создать `data/index.json`. Запустите дамми-событие:

```bash
gh api -X POST repos/<owner>/<repo>/dispatches \
  -f event_type=paintings-update \
  -f 'client_payload={"action":"noop"}'
```

(Workflow упадёт на «Unknown action: noop», но `build_index.py` сработает на следующем валидном запуске. Альтернатива — запустить локально:
```bash
pip install beautifulsoup4
python scripts/admin/build_index.py
git add data/index.json && git commit -m "Initial index" && git push
```
)

## Использование

1. Откройте `https://<owner>.github.io/<repo>/admin/`
2. Заполните `Repo` (`<owner>/<repo>`), username и PAT → «Войти»
3. **Добавить**: выберите серию, прикрепите изображение, заполните поля → Submit
4. **Удалить**: выберите серию → выберите картину → Удалить
5. Подождите 1–2 минуты — лог в самом низу покажет статус

## Структура файлов

```
.github/workflows/update-paintings.yml   ← триггер: repository_dispatch
scripts/admin/
  apply_change.py    ← модифицирует HTML, перемещает изображение
  build_index.py     ← пересобирает data/index.json
  ftp_deploy.py      ← заливает изменённое на FTP
admin/
  index.html         ← фронтенд (GitHub Pages)
  style.css
  app.js             ← логика: GitHub API + UI
data/index.json      ← каталог для дропдаунов (генерируется автоматически)
_uploads/            ← временное место для загруженных файлов
ADMIN_SETUP.md       ← вы здесь
```

## Чего нет / что можно добавить позже

- **Редактирование** — только добавление/удаление. Чтобы поменять название/размер, удалите и добавьте снова.
- **EN-перевод** для добавляемой картины не подставляется (карточка остаётся одноязычной). Можно дописать вручную в `script.js`.
- **Перетаскивание порядка** в галерее — нет; новая картина всегда добавляется в конец.
- **Несколько ракурсов** на одну работу (`work-thumbs`) — пока не поддерживается.

## Возможные проблемы

- **«не удалось проверить токен»** — проверьте, что PAT не истёк и имеет нужные scope'ы
- **Workflow падает на FTP** — проверьте `FTP_PASSWORD` в секретах
- **Картина не появилась на сайте** — браузер мог закешировать `index.html`; обновите с Ctrl+F5
- **Кириллица в имени файла** — поддерживается, но если хостинг чувствителен к кодировке URL, FTP-путь может ломаться. В этом случае имеет смысл расширить `sanitize_filename()` транслитерацией.
