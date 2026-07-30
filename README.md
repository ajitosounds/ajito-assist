# AJITO Assist Base v1

## 役割
- Google Drive: 編集・保管・バックアップの基地
- 公開Web: ユーザーが開く最新版
- app/index.html: 表示アプリ
- data/*.json: FAQ、Manual、Video、Diagnostic、Gota's Tips
- manual/: 公式PDF
- videos/: 承認済み動画

## Google Driveでの使い方
1. このフォルダー一式をGoogle Driveへアップロード
2. FAQ更新時は data/faq.json を編集
3. 動画追加時は videos/ にファイルを置き data/videos.json を更新
4. 公開時はフォルダー一式をWebサーバーまたはGitHub Pagesへ同期

## 重要
Google Driveの通常共有リンクはWebアプリの安定配信先としては使いません。
Driveは編集基地、GitHub Pages / Cloudflare Pages / 自社サーバーを公開先にします。

## ローカル確認
ブラウザの file:// では fetch が制限される場合があります。
フォルダー内で次を実行:
python3 -m http.server 8000
その後 http://localhost:8000/app/ を開きます。
