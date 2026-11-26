# Chama Play — site

Site estático (uma página) da **Chama Play**, selo, gravadora e produtora sertaneja especialista em gestão de carreiras artísticas.

Mesma linguagem cinematográfica do site da Bravuno Music: fundo escuro, a chama surgindo da luz, títulos pesados com destaque em itálico dourado, tour "da composição ao palco" fixado na rolagem e cursor de brasa.

## Estrutura
- `index.html`, `styles.css`, `main.js`: o site, sem build.
- `assets/`: recortes da logo (`chama-mark.png` só a chama, `chama-logo.png`, `chama-wordmark.png`, `favicon.png`). Original em `assets/original/`.
- `tools/build_assets.py`: gera os recortes a partir do original (`python tools/build_assets.py assets/original/chama-play-logo.png`, precisa de pillow e numpy).

## Paleta (medida na logo)
- Fundo `#070502`; ouro `#9b6a0d` → `#cd9c1c` → `#eecc25` (degradê metálico em botões e destaques); prata `#bababb` (o "PLAY").
- Fontes: Manrope (títulos), Inter (texto), Montserrat (marca).

## Rodar local
```
python3 -m http.server 8000
```
Ao mudar CSS/JS em produção, suba o `?v=` nos endereços do `index.html` (cache).

## Conteúdo
Textos tirados do Instagram @chamaplay, do Linktree e de matérias sobre o selo Chama Nóis. Validar com a Chama Play antes de divulgar.
