# TODO

## 環境変数

### 環境変数を定義する場所

後述の環境変数は下記に定義する。

- ローカル環境で実行する場合  
  プロジェクト直下に `.env.local` 等を作成し定義する。
- 本番環境で実行する場合  
  GitHub の Secrets > Actions に定義する。

### アプリケーションの実行に必要な最低限の定義

下記の環境変数を定義する必要がある。

```:
REACT_APP_OPEN_WEATHER_MAP_API_KEY=xxx
```

以上