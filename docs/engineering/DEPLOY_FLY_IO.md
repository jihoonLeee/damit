# DEPLOY_FLY_IO

## 목적

- `현장 추가금 합의 비서`를 첫 외부 파일럿용으로 Fly.io에 배포한다.
- 구조는 `앱 1대 + Fly volume + SQLite`를 기준으로 한다.

## 현재 전제

- 앱은 Node 24 기반이다.
- 저장 엔진은 `SQLite`다.
- SQLite 파일은 volume 경로에 저장한다.
- 수평 확장은 하지 않는다.

## 준비 파일

- [fly.toml](/D:/AI_CODEX_DESKTOP/fly.toml)
- [Dockerfile](/D:/AI_CODEX_DESKTOP/Dockerfile)
- [.dockerignore](/D:/AI_CODEX_DESKTOP/.dockerignore)

## 배포 전 수정할 것

- [fly.toml](/D:/AI_CODEX_DESKTOP/fly.toml)의 `app` 이름을 실제 고유 이름으로 변경
- region은 필요하면 변경
- OWNER_TOKEN은 Fly secret으로 넣기

## 권장 배포 순서

1. Fly 앱 생성
```bash
fly launch --no-deploy
```

2. volume 생성
```bash
fly volumes create app_data --size 1 --region nrt
```

3. secret 설정
```bash
fly secrets set OWNER_TOKEN=your-strong-token
```

4. 첫 배포
```bash
fly deploy
```

5. 상태 확인
```bash
fly status
fly logs
```

## 배포 후 확인

- `GET /api/v1/health`
- `GET /api/v1/admin/storage-status`
- 업로드/초안/합의 기록 P0 흐름 1회

## 운영 원칙

- 한 번에 한 머신만 운영한다.
- volume은 삭제하지 않는다.
- 파일럿 시작 전에는 `reset:data` 또는 admin reset으로 초기화한다.
- 중요한 세션 전에는 backup을 한 번 만든다.

## 주의점

- SQLite이므로 scale count를 늘리지 않는다.
- Fly volume은 region 종속이므로 region을 자주 바꾸지 않는다.
- OWNER_TOKEN은 절대 fly.toml에 직접 넣지 않는다.

## PM 판단

- 첫 외부 파일럿 배포 방식으로 충분히 현실적이다.
- 사용자가 붙고 반복 운영이 시작되면 다음 단계에서 Postgres 분리를 검토한다.
