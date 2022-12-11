# NOTE

## 環境変数

環境変数は下記に定義する。

- ローカル環境  
  プロジェクト直下に `.env.local` を作成し、変数を定義する。
- CI 環境および本番環境  
  GitHub > Secrets > Actions に定義する。

下記の環境変数を定義する必要がある。

```:
REACT_APP_OPEN_WEATHER_MAP_API_KEY=xxx
```

以上
